/** @file src/lib/server/ops/members.ts */
// Board members. Anyone who can read the board sees them; only an owner changes a
// role or removes someone, and a member may leave (#228). Joining is acceptInvitation.
import { z } from 'zod';
import {
	GET_BOARD_MEMBERS,
	GET_MEMBER_BOARD,
	REMOVE_BOARD_MEMBER,
	UPDATE_BOARD_MEMBER
} from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { boardRole, canRead, isOwner, requireRole } from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

async function member(ctx: UserCtx, id: string) {
	const data = await ctx.db(GET_MEMBER_BOARD, { id });
	if (!data.board_members_by_pk) throw new OpError(404, 'Member not found');
	return data.board_members_by_pk;
}

export const getBoardMembers = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid() }),
	async run(ctx, { boardId }) {
		await requireRole(ctx, boardId, canRead);
		const data = await ctx.db(GET_BOARD_MEMBERS, {
			where: { board_id: { _eq: boardId } },
			order_by: [{ created_at: Order_By.Asc }],
			limit: 1000
		});
		return data.board_members;
	}
});

export const updateBoardMember = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid(), role: z.enum(['owner', 'editor', 'viewer']) }),
	async run(ctx, { id, role }) {
		await requireRole(ctx, (await member(ctx, id)).board_id, isOwner);
		const data = await ctx.db(UPDATE_BOARD_MEMBER, { where: { id: { _eq: id } }, _set: { role } });
		const updated = data.update_board_members?.returning[0];
		if (!updated) throw new OpError(404, 'Member not found');
		return updated;
	}
});

export const removeBoardMember = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const row = await member(ctx, id);
		if (row.user_id !== ctx.userId && !isOwner(await boardRole(ctx, row.board_id))) {
			throw new OpError(403, 'Not allowed on this board');
		}
		const data = await ctx.db(REMOVE_BOARD_MEMBER, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_board_members?.affected_rows ?? 0) > 0 };
	}
});
