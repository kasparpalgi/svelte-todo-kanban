import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const supportedLocales = ['en', 'cs'];
const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event;
	const session = await locals.auth();

	if (url.pathname === '/') {
		if (!session) {
			throw redirect(302, '/signin');
		} else {
			throw redirect(302, `/${defaultLocale}`);
		}
	}

	let locale = params.lang || defaultLocale;

	if (!supportedLocales.includes(locale)) {
		locale = defaultLocale;
		const newPath = url.pathname.replace(`/${params.lang}`, '');
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
