/** @file src/routes/[lang]/[username]/[board]/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.auth();

	if (!session) {
		throw redirect(302, '/signin');
	}

	return {
		session
	};
};
