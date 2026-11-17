/** @file src/lib/server/ops/d1/owned.ts */
// Short links, push subscriptions and Claude usage on D1, same JSON as ops/owned.ts.
// Every statement is scoped by `user_id`.
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { claude_usage, push_subscriptions, url_shortcuts } from '$lib/server/db/schema';
import { uniqueAlias } from '../owned';
import { gone, one, owned } from './money';
import { iso } from './sql';
import type { D1Run } from './types';

export const getUrlShortcuts: D1Run<'getUrlShortcuts'> = ({ d1, userId }) =>
	d1
		.select()
		.from(url_shortcuts)
		.where(eq(url_shortcuts.user_id, userId))
		.orderBy(desc(url_shortcuts.created_at), url_shortcuts.id);

export const createUrlShortcut: D1Run<'createUrlShortcut'> = ({ d1, userId }, input) =>
	uniqueAlias(
		one(
			d1
				.insert(url_shortcuts)
				.values({ ...input, user_id: userId })
				.returning()
		)
	);

export const updateUrlShortcut: D1Run<'updateUrlShortcut'> = ({ d1, userId }, { id, set }) =>
	uniqueAlias(
		one(
			d1
				.update(url_shortcuts)
				.set(set)
				.where(owned(url_shortcuts, id, userId))
				.returning()
		)
	);

export const deleteUrlShortcut: D1Run<'deleteUrlShortcut'> = async ({ d1, userId }, { id }) =>
	gone(await d1.delete(url_shortcuts).where(owned(url_shortcuts, id, userId)));

/** One row per browser endpoint: a known endpoint moves to the caller with the new keys. */
export const savePushSubscription: D1Run<'savePushSubscription'> = async ({ d1, userId }, sub) => {
	const row = { ...sub, user_id: userId };
	await d1
		.insert(push_subscriptions)
		.values(row)
		.onConflictDoUpdate({
			target: push_subscriptions.endpoint,
			set: { p256dh: row.p256dh, auth: row.auth, user_id: userId }
		});
	return { saved: true };
};

export const deletePushSubscription: D1Run<'deletePushSubscription'> = async (ctx, input) => {
	const result = await ctx.d1
		.delete(push_subscriptions)
		.where(
			and(
				eq(push_subscriptions.endpoint, input.endpoint),
				eq(push_subscriptions.user_id, ctx.userId)
			)
		);
	return { deleted: result.meta.changes > 0 };
};

/** The caller's own API-list cost in a period; null for anyone else or no usage. */
export const getClaudeUsageCost: D1Run<'getClaudeUsageCost'> = async ({ d1, userId }, input) => {
	if (input.userId !== userId) return null;
	const [row] = await d1
		// Postgres sums numeric exactly, SQLite sums doubles.
		.select({ cost: sql<number | null>`round(sum(${claude_usage.cost_usd}), 10)` })
		.from(claude_usage)
		.where(
			and(
				eq(claude_usage.user_id, userId),
				gte(claude_usage.created_at, iso(input.from)),
				lt(claude_usage.created_at, iso(input.to))
			)
		);
	return row?.cost ?? null;
};
