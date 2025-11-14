/** @file src/routes/+layout.server.ts */
import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';
import { request } from '$lib/graphql/client';
import { GET_USERS } from '$lib/graphql/documents';
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
	const { url, locals, fetch } = event;

	const appEnv = isValidAppEnv(PUBLIC_APP_ENV) ? PUBLIC_APP_ENV : 'development';
	const apiEnv = isValidApiEnv(PUBLIC_API_ENV) ? PUBLIC_API_ENV : 'development';

	const env = {
		app: appEnv,
		api: apiEnv
	};

	const session = await locals.auth();

	if (url.pathname === '/' && session) {
		const topBoardPath = await getTopBoardPath(session, fetch);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		} else {
			// Fetch user's current locale from database to avoid using stale session data
			let locale = DEFAULT_LOCALE;
			if (session.user?.id) {
				const userData = (await request(
					GET_USERS,
					{
						where: { id: { _eq: session.user.id } },
						limit: 1
					},
					undefined,
					fetch
				)) as any;

				locale = userData.users?.[0]?.locale || DEFAULT_LOCALE;
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
