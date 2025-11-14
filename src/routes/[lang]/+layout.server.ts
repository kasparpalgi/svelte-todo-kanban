/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals, fetch } = event;
	const session = await locals.auth();

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, `/signin`);
	}

	const pathSegments = url.pathname.split('/').filter(Boolean);
	const isLanguageRootOnly = pathSegments.length === 1 && pathSegments[0] === params.lang;

	if (session && isLanguageRootOnly) {
		const topBoardPath = await getTopBoardPath(session, fetch);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		}
	}

	return {
		session
	};
};
