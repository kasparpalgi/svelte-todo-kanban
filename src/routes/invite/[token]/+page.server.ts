/** @file src/routes/invite/[token]/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OpError } from '$lib/server/ops/op';
import { callOp, opCtx } from '$lib/server/ops/run';
import { getTopBoardPath, userLocale } from '$lib/server/topBoardPath';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

/**
 * Invitation landing route. The invite email links here (via the sign-in page,
 * which sets this as the post-auth `callbackUrl`). Once the invitee is signed in
 * with the invited email address, the pending invitation is accepted and they land
 * on the board — no bell click needed (task 196). Accepting is the same server op
 * the bell uses: it checks the invitation is pending and the caller's (#228).
 */
export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const token = params.token;
	const session = await locals.auth();

	// Not signed in yet → sign in first, keeping the token to come back here.
	if (!session?.user?.id) {
		throw redirect(302, `/signin?invite=${encodeURIComponent(token)}`);
	}
	const userId = session.user.id;
	const ctx = opCtx(userId, platform);

	const locale = await userLocale(ctx, userId).catch((error) => {
		console.error('[invite] Failed to load user locale:', error);
		return DEFAULT_LOCALE;
	});

	// Accepting an accepted invitation just returns its board. Not this account's,
	// expired or declined: land on the user's top board instead.
	let board: Awaited<ReturnType<typeof callOp<'acceptInvitation'>>> | null = null;
	try {
		board = await callOp('acceptInvitation', ctx, { token });
	} catch (error) {
		if (!(error instanceof OpError)) console.warn('[invite] Accept failed:', error);
	}

	const boardPath =
		board?.user.username && board.alias ? `/${locale}/${board.user.username}/${board.alias}` : null;
	throw redirect(302, boardPath || (await getTopBoardPath(ctx, session)) || `/${locale}`);
};
