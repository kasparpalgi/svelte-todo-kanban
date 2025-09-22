/** @file src/routes/+layout.server.ts */
import { NODE_ENV } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const supportedLocales = ['en', 'cs'];
const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { url, locals } = event;
	const session = await locals.auth();
	const pathSegments = url.pathname.split('/').filter(Boolean);
	let locale = defaultLocale;

	if (url.pathname === '/auth/signin' && NODE_ENV !== 'development') {
		throw redirect(302, '/signin');
	}

	if (pathSegments.length > 0 && supportedLocales.includes(pathSegments[0])) {
		locale = pathSegments[0];
	}

	return {
		session,
		locale
	};
};
