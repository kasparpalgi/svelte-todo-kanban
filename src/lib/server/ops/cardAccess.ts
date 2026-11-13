/** @file src/lib/server/ops/cardAccess.ts */
// A card belongs to a board through its list. Card ops find the card and the caller's
// role there in one read, and after a write stamp the board, which is what the 30 s
// poll compares (#229), along with the activity rows and notifications the write caused.
import {
	CARD_WRITTEN,
	GET_CARD_ACCESS,
	GET_LIST_BOARD,
	GET_TODO_DETAILS
} from '$lib/graphql/documents';
import type {
	Activity_Logs_Insert_Input,
	GetCardAccessQuery,
	Notifications_Insert_Input
} from '$lib/graphql/generated/graphql';
import { canEdit, primeRole, requireRole, roleFrom, type BoardRole } from '$lib/server/access';
import { serverLog } from '$lib/server/log';
import { OpError, type UserCtx } from './op';

export type Card = NonNullable<GetCardAccessQuery['todos_by_pk']>;

/** The card, its board and the caller's role there. 404 when gone, 403 unless `allowed`. */
export async function requireCard(
	ctx: UserCtx,
	id: string,
	allowed: (role: BoardRole) => boolean
): Promise<{ card: Card; boardId: string | null; role: BoardRole }> {
	const data = await ctx.db(GET_CARD_ACCESS, { id, userId: ctx.userId });
	const card = data.todos_by_pk;
	if (!card) throw new OpError(404, 'Card not found');

	const boardId = card.list?.board_id ?? null;
	// A card outside any list belongs to its creator alone.
	const role: BoardRole = boardId
		? roleFrom(card.list?.board, ctx.userId)
		: card.user_id === ctx.userId
			? 'owner'
			: null;
	if (boardId) primeRole(ctx, boardId, role);
	if (!allowed(role)) throw new OpError(403, 'Not allowed on this card');
	return { card, boardId, role };
}

/** A list's board and name. 403 unless the caller can edit that board. */
export async function requireEditableList(ctx: UserCtx, listId: string) {
	const data = await ctx.db(GET_LIST_BOARD, { id: listId });
	const list = data.lists_by_pk;
	if (!list?.board_id) throw new OpError(404, 'List not found');
	await requireRole(ctx, list.board_id, canEdit);
	return { ...list, board_id: list.board_id };
}

/** The card as the board shows it, with its body: what a card op hands back. */
export async function cardDetails(ctx: UserCtx, id: string) {
	const data = await ctx.db(GET_TODO_DETAILS, { where: { id: { _eq: id } } });
	const todo = data.todos[0];
	if (!todo) throw new OpError(404, 'Card not found');
	return todo;
}

type Effects = {
	logs?: Omit<Activity_Logs_Insert_Input, 'user_id'>[];
	notify?: Omit<Notifications_Insert_Input, 'triggered_by_user_id'>[];
};

/**
 * After a write: stamp `boards.changed_at` and add its activity and notifications, in one
 * transaction. The write itself already committed, so a failure here is logged, not
 * thrown: the caller's change stands and the next full refresh still picks it up.
 */
export async function written(
	ctx: UserCtx,
	boardIds: (string | null | undefined)[],
	{ logs = [], notify = [] }: Effects = {}
) {
	const ids = [...new Set(boardIds.filter((id): id is string => !!id))];
	const notifications = notify
		.filter((n) => n.user_id && n.user_id !== ctx.userId)
		.map((n) => ({ ...n, triggered_by_user_id: ctx.userId }));
	try {
		await ctx.db(CARD_WRITTEN, {
			boardIds: ids,
			at: new Date().toISOString(),
			logs: logs.map((log) => ({ ...log, user_id: ctx.userId })),
			notifications
		});
	} catch (error) {
		serverLog.error('api/data', 'Board stamp / activity write failed', String(error));
	}
}
