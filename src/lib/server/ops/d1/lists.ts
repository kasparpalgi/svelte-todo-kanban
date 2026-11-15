/** @file src/lib/server/ops/d1/lists.ts */
// The list ops on D1, with the same access rules as ops/lists.ts. Each write bumps
// `boards.changed_at` in the same batch, as `written()` does on Hasura (#241).
import { eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { boardRole, canEdit, canRead, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { board_members, boards, lists } from '$lib/server/db/schema';
import { OpError } from '../op';
import { githubJson } from './boardRows';
import { inList } from './sql';
import type { D1Run } from './types';

/** `boards.changed_at` (and, as the Postgres trigger did, `updated_at`) for the poll. */
export const stamp = (d1: D1, boardIds: (string | null | undefined)[]) =>
	d1
		.update(boards)
		.set({ changed_at: new Date().toISOString() })
		.where(inList(boards.id, [...new Set(boardIds.filter((id): id is string => !!id))]));

const board = {
	columns: { id: true, name: true, alias: true, sort_order: true, github_repo: true }
} as const;

/** Lists in the shape of Hasura's ListFields fragment. */
async function listRows(d1: D1, where: SQL | undefined, limit?: number) {
	const rows = await d1.query.lists.findMany({
		where,
		// en_US, as Postgres sorts: case-insensitive, then lower-case first ("Todo" < "TODO").
		orderBy: [
			sql`${lists.sort_order}`,
			sql`${lists.name} collate nocase`,
			sql`${lists.name} desc`,
			sql`${lists.id}`
		],
		limit,
		with: { board }
	});
	return rows.map((list) => {
		if (!list.board) return { ...list, board: null };
		const { github_repo, ...rest } = list.board;
		return { ...list, board: { ...rest, github: githubJson(github_repo) } };
	});
}

async function listBoard(d1: D1, id: string) {
	const [row] = await d1.select({ board_id: lists.board_id }).from(lists).where(eq(lists.id, id));
	if (!row?.board_id) throw new OpError(404, 'List not found');
	return row.board_id;
}

export const getLists: D1Run<'getLists'> = async (ctx, { boardId }) => {
	const { d1, userId } = ctx;
	const mine = or(
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
		),
		boardId && canRead(await boardRole(ctx, boardId)) ? eq(lists.board_id, boardId) : undefined
	);
	return listRows(d1, mine, 10_000);
};

export const createList: D1Run<'createList'> = async (ctx, { boardId, name, sort_order }) => {
	await requireRole(ctx, boardId, canEdit);
	const id = crypto.randomUUID();
	await ctx.d1.batch([
		ctx.d1.insert(lists).values({ id, board_id: boardId, name, sort_order }),
		stamp(ctx.d1, [boardId])
	]);
	const [list] = await listRows(ctx.d1, eq(lists.id, id));
	if (!list) throw new Error('created list not found');
	return list;
};

export const updateList: D1Run<'updateList'> = async (ctx, { id, set }) => {
	const boardId = await listBoard(ctx.d1, id);
	await requireRole(ctx, boardId, canEdit);
	// Moving a list to another board needs edit rights there too.
	if (set.board_id) await requireRole(ctx, set.board_id, canEdit);
	const stamped = stamp(ctx.d1, [boardId, set.board_id]);
	await (Object.keys(set).length
		? ctx.d1.batch([ctx.d1.update(lists).set(set).where(eq(lists.id, id)), stamped])
		: stamped);
	const [list] = await listRows(ctx.d1, eq(lists.id, id));
	if (!list) throw new OpError(404, 'List not found');
	return list;
};

export const deleteList: D1Run<'deleteList'> = async (ctx, { id }) => {
	const boardId = await listBoard(ctx.d1, id);
	await requireRole(ctx, boardId, canEdit);
	const [result] = await ctx.d1.batch([
		ctx.d1.delete(lists).where(eq(lists.id, id)),
		stamp(ctx.d1, [boardId])
	]);
	return { deleted: result.meta.changes > 0 };
};
