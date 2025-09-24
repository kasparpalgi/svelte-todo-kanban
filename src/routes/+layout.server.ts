/** @file src/routes/+layout.server.ts */
import { APP_ENV } from '$env/static/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { locals } = event;

	const env = {
		app: APP_ENV,
		api: PUBLIC_API_ENV
	};

	const session = await locals.auth();

	return {
		session,
		locale: 'en',
		env
	};
};
