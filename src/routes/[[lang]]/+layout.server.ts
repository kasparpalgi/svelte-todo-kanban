/** @file src/routes/[[lang]]/+layout.server.ts */
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const supportedLocales = ['en', 'cs'];
const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event;
	const session = await locals.auth();

	let locale = params.lang || defaultLocale;
	if (!supportedLocales.includes(locale)) {
		locale = defaultLocale;
		throw redirect(302, `/${defaultLocale}${url.pathname.replace(`/${params.lang}`, '')}`);
	}

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, '/signin');
	}

	return {
		session,
		locale
	};
};
