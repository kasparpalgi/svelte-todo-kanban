/** @file src/routes/[lang]/splitwise/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth();
	if (!session) {
		throw redirect(302, '/signin');
	}
	return {
		session,
		lang: params.lang
	};
};
