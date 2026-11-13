/** @file src/lib/server/ops/poll.ts */
// The one 30 s poll: has the open board changed, and how many notifications are
// unread. The browser compares `board` with the last one and refetches only on a change.
import { z } from 'zod';
import { POLL_BOARD, POLL_UNREAD } from '$lib/graphql/documents';
import { boardRole, canRead } from '$lib/server/access';
import { defineOp } from './op';

export const poll = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid().optional() }),
	async run(ctx, { boardId }) {
		const { db, userId } = ctx;
		if (!boardId || !canRead(await boardRole(ctx, boardId))) {
			const data = await db(POLL_UNREAD, { userId });
			return { board: null, unread: data.notifications_aggregate.aggregate?.count ?? 0 };
		}
		const data = await db(POLL_BOARD, { userId, boardId });
		// `changed_at` moves on every card, comment, label and list write made through the
		// ops (#229); `updated_at` on a board edit. The card count and newest card stamp
		// catch the runner's writes until it goes through the API too (#231).
		const cards = data.todos_aggregate.aggregate;
		const board = [
			data.boards_by_pk?.changed_at,
			data.boards_by_pk?.updated_at,
			cards?.count,
			cards?.max?.updated_at
		].join('|');
		return { board, unread: data.notifications_aggregate.aggregate?.count ?? 0 };
	}
});
