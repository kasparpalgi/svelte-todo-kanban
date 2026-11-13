/** @file src/lib/server/ops/d1/access.ts */
// The D1 side of src/lib/server/access.ts: the same rows, read with one statement each.
import { and, eq, or, type SQL } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { board_invitations, board_members, boards, users } from '$lib/server/db/schema';
import { identity } from '$lib/server/access';
import type { Ctx } from '../op';

/** The board's owner, publicity and this user's member row: what `roleFrom` reads. */
export async function boardAccess(d1: D1, boardId: string, userId: string) {
	const [row] = await d1
		.select({ user_id: boards.user_id, is_public: boards.is_public, role: board_members.role })
		.from(boards)
		.leftJoin(
			board_members,
			and(eq(board_members.board_id, boards.id), eq(board_members.user_id, userId))
		)
		.where(eq(boards.id, boardId));
	if (!row) return null;
	return { ...row, board_members: row.role ? [{ role: row.role }] : [] };
}

export async function userIdentity(d1: D1, userId: string) {
	const [row] = await d1
		.select({ email: users.email, username: users.username })
		.from(users)
		.where(eq(users.id, userId));
	return row ?? null;
}

/** Invitations addressed to the caller (by email or username), or null when none can be. */
export async function invitedSql(ctx: Ctx): Promise<SQL | null> {
	const { email, username } = await identity(ctx);
	const to = [
		email ? eq(board_invitations.invitee_email, email) : undefined,
		username ? eq(board_invitations.invitee_username, username) : undefined
	].filter((c) => c !== undefined);
	return to.length ? (or(...to) ?? null) : null;
}

/** Boards with a pending invitation matching `to`, as a sub-select. Not async: awaiting
 * a Drizzle builder runs it. */
export const invitedBoardIds = (d1: D1, to: SQL) =>
	d1
		.select({ id: board_invitations.board_id })
		.from(board_invitations)
		.where(and(eq(board_invitations.status, 'pending'), to));
