/** @file src/lib/server/ops/comments.ts */
// A card's comments. Every board member reads and writes them, viewers included; only
// the author edits a comment, and the author or an owner/editor deletes it (#229). The
// server writes the activity row and notifies the card's assignees and subscribers.
import { z } from 'zod';
import {
	CREATE_COMMENT,
	DELETE_COMMENT,
	GET_COMMENT_ACCESS,
	GET_COMMENTS,
	GET_COMMENTS_AGGREGATE,
	UPDATE_COMMENT
} from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { canEdit, isMember } from '$lib/server/access';
import { requireCard, written } from './cardAccess';
import { defineOp, OpError, type UserCtx } from './op';

const content = z.string().trim().min(1).max(100_000);

const preview = (text: string, max: number) =>
	text.length > max ? `${text.substring(0, max)}...` : text;

async function requireComment(ctx: UserCtx, id: string) {
	const data = await ctx.db(GET_COMMENT_ACCESS, { id });
	const comment = data.comments_by_pk;
	if (!comment) throw new OpError(404, 'Comment not found');
	return comment;
}

/** A page of a card's comments, newest first, and how many there are in all. */
export const getComments = defineOp({
	auth: 'user',
	input: z.object({
		todoId: z.guid(),
		limit: z.number().int().min(1).max(100).default(10),
		offset: z.number().int().min(0).default(0)
	}),
	async run(ctx, { todoId, limit, offset }) {
		await requireCard(ctx, todoId, isMember);
		const where = { todo_id: { _eq: todoId } };
		const [page, total] = await Promise.all([
			ctx.db(GET_COMMENTS, { where, order_by: [{ created_at: Order_By.Desc }], limit, offset }),
			ctx.db(GET_COMMENTS_AGGREGATE, { where })
		]);
		return { comments: page.comments, total: total.comments_aggregate.aggregate?.count ?? 0 };
	}
});

export const createComment = defineOp({
	auth: 'user',
	input: z.object({ todoId: z.guid(), content }),
	async run(ctx, { todoId, content }) {
		const { card, boardId } = await requireCard(ctx, todoId, isMember);
		const data = await ctx.db(CREATE_COMMENT, {
			objects: [{ todo_id: todoId, content, user_id: ctx.userId }]
		});
		const comment = data.insert_comments?.returning[0];
		if (!comment) throw new Error('insert_comments returned no row');

		// Assignees and subscribers, each once; `written` leaves out the author.
		const people = new Set([...card.assignees, ...card.subscribers].map((p) => p.user_id));
		await written(ctx, [boardId], {
			logs: [{ todo_id: todoId, action_type: 'commented', new_value: preview(content, 200) }],
			notify: [...people].map((user_id) => ({
				user_id,
				todo_id: todoId,
				type: 'commented',
				related_comment_id: comment.id,
				content: `"${preview(content, 50)}"`
			}))
		});
		return comment;
	}
});

export const updateComment = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid(), content }),
	async run(ctx, { id, content }) {
		const old = await requireComment(ctx, id);
		if (old.user_id !== ctx.userId) throw new OpError(403, 'Only the author edits a comment');
		const { boardId } = await requireCard(ctx, old.todo_id, isMember);

		const data = await ctx.db(UPDATE_COMMENT, { where: { id: { _eq: id } }, _set: { content } });
		const comment = data.update_comments?.returning[0];
		if (!comment) throw new OpError(404, 'Comment not found');
		await written(ctx, [boardId], {
			logs: [
				{
					todo_id: old.todo_id,
					action_type: 'comment_edited',
					old_value: preview(old.content, 200),
					new_value: preview(content, 200)
				}
			]
		});
		return comment;
	}
});

export const deleteComment = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const old = await requireComment(ctx, id);
		const own = old.user_id === ctx.userId;
		const { boardId } = await requireCard(ctx, old.todo_id, own ? isMember : canEdit);

		const data = await ctx.db(DELETE_COMMENT, { where: { id: { _eq: id } } });
		const deleted = (data.delete_comments?.affected_rows ?? 0) > 0;
		if (deleted) {
			await written(ctx, [boardId], {
				logs: [{ todo_id: old.todo_id, action_type: 'comment_deleted' }]
			});
		}
		return { deleted };
	}
});
