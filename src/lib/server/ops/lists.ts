/** @file src/lib/server/ops/lists.ts */
// Board columns. Members read them, owners and editors change them (#228).
import { z } from 'zod';
import {
	CREATE_LIST,
	DELETE_LIST,
	GET_LIST_BOARD,
	GET_LISTS,
	UPDATE_LIST
} from '$lib/graphql/documents';
import { Order_By, type Lists_Bool_Exp } from '$lib/graphql/generated/graphql';
import { boardRole, canEdit, canRead, requireRole } from '$lib/server/access';
import { written } from './cardAccess';
import { defineOp, OpError, type UserCtx } from './op';

const name = z.string().trim().min(1).max(200);

async function listBoard(ctx: UserCtx, id: string) {
	const data = await ctx.db(GET_LIST_BOARD, { id });
	const boardId = data.lists_by_pk?.board_id;
	if (!boardId) throw new OpError(404, 'List not found');
	return boardId;
}

/** Lists of every board the caller owns or belongs to, plus `boardId` when they can read it (a public board). */
export const getLists = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid().optional() }),
	async run(ctx, { boardId }) {
		const or: Lists_Bool_Exp[] = [
			{ board: { user_id: { _eq: ctx.userId } } },
			{ board: { board_members: { user_id: { _eq: ctx.userId } } } }
		];
		if (boardId && canRead(await boardRole(ctx, boardId))) or.push({ board_id: { _eq: boardId } });

		const data = await ctx.db(GET_LISTS, {
			where: { _or: or },
			order_by: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }],
			limit: 10_000
		});
		return data.lists;
	}
});

export const createList = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid(), name, sort_order: z.number().int().default(0) }),
	async run(ctx, { boardId, name, sort_order }) {
		await requireRole(ctx, boardId, canEdit);
		const data = await ctx.db(CREATE_LIST, { objects: [{ board_id: boardId, name, sort_order }] });
		const list = data.insert_lists?.returning[0];
		if (!list) throw new Error('insert_lists returned no row');
		await written(ctx, [boardId]);
		return list;
	}
});

export const updateList = defineOp({
	auth: 'user',
	input: z.object({
		id: z.guid(),
		set: z.object({ name, sort_order: z.number().int(), board_id: z.guid() }).partial().strict()
	}),
	async run(ctx, { id, set }) {
		const boardId = await listBoard(ctx, id);
		await requireRole(ctx, boardId, canEdit);
		// Moving a list to another board needs edit rights there too.
		if (set.board_id) await requireRole(ctx, set.board_id, canEdit);
		const data = await ctx.db(UPDATE_LIST, { where: { id: { _eq: id } }, _set: set });
		const list = data.update_lists?.returning[0];
		if (!list) throw new OpError(404, 'List not found');
		await written(ctx, [boardId, set.board_id]);
		return list;
	}
});

export const deleteList = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const boardId = await listBoard(ctx, id);
		await requireRole(ctx, boardId, canEdit);
		const data = await ctx.db(DELETE_LIST, { where: { id: { _eq: id } } });
		await written(ctx, [boardId]);
		return { deleted: (data.delete_lists?.affected_rows ?? 0) > 0 };
	}
});
