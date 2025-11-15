/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_USERS } from '$lib/graphql/documents';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session) {
		try {
			const { getTopBoardPath } = await import('$lib/utils/getTopBoardPath');
			const topBoardPath = await getTopBoardPath(session, fetch);
			if (topBoardPath) {
				throw redirect(302, topBoardPath);
			} else {
				// Fetch user's current locale from database to avoid using stale session data
				let locale = DEFAULT_LOCALE;
				if (session.user?.id) {
					const userData = (await request(
						GET_USERS,
						{
							where: { id: { _eq: session.user.id } },
							limit: 1
						},
						undefined,
						fetch
					)) as any;

					locale = userData.users?.[0]?.locale || DEFAULT_LOCALE;
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
