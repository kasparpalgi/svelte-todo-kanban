/** @file src/lib/server/access.ts */
// Board access, checked in code because ops run with the admin secret. Ports the
// Hasura boards select permission: the owner, a member, or anyone for a public board.
import { GET_BOARD_ROLE, GET_USER_IDENTITY } from '$lib/graphql/documents';
import { OpError, type Ctx } from '$lib/server/ops/op';

export type BoardRole = 'owner' | 'editor' | 'viewer' | 'public' | null;

// Matches no user: a signed-out caller can still see a public board.
const NO_USER = '00000000-0000-0000-0000-000000000000';

// One lookup per board per request: the ctx object lives for exactly one request.
const cache = new WeakMap<Ctx, Map<string, Promise<BoardRole>>>();

type BoardAccess = {
	user_id: string;
	is_public?: boolean | null;
	board_members: { role: string }[];
};

/** A user's role from a board row whose `board_members` is filtered to that user. */
export function roleFrom(board: BoardAccess | null | undefined, userId: string | null): BoardRole {
	if (!board) return null;
	if (userId && board.user_id === userId) return 'owner';
	const role = board.board_members[0]?.role;
	if (role === 'owner' || role === 'editor' || role === 'viewer') return role;
	return board.is_public ? 'public' : null;
}

/** Any user's role on a board: is someone being assigned a member there? */
export async function roleOf({ db }: Ctx, boardId: string, userId: string): Promise<BoardRole> {
	const data = await db(GET_BOARD_ROLE, { boardId, userId });
	return roleFrom(data.boards_by_pk, userId);
}

function roles(ctx: Ctx) {
	let found = cache.get(ctx);
	if (!found) cache.set(ctx, (found = new Map()));
	return found;
}

export function boardRole(ctx: Ctx, boardId: string): Promise<BoardRole> {
	const cached = roles(ctx);
	let role = cached.get(boardId);
	if (!role) cached.set(boardId, (role = roleOf(ctx, boardId, ctx.userId ?? NO_USER)));
	return role;
}

/** Remember a role read along with another row (a card's board), saving a lookup. */
export function primeRole(ctx: Ctx, boardId: string, role: BoardRole) {
	roles(ctx).set(boardId, Promise.resolve(role));
}

export const canRead = (role: BoardRole) => role !== null;
export const canEdit = (role: BoardRole) => role === 'owner' || role === 'editor';

/** Throws 403 unless the caller's role on the board passes `allowed`. */
export async function requireRole(
	ctx: Ctx,
	boardId: string,
	allowed: (role: BoardRole) => boolean
): Promise<BoardRole> {
	const role = await boardRole(ctx, boardId);
	if (!allowed(role)) throw new OpError(403, 'Not allowed on this board');
	return role;
}

export const isMember = (role: BoardRole) => role !== null && role !== 'public';
export const isOwner = (role: BoardRole) => role === 'owner';

const identities = new WeakMap<Ctx, Promise<Identity>>();
type Identity = { email: string | null; username: string | null };

/** The caller's email and username, which invitations are addressed to. */
export function identity(ctx: Ctx): Promise<Identity> {
	let found = identities.get(ctx);
	if (!found) {
		found = ctx.userId
			? ctx.db(GET_USER_IDENTITY, { id: ctx.userId }).then((d) => ({
					email: d.users_by_pk?.email ?? null,
					username: d.users_by_pk?.username ?? null
				}))
			: Promise.resolve({ email: null, username: null });
		identities.set(ctx, found);
	}
	return found;
}

/** A Hasura filter for invitations addressed to the caller, or null when none can be. */
export async function invitedWhere(ctx: Ctx) {
	const { email, username } = await identity(ctx);
	const or = [
		...(email ? [{ invitee_email: { _eq: email } }] : []),
		...(username ? [{ invitee_username: { _eq: username } }] : [])
	];
	return or.length ? { _or: or } : null;
}
