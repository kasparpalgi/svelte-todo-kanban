/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';
import { isSocialMediaBot } from '$lib/server/userAgent';

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals, fetch, request } = event;
	const session = await locals.auth();

	// Check if this is a bot or preview mode
	const userAgent = request.headers.get('user-agent');
	const isBot = isSocialMediaBot(userAgent);
	const isPreviewMode = url.searchParams.get('og-preview') === 'true';

	// Allow bots and preview mode through without authentication
	// Regular users need to be authenticated (except on signin and auth pages)
	if (
		!session &&
		!isBot &&
		!isPreviewMode &&
		!url.pathname.includes('/signin') &&
		!url.pathname.includes('/api/auth')
	) {
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
