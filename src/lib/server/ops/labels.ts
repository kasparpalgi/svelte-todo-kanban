/** @file src/lib/server/ops/labels.ts */
// A board's labels. Owners and editors manage them; viewers only see them (#228).
import { z } from 'zod';
import { CREATE_LABEL, DELETE_LABEL, GET_LABEL_BOARD, UPDATE_LABEL } from '$lib/graphql/documents';
import { canEdit, requireRole } from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

const name = z.string().trim().min(1).max(100);
const color = z.string().min(1).max(50);

async function labelBoard(ctx: UserCtx, id: string) {
	const data = await ctx.db(GET_LABEL_BOARD, { id });
	const boardId = data.labels_by_pk?.board_id;
	if (!boardId) throw new OpError(404, 'Label not found');
	return boardId;
}

export const createLabel = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid(), name, color }),
	async run(ctx, { boardId, name, color }) {
		await requireRole(ctx, boardId, canEdit);
		const data = await ctx.db(CREATE_LABEL, { objects: [{ board_id: boardId, name, color }] });
		const label = data.insert_labels?.returning[0];
		if (!label) throw new Error('insert_labels returned no row');
		return label;
	}
});

export const updateLabel = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid(), set: z.object({ name, color }).partial().strict() }),
	async run(ctx, { id, set }) {
		await requireRole(ctx, await labelBoard(ctx, id), canEdit);
		const data = await ctx.db(UPDATE_LABEL, { where: { id: { _eq: id } }, _set: set });
		const label = data.update_labels?.returning[0];
		if (!label) throw new OpError(404, 'Label not found');
		return label;
	}
});

export const deleteLabel = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		await requireRole(ctx, await labelBoard(ctx, id), canEdit);
		const data = await ctx.db(DELETE_LABEL, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_labels?.affected_rows ?? 0) > 0 };
	}
});
