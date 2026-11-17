/** @file src/lib/server/ops/d1/cardPeople.ts */
// Assignees and subscribers on D1, with the same access rules as ops/cardPeople.ts. No
// `assigned_to` to keep in step: the primary is the oldest assignee (#256).
import { and, eq } from 'drizzle-orm';
import { canEdit, isMember, roleOf } from '$lib/server/access';
import { todo_assignees, todo_subscribers } from '$lib/server/db/schema';
import { OpError } from '../op';
import { cardDetails, requireCard, written, type Ctx } from './cardAccess';
import type { D1Run } from './types';

/** The card, editable by the caller, and `userId` a member of its board. */
async function cardAndMember(ctx: Ctx, todoId: string, userId: string) {
	const found = await requireCard(ctx, todoId, canEdit);
	const onBoard = found.boardId
		? isMember(await roleOf(ctx, found.boardId, userId))
		: userId === ctx.userId;
	if (!onBoard) throw new OpError(400, 'That user is not on this board');
	return found;
}

const pair = (
	table: typeof todo_assignees | typeof todo_subscribers,
	todoId: string,
	userId: string
) => and(eq(table.todo_id, todoId), eq(table.user_id, userId));

export const assignUser: D1Run<'assignUser'> = async (ctx, { todoId, userId }) => {
	const { boardId } = await cardAndMember(ctx, todoId, userId);
	const add = ctx.d1
		.insert(todo_assignees)
		.values({ todo_id: todoId, user_id: userId })
		.onConflictDoNothing();
	await written(ctx, [add], [boardId], {
		logs: [
			{
				todo_id: todoId,
				action_type: 'assigned',
				field_name: 'assigned_to',
				new_value: userId,
				changes: { assignee_id: userId }
			}
		],
		notify: [{ user_id: userId, todo_id: todoId, type: 'assigned', content: '' }]
	});
	return cardDetails(ctx, todoId);
};

export const unassignUser: D1Run<'unassignUser'> = async (ctx, { todoId, userId }) => {
	const { boardId } = await requireCard(ctx, todoId, canEdit);
	const remove = ctx.d1.delete(todo_assignees).where(pair(todo_assignees, todoId, userId));
	await written(ctx, [remove], [boardId], {
		logs: [
			{
				todo_id: todoId,
				action_type: 'unassigned',
				field_name: 'assigned_to',
				old_value: userId,
				changes: { assignee_id: userId }
			}
		]
	});
	return cardDetails(ctx, todoId);
};

export const subscribeToTodo: D1Run<'subscribeToTodo'> = async (ctx, { todoId, userId }) => {
	const { boardId } = await cardAndMember(ctx, todoId, userId);
	const add = ctx.d1.insert(todo_subscribers).values({ todo_id: todoId, user_id: userId });
	await written(ctx, [add], [boardId]);
	return cardDetails(ctx, todoId);
};

export const unsubscribeFromTodo: D1Run<'unsubscribeFromTodo'> = async (
	ctx,
	{ todoId, userId }
) => {
	const { boardId } = await requireCard(ctx, todoId, canEdit);
	const remove = ctx.d1.delete(todo_subscribers).where(pair(todo_subscribers, todoId, userId));
	await written(ctx, [remove], [boardId]);
	return cardDetails(ctx, todoId);
};
