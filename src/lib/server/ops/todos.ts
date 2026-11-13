/** @file src/lib/server/ops/todos.ts */
// Cards: the board's rows, one card's full body, content search, and create / update /
// delete. Anyone who can see the board reads its cards; owners and editors change them,
// viewers are read-only (#229). The server writes the activity row, not the browser.
import { z } from 'zod';
import {
	CREATE_TODO,
	DELETE_TODOS,
	GET_TODO_DETAILS,
	GET_TODOS,
	SEARCH_TODO_CONTENT,
	UPDATE_TODOS
} from '$lib/graphql/documents';
import { Order_By, type Todos_Bool_Exp } from '$lib/graphql/generated/graphql';
import { canEdit, canRead, requireRole } from '$lib/server/access';
import { cardActivity } from './cardActivity';
import { requireCard, requireEditableList, written } from './cardAccess';
import { defineOp, OpError, type UserCtx } from './op';

const title = z.string().trim().min(1).max(1000);
const content = z.string().max(1_000_000).nullable();
const hours = z.number().min(0).max(100_000).nullable();
const when = z.string().max(40).nullable();

/** `%` and `_` in a search term are text, not LIKE wildcards. */
export const escapeLike = (term: string) => term.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Cards of one board, or (no board) of every board the caller owns or belongs to. */
async function cardsWhere(ctx: UserCtx, boardId?: string): Promise<Todos_Bool_Exp> {
	if (boardId) {
		await requireRole(ctx, boardId, canRead);
		return { list: { board_id: { _eq: boardId } } };
	}
	return {
		_or: [
			{ list: { board: { user_id: { _eq: ctx.userId } } } },
			{ list: { board: { board_members: { user_id: { _eq: ctx.userId } } } } }
		]
	};
}

/** A page of a board's open or completed cards, without bodies (#211). */
export const getTodos = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid().optional(),
		completed: z.boolean().default(false),
		limit: z.number().int().min(1).max(1000).default(100),
		offset: z.number().int().min(0).default(0)
	}),
	async run(ctx, { boardId, completed, limit, offset }) {
		const data = await ctx.db(GET_TODOS, {
			where: {
				_and: [{ completed_at: { _is_null: !completed } }, await cardsWhere(ctx, boardId)]
			},
			order_by: completed
				? [{ completed_at: Order_By.Desc }]
				: [{ sort_order: Order_By.Asc }, { due_on: Order_By.Desc }, { updated_at: Order_By.Desc }],
			limit,
			offset
		});
		return data.todos;
	}
});

/** One card with its full body, or null when it is gone. */
export const getTodo = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		try {
			await requireCard(ctx, id, canRead);
		} catch (error) {
			if (error instanceof OpError && error.status === 404) return null;
			throw error;
		}
		const data = await ctx.db(GET_TODO_DETAILS, { where: { id: { _eq: id } } });
		return data.todos[0] ?? null;
	}
});

/** Ids of the board's cards whose body contains `term` ("search in content"). */
export const searchTodos = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid(), term: z.string().trim().min(1).max(200) }),
	async run(ctx, { boardId, term }) {
		await requireRole(ctx, boardId, canRead);
		const like = `%${escapeLike(term)}%`;
		const data = await ctx.db(SEARCH_TODO_CONTENT, {
			where: { list: { board_id: { _eq: boardId } }, content: { _ilike: like } }
		});
		return data.todos.map((t) => t.id);
	}
});

/** A new card, assigned to its creator. */
export const createTodo = defineOp({
	auth: 'user',
	input: z.object({
		listId: z.guid(),
		title,
		content: content.optional(),
		sort_order: z.number().int(),
		priority: z.enum(['low', 'medium', 'high']).nullable().optional()
	}),
	async run(ctx, { listId, title, content, sort_order, priority }) {
		const list = await requireEditableList(ctx, listId);
		const data = await ctx.db(CREATE_TODO, {
			objects: [
				{
					list_id: listId,
					title,
					content: content || null,
					sort_order,
					priority: priority ?? null,
					user_id: ctx.userId,
					assigned_to: ctx.userId,
					assignees: { data: [{ user_id: ctx.userId }] }
				}
			]
		});
		const todo = data.insert_todos?.returning[0];
		if (!todo) throw new Error('insert_todos returned no row');
		await written(ctx, [list.board_id], { logs: [{ todo_id: todo.id, action_type: 'created' }] });
		return todo;
	}
});

export const updateTodo = defineOp({
	auth: 'user',
	input: z.object({
		id: z.guid(),
		set: z
			.object({
				title,
				content,
				completed_at: when,
				due_on: when,
				has_time: z.boolean(),
				sort_order: z.number().int(),
				priority: z.enum(['low', 'medium', 'high']).nullable(),
				min_hours: hours,
				max_hours: hours,
				actual_hours: hours,
				comment_hours: z.string().max(200).nullable(),
				agent_model: z.string().max(40).nullable(),
				agent_effort: z.string().max(40).nullable(),
				agent_machine: z.string().max(100).nullable(),
				agent_plan_first: z.boolean(),
				list_id: z.guid(),
				assigned_to: z.guid().nullable()
			})
			.partial()
			.strict()
	}),
	async run(ctx, { id, set }) {
		const { card, boardId } = await requireCard(ctx, id, canEdit);
		// Moving a card to another list needs edit rights on that list's board too.
		const target =
			set.list_id && set.list_id !== card.list_id
				? await requireEditableList(ctx, set.list_id)
				: null;

		const data = await ctx.db(UPDATE_TODOS, { where: { id: { _eq: id } }, _set: set });
		const todo = data.update_todos?.returning[0];
		if (!todo) throw new OpError(404, 'Card not found');

		const log = cardActivity(card, set, target?.name);
		await written(ctx, [boardId, target?.board_id], {
			logs: log ? [{ ...log, todo_id: id }] : []
		});
		return todo;
	}
});

export const deleteTodo = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const { boardId } = await requireCard(ctx, id, canEdit);
		const data = await ctx.db(DELETE_TODOS, { where: { id: { _eq: id } } });
		const deleted = (data.delete_todos?.affected_rows ?? 0) > 0;
		// No 'deleted' activity row: activity_logs cascade away with their card.
		if (deleted) await written(ctx, [boardId]);
		return { deleted };
	}
});
