/** @file src/lib/server/ops/d1/boards.ts */
// The board ops on D1, with the same access rules as ops/boards.ts. Create does what
// two Postgres triggers did: the alias (set_alias_on_insert) and the owner's member row
// (board_creator_as_owner), in one batch.
import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { boardRole, canEdit, canRead, isOwner, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { aliasBase, nextFree, prefixRange } from '$lib/server/db/rules';
import { board_invitations, board_members, boards } from '$lib/server/db/schema';
import { OpError, type UserCtx } from '../op';
import { invitedBoardIds, invitedSql } from './access';
import { boardRows, githubRepo } from './boardRows';
import type { D1Run } from './types';

type Ctx = UserCtx & { d1: D1 };

const iso = (time: string) => new Date(time).toISOString();

async function myBoards(ctx: Ctx) {
	const invited = await invitedSql(ctx);
	return or(
		eq(boards.user_id, ctx.userId),
		inArray(
			boards.id,
			ctx.d1
				.select({ id: board_members.board_id })
				.from(board_members)
				.where(eq(board_members.user_id, ctx.userId))
		),
		invited ? inArray(boards.id, invitedBoardIds(ctx.d1, invited)) : undefined
	);
}

export const getBoards: D1Run<'getBoards'> = async (ctx, { archived }) => {
	const shown = archived ? isNotNull(boards.archived_at) : isNull(boards.archived_at);
	return boardRows(ctx.d1, and(shown, await myBoards(ctx)), archived ? 'name' : 'switcher');
};

async function isInvitedTo(ctx: Ctx, boardId: string) {
	const to = await invitedSql(ctx);
	if (!to) return false;
	const [row] = await ctx.d1
		.select({ id: board_invitations.id })
		.from(board_invitations)
		.where(
			and(eq(board_invitations.board_id, boardId), eq(board_invitations.status, 'pending'), to)
		)
		.limit(1);
	return !!row;
}

export const getBoard: D1Run<'getBoard'> = async (ctx, { alias }) => {
	const [board] = await boardRows(ctx.d1, eq(boards.alias, alias));
	if (!board) return null;
	if (canRead(await boardRole(ctx, board.id)) || (await isInvitedTo(ctx, board.id))) return board;
	return null;
};

/** A board alias no board has yet (aliases are global). */
export async function boardAlias(d1: D1, name: string) {
	const base = aliasBase(name, 'board');
	const [from, to] = prefixRange(base);
	const taken = await d1
		.select({ alias: boards.alias })
		.from(boards)
		.where(and(sql`${boards.alias} >= ${from}`, sql`${boards.alias} < ${to}`));
	return nextFree(
		base,
		taken.map((r) => r.alias)
	);
}

/** Insert statements for a board and its owner's member row, for one `d1.batch()`. */
export function insertBoard(
	d1: D1,
	board: { id: string; user_id: string; name: string; alias: string; sort_order?: number }
) {
	return [
		d1.insert(boards).values(board),
		d1.insert(board_members).values({ board_id: board.id, user_id: board.user_id, role: 'owner' })
	] as const;
}

export const createBoard: D1Run<'createBoard'> = async ({ d1, userId }, { name, sort_order }) => {
	const id = crypto.randomUUID();
	const alias = await boardAlias(d1, name);
	await d1.batch(insertBoard(d1, { id, user_id: userId, name, alias, sort_order }));
	const [board] = await boardRows(d1, eq(boards.id, id));
	if (!board) throw new Error('created board not found');
	return board;
};

export const updateBoard: D1Run<'updateBoard'> = async (ctx, { id, set }) => {
	await requireRole(ctx, id, canEdit);
	const { github, archived_at, ...rest } = set;
	const values = {
		...rest,
		...(github !== undefined && { github_repo: githubRepo(github) }),
		...(archived_at !== undefined && { archived_at: archived_at && iso(archived_at) })
	};
	// `updated_at` is set by the schema's $onUpdateFn, as the Postgres trigger did.
	if (Object.keys(values).length) await ctx.d1.update(boards).set(values).where(eq(boards.id, id));
	const [board] = await boardRows(ctx.d1, eq(boards.id, id));
	if (!board) throw new OpError(404, 'Board not found');
	return board;
};

export const deleteBoard: D1Run<'deleteBoard'> = async (ctx, { id }) => {
	await requireRole(ctx, id, isOwner);
	const result = await ctx.d1.delete(boards).where(eq(boards.id, id));
	return { deleted: result.meta.changes > 0 };
};
