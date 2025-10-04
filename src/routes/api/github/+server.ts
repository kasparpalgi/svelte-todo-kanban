/** @file src/routes/api/github/+server.ts  */
import { GITHUB_CLIENT_ID } from '$env/static/private';
import { PUBLIC_APP_ENV, PUBLIC_APP_URL } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('userId');

	if (!userId) {
		throw redirect(302, '/settings?error=missing_user_id');
	}

	const redirectUri =
		PUBLIC_APP_ENV === 'development'
			? 'http://localhost:5173/api/github/callback'
			: `${PUBLIC_APP_URL}/api/github/callback`;

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		scope: 'repo user read:org',
		redirect_uri: redirectUri,
		state: userId
	});

	throw redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
