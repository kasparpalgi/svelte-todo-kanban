/** @file src/lib/server/ops/d1/todos.ts */
// The card ops on D1, with the same access rules as ops/todos.ts. Create does what the
// set_todo_alias trigger did: an alias unique among that user's cards (#256).
import { and, asc, desc, eq, inArray, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import { canEdit, canRead, requireRole } from '$lib/server/access';
import { aliasBase, nextFree, prefixRange } from '$lib/server/db/rules';
import { board_members, boards, lists, todo_assignees, todos } from '$lib/server/db/schema';
import { cardActivity } from '../cardActivity';
import { OpError } from '../op';
import {
	cardDetails,
	changed,
	requireCard,
	requireEditableList,
	written,
	type Ctx
} from './cardAccess';
import { cardDetail, cardRows } from './cardRows';
import { contains, iso } from './sql';
import type { D1Run } from './types';

const boardLists = (ctx: Ctx, board: SQL) =>
	inArray(todos.list_id, ctx.d1.select({ id: lists.id }).from(lists).where(board));

/** Cards of one board, or (no board) of every board the caller owns or belongs to. */
async function cardsWhere(ctx: Ctx, boardId?: string) {
	if (boardId) {
		await requireRole(ctx, boardId, canRead);
		return boardLists(ctx, eq(lists.board_id, boardId));
	}
	const { d1, userId } = ctx;
	return boardLists(
		ctx,
		or(
			inArray(
				lists.board_id,
				d1.select({ id: boards.id }).from(boards).where(eq(boards.user_id, userId))
			),
			inArray(
				lists.board_id,
				d1
					.select({ id: board_members.board_id })
					.from(board_members)
					.where(eq(board_members.user_id, userId))
			)
		)!
	);
}

export const getTodos: D1Run<'getTodos'> = async (ctx, { boardId, completed, limit, offset }) => {
	const where = and(
		completed ? isNotNull(todos.completed_at) : isNull(todos.completed_at),
		await cardsWhere(ctx, boardId)
	);
	// Postgres sorts nulls as the biggest value, SQLite as the smallest.
	const orderBy = completed
		? [desc(todos.completed_at), asc(todos.id)]
		: [
				sql`${todos.sort_order}`,
				sql`${todos.due_on} desc nulls first`,
				desc(todos.updated_at),
				asc(todos.id)
			];
	return cardRows(ctx.d1, where, { orderBy, limit, offset });
};

export const getTodo: D1Run<'getTodo'> = async (ctx, { id }) => {
	try {
		await requireCard(ctx, id, canRead);
	} catch (error) {
		if (error instanceof OpError && error.status === 404) return null;
		throw error;
	}
	return cardDetail(ctx.d1, id);
};

export const searchTodos: D1Run<'searchTodos'> = async (ctx, { boardId, term }) => {
	await requireRole(ctx, boardId, canRead);
	const rows = await ctx.d1
		.select({ id: todos.id })
		.from(todos)
		.innerJoin(lists, eq(lists.id, todos.list_id))
		.where(and(eq(lists.board_id, boardId), contains(todos.content, term)));
	return rows.map((r) => r.id);
};

/** A card alias this user has no card with yet (aliases are unique per user). */
async function cardAlias(ctx: Ctx, title: string) {
	const base = aliasBase(title, 'todo');
	const [from, to] = prefixRange(base);
	const taken = await ctx.d1
		.select({ alias: todos.alias })
		.from(todos)
		.where(
			and(
				eq(todos.user_id, ctx.userId),
				sql`${todos.alias} >= ${from}`,
				sql`${todos.alias} < ${to}`
			)
		);
	return nextFree(
		base,
		taken.map((r) => r.alias)
	);
}

/** A new card, assigned to its creator. */
export const createTodo: D1Run<'createTodo'> = async (ctx, input) => {
	const { listId, title, content, sort_order, priority } = input;
	const list = await requireEditableList(ctx, listId);
	const id = crypto.randomUUID();
	const card = {
		id,
		list_id: listId,
		title,
		content: content || null,
		sort_order,
		priority: priority ?? null,
		user_id: ctx.userId,
		alias: await cardAlias(ctx, title)
	};
	await written(
		ctx,
		[
			ctx.d1.insert(todos).values(card),
			ctx.d1.insert(todo_assignees).values({ todo_id: id, user_id: ctx.userId })
		],
		[list.board_id],
		{ logs: [{ todo_id: id, action_type: 'created' }] }
	);
	return cardDetails(ctx, id);
};

export const updateTodo: D1Run<'updateTodo'> = async (ctx, { id, set }) => {
	const { card, boardId } = await requireCard(ctx, id, canEdit);
	// Moving a card to another list needs edit rights on that list's board too.
	const target =
		set.list_id && set.list_id !== card.list_id
			? await requireEditableList(ctx, set.list_id)
			: null;

	const { assigned_to, completed_at, due_on, ...rest } = set;
	// No column on D1: the primary is the oldest assignee. No client sends it any more.
	if (assigned_to !== undefined) throw new OpError(400, 'Use assignUser / unassignUser');
	const values = {
		...rest,
		...(completed_at !== undefined && { completed_at: completed_at && iso(completed_at) }),
		...(due_on !== undefined && { due_on: due_on && iso(due_on) })
	};
	const write = ctx.d1.update(todos).set(values).where(eq(todos.id, id));
	const log = cardActivity(card, set, target?.name);
	await written(ctx, [write], [boardId, target?.board_id], {
		logs: log ? [{ ...log, todo_id: id }] : []
	});
	return cardDetails(ctx, id);
};

export const deleteTodo: D1Run<'deleteTodo'> = async (ctx, { id }) => {
	const { boardId } = await requireCard(ctx, id, canEdit);
	// No 'deleted' activity row: activity_logs cascade away with their card.
	const [result] = await written(ctx, [ctx.d1.delete(todos).where(eq(todos.id, id))], [boardId]);
	return { deleted: changed(result) };
};
