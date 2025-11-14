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

	// Validate that URL language matches user's stored locale preference
	if (session?.user?.locale && params.lang !== session.user.locale) {
		// Replace the lang parameter in the URL with the user's preferred locale
		const newPath = url.pathname.replace(`/${params.lang}/`, `/${session.user.locale}/`);
		throw redirect(302, newPath + url.search);
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
