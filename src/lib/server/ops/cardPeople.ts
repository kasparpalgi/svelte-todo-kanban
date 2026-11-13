/** @file src/lib/server/ops/cardPeople.ts */
// Who is on a card: assignees and subscribers. Owners and editors change both; the
// person added must be on the board. Each op returns the updated card (#229).
import { z } from 'zod';
import {
	ASSIGN_USER_TO_TODO,
	SUBSCRIBE_TO_TODO,
	UNASSIGN_USER_FROM_TODO,
	UNSUBSCRIBE_FROM_TODO,
	UPDATE_TODOS
} from '$lib/graphql/documents';
import { canEdit, isMember, roleOf } from '$lib/server/access';
import { cardDetails, requireCard, written } from './cardAccess';
import { defineOp, OpError, type UserCtx } from './op';

const input = z.object({ todoId: z.guid(), userId: z.guid() });

/** The card, editable by the caller, and `userId` a member of its board. */
async function cardAndMember(ctx: UserCtx, todoId: string, userId: string) {
	const found = await requireCard(ctx, todoId, canEdit);
	const onBoard = found.boardId
		? isMember(await roleOf(ctx, found.boardId, userId))
		: userId === ctx.userId;
	if (!onBoard) throw new OpError(400, 'That user is not on this board');
	return found;
}

const setPrimary = (ctx: UserCtx, id: string, userId: string | null) =>
	ctx.db(UPDATE_TODOS, { where: { id: { _eq: id } }, _set: { assigned_to: userId } });

/** Adds an assignee; the first one becomes the primary (`assigned_to`). They get notified. */
export const assignUser = defineOp({
	auth: 'user',
	input,
	async run(ctx, { todoId, userId }) {
		const { card, boardId } = await cardAndMember(ctx, todoId, userId);
		await ctx.db(ASSIGN_USER_TO_TODO, { todo_id: todoId, user_id: userId });
		if (!card.assigned_to) await setPrimary(ctx, todoId, userId);
		await written(ctx, [boardId], {
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
	}
});

/** Removes an assignee; when it was the primary, the next one (or nobody) takes over. */
export const unassignUser = defineOp({
	auth: 'user',
	input,
	async run(ctx, { todoId, userId }) {
		const { card, boardId } = await requireCard(ctx, todoId, canEdit);
		await ctx.db(UNASSIGN_USER_FROM_TODO, { todo_id: todoId, user_id: userId });
		let todo = await cardDetails(ctx, todoId);
		if (card.assigned_to === userId) {
			await setPrimary(ctx, todoId, todo.assignees[0]?.user_id ?? null);
			todo = await cardDetails(ctx, todoId);
		}
		await written(ctx, [boardId], {
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
		return todo;
	}
});

export const subscribeToTodo = defineOp({
	auth: 'user',
	input,
	async run(ctx, { todoId, userId }) {
		const { boardId } = await cardAndMember(ctx, todoId, userId);
		await ctx.db(SUBSCRIBE_TO_TODO, { todo_id: todoId, user_id: userId });
		await written(ctx, [boardId]);
		return cardDetails(ctx, todoId);
	}
});

export const unsubscribeFromTodo = defineOp({
	auth: 'user',
	input,
	async run(ctx, { todoId, userId }) {
		const { boardId } = await requireCard(ctx, todoId, canEdit);
		await ctx.db(UNSUBSCRIBE_FROM_TODO, { todo_id: todoId, user_id: userId });
		await written(ctx, [boardId]);
		return cardDetails(ctx, todoId);
	}
});
