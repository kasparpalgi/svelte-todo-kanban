/** @file src/lib/server/ops/users.ts */
// The signed-in user's own row, and the people they share a board with (#230).
// Other users are only ever id, name, username and image.
import { z } from 'zod';
import { GET_PEOPLE, GET_USERS, UPDATE_USER } from '$lib/graphql/documents';
import { defineOp, OpError, type UserCtx } from './op';

type Settings = Record<string, unknown> & { tokens?: Record<string, unknown> };

// Tokens the browser manages itself. Every other key in `settings.tokens` (GitHub,
// Google Calendar, OpenAI, R2) is written only by the server, so a stale settings save
// from the browser can never drop or overwrite them (#193).
const CLIENT_TOKENS = new Set(['groq']);

function split(tokens: Record<string, unknown> | undefined, client: boolean) {
	return Object.fromEntries(
		Object.entries(tokens ?? {}).filter(([key]) => CLIENT_TOKENS.has(key) === client)
	);
}

/** Settings to store: the browser's, with the stored server-managed tokens kept. */
export function mergeSettings(stored: Settings | null | undefined, incoming: Settings): Settings {
	return {
		...incoming,
		tokens: { ...split(stored?.tokens, false), ...split(incoming.tokens, true) }
	};
}

/** The browser sees `encrypted: true`, never the ciphertext. */
export function redact<U extends { settings?: Settings | null }>(user: U): U {
	const tokens = user.settings?.tokens;
	if (!tokens) return user;
	const shown = Object.fromEntries(
		Object.entries(tokens).map(([key, value]) => {
			if (!value || typeof value !== 'object' || !('encrypted' in value)) return [key, value];
			return [key, { ...value, encrypted: Boolean(value.encrypted) }];
		})
	);
	return { ...user, settings: { ...user.settings, tokens: shown } };
}

async function me(ctx: UserCtx) {
	const data = await ctx.db(GET_USERS, { where: { id: { _eq: ctx.userId } }, limit: 1 });
	const user = data.users[0];
	if (!user) throw new OpError(404, 'User not found');
	return user;
}

async function save(ctx: UserCtx, set: Record<string, unknown>) {
	const data = await ctx.db(UPDATE_USER, { where: { id: { _eq: ctx.userId } }, _set: set });
	const user = data.update_users?.returning[0];
	if (!user) throw new OpError(404, 'User not found');
	return redact(user);
}

export const getMe = defineOp({
	auth: 'user',
	input: z.object({}),
	async run(ctx) {
		return redact(await me(ctx));
	}
});

// Email is not here on purpose: changing it unverified would claim invitations and
// email sign-in addressed to someone else.
const userSet = z
	.object({
		name: z.string().trim().max(200).nullable(),
		image: z.string().max(2_000).nullable(),
		locale: z.string().min(2).max(10),
		dark_mode: z.boolean(),
		default_labels: z.unknown(),
		settings: z.record(z.string(), z.unknown()),
		claude_plan: z.string().max(50).nullable(),
		claude_plan_monthly: z.number().min(0).nullable(),
		claude_plan_currency: z.string().max(10).nullable()
	})
	.partial()
	.strict();

export const updateMe = defineOp({
	auth: 'user',
	input: z.object({ set: userSet }),
	async run(ctx, { set }) {
		if (!set.settings) return save(ctx, set);
		const stored = (await me(ctx)).settings as Settings | null;
		return save(ctx, { ...set, settings: mergeSettings(stored, set.settings as Settings) });
	}
});

/** Removes a server-managed connection (the browser can't write those tokens). */
export const disconnectIntegration = defineOp({
	auth: 'user',
	input: z.object({ name: z.enum(['github', 'google_calendar']) }),
	async run(ctx, { name }) {
		const settings = ((await me(ctx)).settings ?? {}) as Settings;
		const tokens = { ...settings.tokens };
		delete tokens[name];
		return save(ctx, { settings: { ...settings, tokens } });
	}
});

/** Everyone the caller shares a board with (and the caller), public fields only. */
export const getBoardPeople = defineOp({
	auth: 'user',
	input: z.object({}),
	async run(ctx) {
		return (await ctx.db(GET_PEOPLE, { userId: ctx.userId })).users;
	}
});
