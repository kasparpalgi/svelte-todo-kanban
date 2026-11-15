/** @file src/lib/server/ops/d1/invitations.ts */
// The invitation ops on D1, with the same access rules as ops/invitations.ts (#241).
// Accepting joins the board and marks the invitation in one batch.
import { and, desc, eq, gt, ne, type SQL } from 'drizzle-orm';
import { isMember, isOwner, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { board_invitations as inv, board_members } from '$lib/server/db/schema';
import { OpError, type UserCtx } from '../op';
import { invitedSql } from './access';
import type { D1Run } from './types';

const user = {
	columns: { id: true, name: true, username: true, email: true, image: true }
} as const;
const board = { columns: { id: true, name: true, alias: true } } as const;

/** Invitations in the shape of Hasura's BoardInvitationFields fragment, newest first. */
const invitationRows = async (d1: D1, where: SQL | undefined) =>
	(
		await d1.query.board_invitations.findMany({
			where,
			orderBy: [desc(inv.created_at)],
			with: { inviter: user, board }
		})
	).map((i) => ({ ...i, inviter: i.inviter!, board: i.board! })); // NOT NULL foreign keys

type Key = { id: string } | { token: string };

/** The invitation, only when it is addressed to the caller. */
async function myInvitation(ctx: UserCtx & { d1: D1 }, key: Key) {
	const to = await invitedSql(ctx);
	if (!to) throw new OpError(404, 'Invitation not found');
	const match = 'id' in key ? eq(inv.id, key.id) : eq(inv.token, key.token);
	const invitation = await ctx.d1.query.board_invitations.findFirst({
		where: and(match, to),
		columns: {
			id: true,
			board_id: true,
			role: true,
			status: true,
			invitee_email: true,
			invitee_username: true,
			expires_at: true
		},
		with: { board: { ...board, with: { user: { columns: { username: true } } } } }
	});
	if (!invitation) throw new OpError(404, 'Invitation not found');
	return { ...invitation, board: { ...invitation.board!, user: invitation.board!.user! } };
}

function requirePending(invitation: { status: string; expires_at: string }) {
	if (invitation.status !== 'pending' || Date.parse(invitation.expires_at) <= Date.now()) {
		throw new OpError(400, 'Invitation is no longer pending');
	}
}

export const getBoardInvitations: D1Run<'getBoardInvitations'> = async (ctx, { boardId }) => {
	await requireRole(ctx, boardId, isMember);
	return invitationRows(ctx.d1, and(eq(inv.board_id, boardId), eq(inv.status, 'pending')));
};

export const getMyInvitations: D1Run<'getMyInvitations'> = async (ctx) => {
	const to = await invitedSql(ctx);
	if (!to) return [];
	const now = new Date().toISOString();
	return invitationRows(ctx.d1, and(eq(inv.status, 'pending'), gt(inv.expires_at, now), to));
};

export const createBoardInvitation: D1Run<'createBoardInvitation'> = async (ctx, input) => {
	const { boardId, invitee, role } = input;
	await requireRole(ctx, boardId, isOwner);
	const to = invitee.includes('@') ? { invitee_email: invitee } : { invitee_username: invitee };
	const id = crypto.randomUUID();
	// Hex, as the Hasura op makes it: the token goes into /invite/<token> unescaped.
	const token = crypto.randomUUID().replaceAll('-', '');
	await ctx.d1
		.insert(inv)
		.values({ id, board_id: boardId, inviter_id: ctx.userId, role, token, ...to });
	const [invitation] = await invitationRows(ctx.d1, eq(inv.id, id));
	if (!invitation) throw new Error('created invitation not found');
	return invitation;
};

export const cancelInvitation: D1Run<'cancelInvitation'> = async (ctx, { id }) => {
	const [found] = await ctx.d1.select({ board_id: inv.board_id }).from(inv).where(eq(inv.id, id));
	if (!found) throw new OpError(404, 'Invitation not found');
	await requireRole(ctx, found.board_id, isOwner);
	const result = await ctx.d1.delete(inv).where(eq(inv.id, id));
	return { deleted: result.meta.changes > 0 };
};

/** Joins the board with the invited role. Accepting twice is fine; returns the board either way. */
export const acceptInvitation: D1Run<'acceptInvitation'> = async (ctx, key) => {
	const invitation = await myInvitation(ctx, key);
	if (invitation.status !== 'accepted') {
		requirePending(invitation);
		const { d1 } = ctx;
		await d1.batch([
			d1
				.insert(board_members)
				.values({ board_id: invitation.board_id, user_id: ctx.userId, role: invitation.role })
				.onConflictDoUpdate({
					target: [board_members.board_id, board_members.user_id],
					set: { role: invitation.role },
					// An owner who accepts an old invitation stays owner.
					setWhere: ne(board_members.role, 'owner')
				}),
			d1.update(inv).set({ status: 'accepted' }).where(eq(inv.id, invitation.id))
		]);
	}
	return invitation.board;
};

export const declineInvitation: D1Run<'declineInvitation'> = async (ctx, { id }) => {
	requirePending(await myInvitation(ctx, { id }));
	await ctx.d1.update(inv).set({ status: 'declined' }).where(eq(inv.id, id));
	return { declined: true };
};
