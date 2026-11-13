/** @file src/lib/server/access.ts */
// Board access, checked in code because ops run with the admin secret. Ports the
// Hasura boards select permission: the owner, a member, or anyone for a public board.
import { GET_BOARD_ROLE } from '$lib/graphql/documents';
import type { Ctx } from '$lib/server/ops/op';

export type BoardRole = 'owner' | 'editor' | 'viewer' | 'public' | null;

// Matches no user: a signed-out caller can still see a public board.
const NO_USER = '00000000-0000-0000-0000-000000000000';

// One lookup per board per request: the ctx object lives for exactly one request.
const cache = new WeakMap<Ctx, Map<string, Promise<BoardRole>>>();

async function lookup({ db, userId }: Ctx, boardId: string): Promise<BoardRole> {
	const data = await db(GET_BOARD_ROLE, { boardId, userId: userId ?? NO_USER });
	const board = data.boards_by_pk;
	if (!board) return null;
	if (userId && board.user_id === userId) return 'owner';
	const role = board.board_members[0]?.role;
	if (role === 'owner' || role === 'editor' || role === 'viewer') return role;
	return board.is_public ? 'public' : null;
}

export function boardRole(ctx: Ctx, boardId: string): Promise<BoardRole> {
	let roles = cache.get(ctx);
	if (!roles) cache.set(ctx, (roles = new Map()));
	let role = roles.get(boardId);
	if (!role) roles.set(boardId, (role = lookup(ctx, boardId)));
	return role;
}

export const canRead = (role: BoardRole) => role !== null;
export const canEdit = (role: BoardRole) => role === 'owner' || role === 'editor';
