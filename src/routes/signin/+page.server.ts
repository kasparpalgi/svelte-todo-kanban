/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session) {
		const { getTopBoardPath } = await import('$lib/utils/getTopBoardPath');
		const topBoardPath = await getTopBoardPath(session, fetch);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		} else {
			const locale = session.user?.locale || 'et';
			throw redirect(302, `/${locale}`);
		}
	}

	return {
		session: null
	};
};
