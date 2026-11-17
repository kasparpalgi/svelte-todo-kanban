/** @file src/lib/server/ops/d1/users.ts */
// The signed-in user's row on D1, same JSON as ops/users.ts. Server tokens live in
// `user_secrets` (#232): `getMe` folds them back into `settings.tokens`, redacted, and a
// settings save never reaches them (#193).
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { board_members, boards, user_secrets, users } from '$lib/server/db/schema';
import { OpError } from '../op';
import { mergeSettings, redact } from '../users';
import type { D1Run } from './types';

// Hasura's UserFields fragment.
const columns = {
	id: true,
	name: true,
	username: true,
	image: true,
	email: true,
	locale: true,
	dark_mode: true,
	settings: true,
	default_labels: true,
	emailVerified: true,
	plan: true,
	plan_expires_at: true,
	claude_plan: true,
	claude_plan_monthly: true,
	claude_plan_currency: true,
	created_at: true,
	updated_at: true
} as const;

type Settings = Record<string, unknown> & { tokens?: Record<string, unknown> };

async function me(d1: D1, userId: string) {
	const [user, secrets] = await d1.batch([
		d1.query.users.findFirst({ columns, where: eq(users.id, userId) }),
		d1
			.select({ name: user_secrets.name, value: user_secrets.value })
			.from(user_secrets)
			.where(eq(user_secrets.user_id, userId))
	]);
	if (!user) throw new OpError(404, 'User not found');
	if (!secrets.length) return redact(user);
	const settings = user.settings as Settings;
	const tokens = {
		...settings.tokens,
		...Object.fromEntries(secrets.map((s) => [s.name, s.value]))
	};
	return redact({ ...user, settings: { ...settings, tokens } });
}

export const getMe: D1Run<'getMe'> = (ctx) => me(ctx.d1, ctx.userId);

export const updateMe: D1Run<'updateMe'> = async (ctx, { set }) => {
	// No stored server tokens to keep: they are not in `settings` on D1.
	const settings = set.settings && mergeSettings(null, set.settings as Settings);
	const values = { ...set, ...(settings && { settings }) } as Partial<typeof users.$inferInsert>;
	if (Object.keys(values).length) {
		await ctx.d1.update(users).set(values).where(eq(users.id, ctx.userId));
	}
	return me(ctx.d1, ctx.userId);
};

/** Removes a server-managed connection: on D1 that is its `user_secrets` row. */
export const disconnectIntegration: D1Run<'disconnectIntegration'> = async (ctx, { name }) => {
	await ctx.d1
		.delete(user_secrets)
		.where(and(eq(user_secrets.user_id, ctx.userId), eq(user_secrets.name, name)));
	return me(ctx.d1, ctx.userId);
};

/** Everyone the caller shares a board with (and the caller), public fields only. */
export const getBoardPeople: D1Run<'getBoardPeople'> = async ({ d1, userId }) => {
	const mine = () =>
		d1
			.select({ id: board_members.board_id })
			.from(board_members)
			.where(eq(board_members.user_id, userId));
	const ownersOfMine = d1
		.select({ id: boards.user_id })
		.from(boards)
		.where(inArray(boards.id, mine()));
	const membersOfShared = d1
		.select({ id: board_members.user_id })
		.from(board_members)
		.innerJoin(boards, eq(boards.id, board_members.board_id))
		.where(or(eq(boards.user_id, userId), inArray(boards.id, mine())));
	return d1
		.select({ id: users.id, name: users.name, username: users.username, image: users.image })
		.from(users)
		.where(
			or(eq(users.id, userId), inArray(users.id, ownersOfMine), inArray(users.id, membersOfShared))
		)
		.orderBy(sql`${users.name} is null`, sql`${users.name} collate nocase`)
		.limit(500);
};
