/** @file src/lib/server/ops/d1/cardExtras.ts */
// A card's labels and images on D1, with the same access rules as ops/cardExtras.ts.
import { and, eq } from 'drizzle-orm';
import { canEdit } from '$lib/server/access';
import { labels, todo_labels, uploads } from '$lib/server/db/schema';
import { OpError } from '../op';
import { cardDetails, requireCard, written } from './cardAccess';
import type { D1Run } from './types';

export const addTodoLabel: D1Run<'addTodoLabel'> = async (ctx, { todoId, labelId }) => {
	const { boardId } = await requireCard(ctx, todoId, canEdit);
	const [label] = await ctx.d1
		.select({ board_id: labels.board_id })
		.from(labels)
		.where(eq(labels.id, labelId));
	if (!boardId || label?.board_id !== boardId) {
		throw new OpError(400, 'That label is not on this board');
	}
	const add = ctx.d1.insert(todo_labels).values({ todo_id: todoId, label_id: labelId });
	await written(ctx, [add], [boardId]);
	return cardDetails(ctx, todoId);
};

export const removeTodoLabel: D1Run<'removeTodoLabel'> = async (ctx, { todoId, labelId }) => {
	const { boardId } = await requireCard(ctx, todoId, canEdit);
	const remove = ctx.d1
		.delete(todo_labels)
		.where(and(eq(todo_labels.todo_id, todoId), eq(todo_labels.label_id, labelId)));
	await written(ctx, [remove], [boardId]);
	return cardDetails(ctx, todoId);
};

/** Records an image the upload endpoint already stored. */
export const createUpload: D1Run<'createUpload'> = async (ctx, { todoId, url }) => {
	const { boardId } = await requireCard(ctx, todoId, canEdit);
	await written(ctx, [ctx.d1.insert(uploads).values({ todo_id: todoId, url })], [boardId], {
		logs: [{ todo_id: todoId, action_type: 'image_added' }]
	});
	return cardDetails(ctx, todoId);
};

export const deleteUpload: D1Run<'deleteUpload'> = async (ctx, { id }) => {
	const [upload] = await ctx.d1
		.select({ todo_id: uploads.todo_id })
		.from(uploads)
		.where(eq(uploads.id, id));
	if (!upload) throw new OpError(404, 'Image not found');
	const { boardId } = await requireCard(ctx, upload.todo_id, canEdit);
	await written(ctx, [ctx.d1.delete(uploads).where(eq(uploads.id, id))], [boardId], {
		logs: [{ todo_id: upload.todo_id, action_type: 'image_removed' }]
	});
	return cardDetails(ctx, upload.todo_id);
};
