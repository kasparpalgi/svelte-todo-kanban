/** @file src/routes/+layout.server.ts */
import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getTopBoardPath, userLocale } from '$lib/server/topBoardPath';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

const allowedAppEnvs = ['production', 'testing', 'development'] as const;
const allowedApiEnvs = ['production', 'development'] as const;

type AppEnv = (typeof allowedAppEnvs)[number];
type ApiEnv = (typeof allowedApiEnvs)[number];

function isValidAppEnv(env: string): env is AppEnv {
	return allowedAppEnvs.includes(env as AppEnv);
}

function isValidApiEnv(env: string): env is ApiEnv {
	return allowedApiEnvs.includes(env as ApiEnv);
}

export const load: LayoutServerLoad = async (event) => {
	const { url, locals } = event;

	const appEnv = isValidAppEnv(PUBLIC_APP_ENV) ? PUBLIC_APP_ENV : 'development';
	const apiEnv = isValidApiEnv(PUBLIC_API_ENV) ? PUBLIC_API_ENV : 'development';

	const env = {
		app: appEnv,
		api: apiEnv
	};

	const session = await locals.auth();

	if (url.pathname === '/' && session) {
		const topBoardPath = await getTopBoardPath(session);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		} else {
			// Fetch user's current locale from database to avoid using stale session data.
			// Wrapped so a stale/invalid session (e.g. a cookie for a deleted user whose
			// token endpoint now returns 401) can't 500 the landing redirect.
			let locale = DEFAULT_LOCALE;
			if (session.user?.id) {
				locale = await userLocale(session.user.id).catch((err) => {
					console.error('[layout.server] locale lookup failed, using default:', err);
					return DEFAULT_LOCALE;
				});
			}
			throw redirect(302, `/${locale}`);
		}
	}

	if (url.pathname === '/auth/signin' && PUBLIC_APP_ENV !== 'development') {
		throw redirect(302, '/signin');
	}

	return {
		session,
		env
	};
};
