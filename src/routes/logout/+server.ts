/** @file src/routes/logout/+server.ts */
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	// Auth.js uses __Secure- prefix in production (HTTPS).
	// Clear both variants to cover dev (HTTP) and prod (HTTPS).
	const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' } as const;

	event.cookies.delete('authjs.session-token', cookieOpts);
	event.cookies.delete('authjs.callback-url', { path: '/' });

	// __Secure- prefix requires secure:true in the Set-Cookie header
	event.cookies.delete('__Secure-authjs.session-token', {
		...cookieOpts,
		secure: true
	});

	throw redirect(303, '/signin');
};
