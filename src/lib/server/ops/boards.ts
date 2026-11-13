/** @file src/lib/server/ops/boards.ts */
// Boards: the switcher list, one board by alias, and create / update / delete.
// Viewers are read-only; only an owner deletes a board (#228).
import { z } from 'zod';
import {
	CREATE_BOARD,
	DELETE_BOARD,
	GET_BOARDS,
	GET_INVITATION,
	UPDATE_BOARD
} from '$lib/graphql/documents';
import { Order_By, type Boards_Bool_Exp } from '$lib/graphql/generated/graphql';
import {
	boardRole,
	canEdit,
	canRead,
	invitedWhere,
	isOwner,
	requireRole
} from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

const name = z.string().trim().min(1).max(200);

/** Boards the caller owns, is a member of, or has a pending invitation to. Never strangers' public boards. */
async function myBoardsWhere(ctx: UserCtx): Promise<Boards_Bool_Exp> {
	const invited = await invitedWhere(ctx);
	const or: Boards_Bool_Exp[] = [
		{ user_id: { _eq: ctx.userId } },
		{ board_members: { user_id: { _eq: ctx.userId } } }
	];
	if (invited) or.push({ board_invitations: { _and: [{ status: { _eq: 'pending' } }, invited] } });
	return { _or: or };
}

/** Whether the caller has a pending invitation to this board, which lets them see it. */
async function isInvitedTo(ctx: UserCtx, boardId: string) {
	const invited = await invitedWhere(ctx);
	if (!invited) return false;
	const data = await ctx.db(GET_INVITATION, {
		where: { _and: [{ board_id: { _eq: boardId } }, { status: { _eq: 'pending' } }, invited] }
	});
	return data.board_invitations.length > 0;
}

/** The switcher's boards (or the archived ones), in the order the switcher shows them. */
export const getBoards = defineOp({
	auth: 'user',
	input: z.object({ archived: z.boolean().default(false) }),
	async run(ctx, { archived }) {
		const data = await ctx.db(GET_BOARDS, {
			where: { _and: [{ archived_at: { _is_null: !archived } }, await myBoardsWhere(ctx)] },
			order_by: archived
				? [{ name: Order_By.Asc }]
				: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }],
			limit: 1000
		});
		return data.boards;
	}
});

/** One board by its URL alias, or null when the caller may not see it. */
export const getBoard = defineOp({
	auth: 'user',
	input: z.object({ alias: z.string().min(1).max(200) }),
	async run(ctx, { alias }) {
		const data = await ctx.db(GET_BOARDS, { where: { alias: { _eq: alias } }, limit: 1 });
		const board = data.boards[0];
		if (!board) return null;
		if (canRead(await boardRole(ctx, board.id)) || (await isInvitedTo(ctx, board.id))) {
			return board;
		}
		return null;
	}
});

export const createBoard = defineOp({
	auth: 'user',
	input: z.object({ name, sort_order: z.number().int().default(0) }),
	async run({ db, userId }, { name, sort_order }) {
		const data = await db(CREATE_BOARD, { objects: [{ name, sort_order, user_id: userId }] });
		const board = data.insert_boards?.returning[0];
		if (!board) throw new Error('insert_boards returned no row');
		return board;
	}
});

export const updateBoard = defineOp({
	auth: 'user',
	input: z.object({
		id: z.guid(),
		set: z
			.object({
				name,
				sort_order: z.number().int(),
				github: z.string().max(10_000).nullable(),
				is_public: z.boolean(),
				allow_public_comments: z.boolean(),
				settings: z.record(z.string(), z.unknown()),
				archived_at: z.iso.datetime({ offset: true }).nullable(),
				client_id: z.guid().nullable()
			})
			.partial()
			.strict()
	}),
	async run(ctx, { id, set }) {
		await requireRole(ctx, id, canEdit);
		const data = await ctx.db(UPDATE_BOARD, { where: { id: { _eq: id } }, _set: set });
		const board = data.update_boards?.returning[0];
		if (!board) throw new OpError(404, 'Board not found');
		return board;
	}
});

export const deleteBoard = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		await requireRole(ctx, id, isOwner);
		const data = await ctx.db(DELETE_BOARD, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_boards?.affected_rows ?? 0) > 0 };
	}
});
