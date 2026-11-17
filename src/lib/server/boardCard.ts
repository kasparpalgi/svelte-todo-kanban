/** @file src/lib/server/boardCard.ts */
// A board by its alias, and optionally one of its cards by alias, for the board page's
// OG tags and OG image. Runs the `getBoard` op's access check on the server, so the page
// load mints no Hasura JWT (#229). Card aliases are unique per user, so look in the board.
import { and, eq, inArray } from 'drizzle-orm';
import { GET_TODOS } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import { lists, todos } from '$lib/server/db/schema';
import { cardRows } from '$lib/server/ops/d1/cardRows';
import type { Ctx } from '$lib/server/ops/op';
import { callOp } from '$lib/server/ops/run';

async function cardIn(ctx: Ctx, boardId: string, alias: string) {
	if (ctx.d1) {
		const boardLists = ctx.d1.select({ id: lists.id }).from(lists).where(eq(lists.board_id, boardId));
		const where = and(eq(todos.alias, alias), inArray(todos.list_id, boardLists));
		return (await cardRows(ctx.d1, where, { limit: 1 }))[0] ?? null;
	}
	const data = await serverRequest(GET_TODOS, {
		where: { alias: { _eq: alias }, list: { board_id: { _eq: boardId } } },
		limit: 1
	});
	return data.todos[0] ?? null;
}

/** `ctx` carries the backend and the caller, whose access the board lookup checks. */
export async function boardAndCard(ctx: Ctx, boardAlias: string, cardAlias: string | null) {
	const board = await callOp('getBoard', ctx, { alias: boardAlias });
	if (!board || !cardAlias) return { board, card: null };
	return { board, card: await cardIn(ctx, board.id, cardAlias) };
}
