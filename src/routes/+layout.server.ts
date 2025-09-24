import { APP_ENV } from '$env/static/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const defaultLocale = 'en';

export const load: LayoutServerLoad = async (event) => {
	const { url, locals } = event;
	const env = {
		app: APP_ENV,
		api: PUBLIC_API_ENV
	};
	const session = await locals.auth();

	if (url.pathname === '/') {
		if (!session) {
			throw redirect(302, '/signin');
		} else {
			//throw redirect(302, `/${defaultLocale}`);
		}
	}

	if (url.pathname === '/auth/signin' && APP_ENV !== 'development') {
		throw redirect(302, '/signin');
	}

	return {
		session,
		locale: defaultLocale,
		env
	};
};
