/** @file src/routes/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './signin/$types';

const defaultLocale = 'en';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (!session) {
		throw redirect(302, '/signin');
	}

	throw redirect(302, `/${defaultLocale}`);
};
