import { redirect } from '@sveltejs/kit';
import { AUTH_GOOGLE_ID } from '$env/static/private';
import { PUBLIC_APP_ENV, PUBLIC_APP_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId');

	if (!userId) {
		throw redirect(302, '/settings?error=missing_user_id');
	}

	const redirectUri =
		PUBLIC_APP_ENV === 'development'
			? 'http://localhost:5173/api/google-calendar/callback'
			: `${PUBLIC_APP_URL}/api/google-calendar/callback`;

	const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authUrl.searchParams.set('client_id', AUTH_GOOGLE_ID);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');
	authUrl.searchParams.set('state', userId);

	throw redirect(302, authUrl.toString());
};
