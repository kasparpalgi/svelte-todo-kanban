/** @file src/routes/logout/+server.ts */
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();

	event.cookies.set('authjs.session-token', '', {
		path: '/',
		expires: new Date(0),
		httpOnly: true,
		sameSite: 'lax'
	});

	event.cookies.set('authjs.callback-url', '', {
		path: '/',
		expires: new Date(0),
		sameSite: 'lax'
	});

	throw redirect(303, '/signin');
};
