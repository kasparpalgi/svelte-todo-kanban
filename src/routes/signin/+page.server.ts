/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const session = await locals.auth();

	if (session) {
		try {
			const [{ getTopBoardPath, userLocale }, { opCtx }] = await Promise.all([
				import('$lib/server/topBoardPath'),
				import('$lib/server/ops/run')
			]);
			const ctx = opCtx(session.user?.id ?? null, platform);
			const topBoardPath = await getTopBoardPath(ctx, session);
			if (topBoardPath) {
				throw redirect(302, topBoardPath);
			} else {
				// Fetch user's current locale from database to avoid using stale session data
				let locale = DEFAULT_LOCALE;
				if (session.user?.id) {
					locale = await userLocale(ctx, session.user.id).catch(() => DEFAULT_LOCALE);
				}
				throw redirect(302, `/${locale}`);
			}
		} catch (error: any) {
			// Handle authentication errors (e.g., when session exists but cookies are cleared during logout)
			const isAuthError =
				error?.name === 'AuthenticationError' ||
				error?.message === 'Authentication required' ||
				error?.message?.toLowerCase().includes('auth') ||
				error?.message?.toLowerCase().includes('token');

			if (isAuthError) {
				// Session is invalid, treat as logged out
				console.debug('[signin] Authentication error during session check, treating as logged out');
				return { session: null };
			}

			// Re-throw redirects and other errors
			throw error;
		}
	}

	return {
		session: null
	};
};
