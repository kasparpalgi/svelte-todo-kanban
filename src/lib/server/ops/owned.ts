/** @file src/lib/server/ops/owned.ts */
// Rows that belong to one user and are seen only by them: short links, push
// subscriptions and Claude usage (#230). Every query is scoped by `user_id`.
import { z } from 'zod';
import {
	CREATE_PUSH_SUBSCRIPTION,
	CREATE_URL_SHORTCUT,
	DELETE_PUSH_SUBSCRIPTION,
	DELETE_URL_SHORTCUT,
	GET_CLAUDE_USAGE_MONTH,
	GET_URL_SHORTCUTS,
	UPDATE_URL_SHORTCUT
} from '$lib/graphql/documents';
import { validateAlias } from '$lib/utils/shortcutAlias';
import { defineOp, OpError } from './op';
import { byId, deleted, updated } from './rows';

// ---- Short links (todzz.eu/<alias> redirects; the redirect itself is in [lang]/+layout.server.ts)

const alias = z
	.string()
	.trim()
	.refine((a) => validateAlias(a).ok, 'is not a valid alias');
const targetUrl = z.string().trim().min(1).max(2_000);

/** Aliases are unique across all users: say so instead of a 500. */
async function uniqueAlias<T>(write: Promise<T>): Promise<T> {
	try {
		return await write;
	} catch (error) {
		if (/unique|uniqueness/i.test(String(error))) throw new OpError(400, 'Alias is already taken');
		throw error;
	}
}

export const getUrlShortcuts = defineOp({
	auth: 'user',
	input: z.object({}),
	async run({ db, userId }) {
		return (await db(GET_URL_SHORTCUTS, { userId })).url_shortcuts;
	}
});

export const createUrlShortcut = defineOp({
	auth: 'user',
	input: z.object({ alias, target_url: targetUrl }),
	async run({ db, userId }, input) {
		const row = (
			await uniqueAlias(db(CREATE_URL_SHORTCUT, { object: { ...input, user_id: userId } }))
		).insert_url_shortcuts_one;
		if (!row) throw new Error('insert_url_shortcuts_one returned no row');
		return row;
	}
});

export const updateUrlShortcut = defineOp({
	auth: 'user',
	input: byId.extend({ set: z.object({ alias, target_url: targetUrl }).partial().strict() }),
	async run({ db, userId }, { id, set }) {
		const data = await uniqueAlias(db(UPDATE_URL_SHORTCUT, { id, userId, _set: set }));
		return updated(data.update_url_shortcuts);
	}
});

export const deleteUrlShortcut = defineOp({
	auth: 'user',
	input: byId,
	async run({ db, userId }, { id }) {
		return deleted((await db(DELETE_URL_SHORTCUT, { id, userId })).delete_url_shortcuts);
	}
});

// ---- Web push subscriptions (one per browser endpoint)

const endpoint = z.url().max(2_000);

export const savePushSubscription = defineOp({
	auth: 'user',
	input: z.object({
		endpoint,
		p256dh: z.string().min(1).max(500),
		auth: z.string().min(1).max(500)
	}),
	async run({ db, userId }, subscription) {
		await db(CREATE_PUSH_SUBSCRIPTION, { subscription: { ...subscription, user_id: userId } });
		return { saved: true };
	}
});

export const deletePushSubscription = defineOp({
	auth: 'user',
	input: z.object({ endpoint }),
	async run({ db, userId }, { endpoint }) {
		const data = await db(DELETE_PUSH_SUBSCRIPTION, { endpoint, userId });
		return { deleted: (data.delete_push_subscriptions?.affected_rows ?? 0) > 0 };
	}
});

// ---- Claude usage: the caller's own API-list cost in a period; null for anyone else

export const getClaudeUsageCost = defineOp({
	auth: 'user',
	input: z.object({ userId: z.guid(), from: z.iso.datetime(), to: z.iso.datetime() }),
	async run({ db, userId }, input) {
		if (input.userId !== userId) return null;
		const data = await db(GET_CLAUDE_USAGE_MONTH, {
			user_id: userId,
			from: input.from,
			to: input.to
		});
		return (data.claude_usage_aggregate.aggregate?.sum?.cost_usd as number | null) ?? null;
	}
});
