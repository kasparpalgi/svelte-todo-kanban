/** @file src/routes/+layout.server.ts */
import type { LayoutServerLoad } from './$types';

const supportedLocales = ['en', 'cs'];
const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { url, locals } = event;
	const session = await locals.auth();

	// Extract locale from URL or use default
	let locale = defaultLocale;
	const pathSegments = url.pathname.split('/').filter(Boolean);
	if (pathSegments.length > 0 && supportedLocales.includes(pathSegments[0])) {
		locale = pathSegments[0];
	}

	return {
		session,
		locale
	};
};
