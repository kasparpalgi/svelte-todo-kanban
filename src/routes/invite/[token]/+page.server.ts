/** @file src/routes/invite/[token]/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import {
	GET_INVITATION_BY_TOKEN,
	GET_USERS,
	ADD_BOARD_MEMBER,
	UPDATE_BOARD_INVITATION
} from '$lib/graphql/documents';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';
import { DEFAULT_LOCALE } from '$lib/constants/locale';
import type { GetInvitationByTokenQuery } from '$lib/graphql/generated/graphql';

/**
 * Invitation landing route. The invite email links here (via the sign-in page,
 * which sets this as the post-auth `callbackUrl`). Once the invitee is signed in
 * with the invited email address, the matching pending invitation is accepted
 * automatically and they are redirected straight to the board — no bell click
 * needed. See task 196.
 */
export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const token = params.token;
	const session = await locals.auth();

	// Not signed in yet → send to the sign-in page, preserving the token so it can
	// route back here after authentication.
	if (!session?.user?.id) {
		throw redirect(302, `/signin?invite=${encodeURIComponent(token)}`);
	}

	// Resolve the viewer's locale for building the board URL.
	let locale = DEFAULT_LOCALE;
	try {
		const userData = (await request(
			GET_USERS,
			{ where: { id: { _eq: session.user.id } }, limit: 1 },
			undefined,
			fetch
		)) as any;
		locale = userData?.users?.[0]?.locale || DEFAULT_LOCALE;
	} catch (error) {
		console.error('[invite] Failed to load user locale:', error);
	}

	// Look up the invitation by token. Hasura's select permission only returns it
	// when it belongs to the signed-in user (invitee_email = their email), so a
	// mismatched account simply gets no row back.
	let invitation: GetInvitationByTokenQuery['board_invitations'][number] | undefined;
	try {
		const data: GetInvitationByTokenQuery = await request(
			GET_INVITATION_BY_TOKEN,
			{ token },
			undefined,
			fetch
		);
		invitation = data.board_invitations?.[0];
	} catch (error) {
		console.error('[invite] Failed to look up invitation:', error);
	}

	const boardPath = (inv: NonNullable<typeof invitation>): string | null => {
		const username = inv.board?.user?.username;
		const alias = inv.board?.alias;
		return username && alias ? `/${locale}/${username}/${alias}` : null;
	};

	// No matching invitation for this account. Either it was accepted/expired, or
	// the user signed in with a different email than the one invited. If we can
	// still resolve the board (already a member), go there; otherwise land on the
	// user's top board and let them accept from the bell.
	if (!invitation) {
		const fallback = (await getTopBoardPath(session, fetch)) || `/${locale}`;
		throw redirect(302, fallback);
	}

	// Already accepted/declined — just take them to the board (or their top board).
	if (invitation.status !== 'pending') {
		const path = boardPath(invitation) || (await getTopBoardPath(session, fetch)) || `/${locale}`;
		throw redirect(302, path);
	}

	// Accept: add the board member, then mark the invitation accepted. Both are
	// best-effort — a failure on either shouldn't strand the user on a blank page.
	try {
		await request(
			ADD_BOARD_MEMBER,
			{
				objects: [
					{
						board_id: invitation.board_id,
						user_id: session.user.id,
						role: invitation.role
					}
				]
			},
			undefined,
			fetch
		);
	} catch (error) {
		console.warn('[invite] Add board member (may already be a member):', error);
	}

	try {
		await request(
			UPDATE_BOARD_INVITATION,
			{ where: { id: { _eq: invitation.id } }, _set: { status: 'accepted' } },
			undefined,
			fetch
		);
	} catch (error) {
		console.warn('[invite] Update invitation status:', error);
	}

	const path = boardPath(invitation) || (await getTopBoardPath(session, fetch)) || `/${locale}`;
	throw redirect(302, path);
};
