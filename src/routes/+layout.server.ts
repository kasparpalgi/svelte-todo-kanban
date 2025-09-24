/** @file src/routes/+layout.server.ts */
import { APP_ENV } from '$env/static/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const defaultLocale = 'en';

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

	const appEnv = isValidAppEnv(APP_ENV) ? APP_ENV : 'development';
	const apiEnv = isValidApiEnv(PUBLIC_API_ENV) ? PUBLIC_API_ENV : 'development';

	const env = {
		app: appEnv,
		api: apiEnv
	};

	const session = await locals.auth();

	if (url.pathname === '/') {
		if (!session) {
			throw redirect(302, '/signin');
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
