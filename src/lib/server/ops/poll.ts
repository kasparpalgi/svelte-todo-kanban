/** @file src/lib/server/ops/poll.ts */
// The one 30 s poll: has the open board changed, and how many notifications are
// unread. Replaces the board's fingerprint/lists/boards fetches and the bell's
// notification reload, which were 4 requests every 30 s per tab.
import { z } from 'zod';
import { POLL_BOARD, POLL_UNREAD } from '$lib/graphql/documents';
import { boardRole, canRead } from '$lib/server/access';
import { defineOp } from './op';

/** A short SHA-256 of the board's cards and lists: the browser compares it with the last one. */
async function fingerprint(value: unknown): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(value));
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
	return Array.from(digest.subarray(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const poll = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid().optional() }),
	async run(ctx, { boardId }) {
		const { db, userId } = ctx;
		if (!boardId || !canRead(await boardRole(ctx, boardId))) {
			const data = await db(POLL_UNREAD, { userId });
			return { board: null, unread: data.notifications_aggregate.aggregate?.count ?? 0 };
		}
		const { notifications_aggregate, ...board } = await db(POLL_BOARD, { userId, boardId });
		return {
			board: await fingerprint(board),
			unread: notifications_aggregate.aggregate?.count ?? 0
		};
	}
});
