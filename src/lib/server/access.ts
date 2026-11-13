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
