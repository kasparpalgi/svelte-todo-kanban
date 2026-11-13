/** @file src/lib/server/ops/activity.ts */
// The board's activity feed, for its members. Rows are written by the card ops
// themselves (cardAccess.ts `written`), never sent by the browser (#229).
import { z } from 'zod';
import { GET_ACTIVITY_LOGS } from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { isMember, requireRole } from '$lib/server/access';
import { defineOp } from './op';

export const getBoardActivity = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid(),
		limit: z.number().int().min(1).max(200).default(100),
		offset: z.number().int().min(0).default(0)
	}),
	async run(ctx, { boardId, limit, offset }) {
		await requireRole(ctx, boardId, isMember);
		const data = await ctx.db(GET_ACTIVITY_LOGS, {
			where: { todo: { list: { board_id: { _eq: boardId } } } },
			order_by: [{ created_at: Order_By.Desc }],
			limit,
			offset
		});
		return data.activity_logs;
	}
});
