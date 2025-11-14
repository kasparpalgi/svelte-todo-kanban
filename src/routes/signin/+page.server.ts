/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_USERS } from '$lib/graphql/documents';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session) {
		const { getTopBoardPath } = await import('$lib/utils/getTopBoardPath');
		const topBoardPath = await getTopBoardPath(session, fetch);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		} else {
			// Fetch user's current locale from database to avoid using stale session data
			let locale = 'et';
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

				locale = userData.users?.[0]?.locale || 'et';
			}
			throw redirect(302, `/${locale}`);
		}
	}

	return {
		session: null
	};
};
