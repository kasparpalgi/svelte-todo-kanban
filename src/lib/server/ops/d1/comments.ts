/** @file src/lib/server/ops/d1/comments.ts */
// A card's comments on D1, with the same access rules as ops/comments.ts. Each write and
// its activity row and notifications are one batch (#256).
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { canEdit, isMember } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { comments } from '$lib/server/db/schema';
import { preview } from '../comments';
import { OpError } from '../op';
import { changed, requireCard, written, type Ctx } from './cardAccess';
import { prepared } from './sql';
import type { D1Run } from './types';

const user = {
	columns: { id: true, name: true, username: true, image: true, email: true }
} as const;

/** Comments in the shape of Hasura's CommentFields fragment. */
const commentRows = (
	d1: D1,
	where: ReturnType<typeof eq>,
	page: { limit?: number; offset?: number } = {}
) =>
	d1.query.comments.findMany({
		where,
		orderBy: [desc(comments.created_at), asc(comments.id)],
		with: { user },
		...page
	});

const byId = prepared((d1) => commentRows(d1, eq(comments.id, sql.placeholder('id'))).prepare());

async function commentRow(d1: D1, id: string) {
	const [comment] = await byId(d1).execute({ id });
	if (!comment) throw new OpError(404, 'Comment not found');
	return { ...comment, user: comment.user! }; // user_id is NOT NULL with a foreign key
}

async function requireComment(ctx: Ctx, id: string) {
	const [comment] = await ctx.d1
		.select({ user_id: comments.user_id, todo_id: comments.todo_id, content: comments.content })
		.from(comments)
		.where(eq(comments.id, id));
	if (!comment) throw new OpError(404, 'Comment not found');
	return comment;
}

export const getComments: D1Run<'getComments'> = async (ctx, { todoId, limit, offset }) => {
	await requireCard(ctx, todoId, isMember);
	const where = eq(comments.todo_id, todoId);
	const [page, [total]] = await ctx.d1.batch([
		commentRows(ctx.d1, where, { limit, offset }),
		ctx.d1.select({ n: count() }).from(comments).where(where)
	]);
	return { comments: page.map((c) => ({ ...c, user: c.user! })), total: total?.n ?? 0 };
};

export const createComment: D1Run<'createComment'> = async (ctx, { todoId, content }) => {
	const { card, boardId } = await requireCard(ctx, todoId, isMember);
	const id = crypto.randomUUID();
	// Assignees and subscribers, each once; `written` leaves out the author.
	const people = new Set([...card.assignees, ...card.subscribers].map((p) => p.user_id));
	const add = ctx.d1.insert(comments).values({ id, todo_id: todoId, content, user_id: ctx.userId });
	await written(ctx, [add], [boardId], {
		logs: [{ todo_id: todoId, action_type: 'commented', new_value: preview(content, 200) }],
		notify: [...people].map((user_id) => ({
			user_id,
			todo_id: todoId,
			type: 'commented',
			related_comment_id: id,
			content: `"${preview(content, 50)}"`
		}))
	});
	return commentRow(ctx.d1, id);
};

export const updateComment: D1Run<'updateComment'> = async (ctx, { id, content }) => {
	const old = await requireComment(ctx, id);
	if (old.user_id !== ctx.userId) throw new OpError(403, 'Only the author edits a comment');
	const { boardId } = await requireCard(ctx, old.todo_id, isMember);
	// `updated_at` by hand: Postgres had a trigger for it, the schema has no $onUpdateFn.
	const edit = ctx.d1
		.update(comments)
		.set({ content, updated_at: new Date().toISOString() })
		.where(eq(comments.id, id));
	await written(ctx, [edit], [boardId], {
		logs: [
			{
				todo_id: old.todo_id,
				action_type: 'comment_edited',
				old_value: preview(old.content, 200),
				new_value: preview(content, 200)
			}
		]
	});
	return commentRow(ctx.d1, id);
};

export const deleteComment: D1Run<'deleteComment'> = async (ctx, { id }) => {
	const old = await requireComment(ctx, id);
	const own = old.user_id === ctx.userId;
	const { boardId } = await requireCard(ctx, old.todo_id, own ? isMember : canEdit);
	const [result] = await written(
		ctx,
		[ctx.d1.delete(comments).where(eq(comments.id, id))],
		[boardId],
		{
			logs: [{ todo_id: old.todo_id, action_type: 'comment_deleted' }]
		}
	);
	return { deleted: changed(result) };
};
