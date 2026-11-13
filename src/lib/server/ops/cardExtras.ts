/** @file src/lib/server/ops/cardExtras.ts */
// A card's labels and images. Owners and editors change them; each op returns the
// updated card, so the browser needs no second fetch (#229).
import { z } from 'zod';
import {
	ADD_TODO_LABEL,
	CREATE_UPLOAD,
	DELETE_UPLOAD,
	GET_LABEL_BOARD,
	GET_UPLOAD_TODO,
	REMOVE_TODO_LABEL
} from '$lib/graphql/documents';
import { canEdit } from '$lib/server/access';
import { cardDetails, requireCard, written } from './cardAccess';
import { defineOp, OpError } from './op';

const labelInput = z.object({ todoId: z.guid(), labelId: z.guid() });

export const addTodoLabel = defineOp({
	auth: 'user',
	input: labelInput,
	async run(ctx, { todoId, labelId }) {
		const { boardId } = await requireCard(ctx, todoId, canEdit);
		const label = await ctx.db(GET_LABEL_BOARD, { id: labelId });
		if (!boardId || label.labels_by_pk?.board_id !== boardId) {
			throw new OpError(400, 'That label is not on this board');
		}
		await ctx.db(ADD_TODO_LABEL, { objects: [{ todo_id: todoId, label_id: labelId }] });
		await written(ctx, [boardId]);
		return cardDetails(ctx, todoId);
	}
});

export const removeTodoLabel = defineOp({
	auth: 'user',
	input: labelInput,
	async run(ctx, { todoId, labelId }) {
		const { boardId } = await requireCard(ctx, todoId, canEdit);
		await ctx.db(REMOVE_TODO_LABEL, {
			where: { todo_id: { _eq: todoId }, label_id: { _eq: labelId } }
		});
		await written(ctx, [boardId]);
		return cardDetails(ctx, todoId);
	}
});

/** Records an image the upload endpoint already stored. */
export const createUpload = defineOp({
	auth: 'user',
	input: z.object({ todoId: z.guid(), url: z.url({ protocol: /^https?$/ }).max(2000) }),
	async run(ctx, { todoId, url }) {
		const { boardId } = await requireCard(ctx, todoId, canEdit);
		await ctx.db(CREATE_UPLOAD, { objects: [{ todo_id: todoId, url }] });
		await written(ctx, [boardId], { logs: [{ todo_id: todoId, action_type: 'image_added' }] });
		return cardDetails(ctx, todoId);
	}
});

export const deleteUpload = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const upload = await ctx.db(GET_UPLOAD_TODO, { id });
		const todoId = upload.uploads_by_pk?.todo_id;
		if (!todoId) throw new OpError(404, 'Image not found');
		const { boardId } = await requireCard(ctx, todoId, canEdit);
		await ctx.db(DELETE_UPLOAD, { where: { id: { _eq: id } } });
		await written(ctx, [boardId], { logs: [{ todo_id: todoId, action_type: 'image_removed' }] });
		return cardDetails(ctx, todoId);
	}
});
