/** @file src/lib/server/ops/invitations.ts */
// Board invitations. A board owner sends and cancels them; the invitee (matched by
// email or username) accepts or declines. Accepting is one op for the bell and for
// /invite/<token>: it checks the invitation, then joins with the invited role (#228).
import { z } from 'zod';
import {
	ACCEPT_INVITATION,
	CREATE_BOARD_INVITATION,
	DELETE_BOARD_INVITATION,
	GET_BOARD_INVITATIONS,
	GET_INVITATION,
	GET_INVITATION_BOARD,
	GET_MY_INVITATIONS,
	UPDATE_BOARD_INVITATION
} from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { identity, invitedWhere, isMember, isOwner, requireRole } from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

const which = z.union([
	z.object({ id: z.guid() }),
	z.object({ token: z.string().min(1).max(255) })
]);

/** The invitation, only when it is addressed to the caller. */
async function myInvitation(ctx: UserCtx, key: z.output<typeof which>) {
	const invited = await invitedWhere(ctx);
	if (!invited) throw new OpError(404, 'Invitation not found');
	const match = 'id' in key ? { id: { _eq: key.id } } : { token: { _eq: key.token } };
	const data = await ctx.db(GET_INVITATION, { where: { _and: [match, invited] } });
	const invitation = data.board_invitations[0];
	if (!invitation) throw new OpError(404, 'Invitation not found');
	return invitation;
}

function requirePending(invitation: { status: string; expires_at: string }) {
	if (invitation.status !== 'pending' || Date.parse(invitation.expires_at) <= Date.now()) {
		throw new OpError(400, 'Invitation is no longer pending');
	}
}

/** Pending invitations of a board, for its members' sharing panel. */
export const getBoardInvitations = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid() }),
	async run(ctx, { boardId }) {
		await requireRole(ctx, boardId, isMember);
		const data = await ctx.db(GET_BOARD_INVITATIONS, {
			where: { board_id: { _eq: boardId }, status: { _eq: 'pending' } },
			order_by: [{ created_at: Order_By.Desc }]
		});
		return data.board_invitations;
	}
});

/** The caller's own pending, unexpired invitations, for the bell. */
export const getMyInvitations = defineOp({
	auth: 'user',
	input: z.object({}),
	async run(ctx) {
		const { email, username } = await identity(ctx);
		if (!email && !username) return [];
		const data = await ctx.db(GET_MY_INVITATIONS, { email: email ?? '', username: username ?? '' });
		return data.board_invitations;
	}
});

export const createBoardInvitation = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid(),
		invitee: z.string().trim().min(1).max(255),
		role: z.enum(['editor', 'viewer'])
	}),
	async run(ctx, { boardId, invitee, role }) {
		await requireRole(ctx, boardId, isOwner);
		const to = invitee.includes('@') ? { invitee_email: invitee } : { invitee_username: invitee };
		// The DB trigger that made tokens was dropped long ago, so every invitation since
		// had none and the invite email (which needs it for /invite/<token>) never went out.
		const token = crypto.randomUUID().replaceAll('-', '');
		const data = await ctx.db(CREATE_BOARD_INVITATION, {
			objects: [{ board_id: boardId, inviter_id: ctx.userId, role, token, ...to }]
		});
		const invitation = data.insert_board_invitations?.returning[0];
		if (!invitation) throw new Error('insert_board_invitations returned no row');
		return invitation;
	}
});

export const cancelInvitation = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const found = await ctx.db(GET_INVITATION_BOARD, { id });
		const boardId = found.board_invitations_by_pk?.board_id;
		if (!boardId) throw new OpError(404, 'Invitation not found');
		await requireRole(ctx, boardId, isOwner);
		const data = await ctx.db(DELETE_BOARD_INVITATION, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_board_invitations?.affected_rows ?? 0) > 0 };
	}
});

/** Joins the board with the invited role. Accepting twice is fine; returns the board either way. */
export const acceptInvitation = defineOp({
	auth: 'user',
	input: which,
	async run(ctx, key) {
		const invitation = await myInvitation(ctx, key);
		if (invitation.status !== 'accepted') {
			requirePending(invitation);
			await ctx.db(ACCEPT_INVITATION, {
				id: invitation.id,
				member: { board_id: invitation.board_id, user_id: ctx.userId, role: invitation.role }
			});
		}
		return invitation.board;
	}
});

export const declineInvitation = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		requirePending(await myInvitation(ctx, { id }));
		await ctx.db(UPDATE_BOARD_INVITATION, {
			where: { id: { _eq: id } },
			_set: { status: 'declined' }
		});
		return { declined: true };
	}
});
