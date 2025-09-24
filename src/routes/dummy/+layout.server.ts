/** @file src/routes/[[lang]]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const supportedLocales = ['en', 'cs'];
const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event;
	const session = await locals.auth();

	let locale = params.lang || defaultLocale;

	if (params.lang && !supportedLocales.includes(params.lang)) {
		locale = defaultLocale;
		const newPath = url.pathname.replace(`/${params.lang}`, '') || '/';
		throw redirect(302, `/${defaultLocale}${newPath}`);
	}

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, '/signin');
	}

	return {
		session,
		locale
	};
};
