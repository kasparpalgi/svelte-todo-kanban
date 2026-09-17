/** @file src/routes/api/github/+server.ts  */
import { GITHUB_CLIENT_ID } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('userId');

	if (!userId) {
		throw redirect(302, '/settings?error=missing_user_id');
	}

	// Derive the callback from the real request origin so it always matches the
	// domain the user is on AND the callback route's token exchange. Relying on
	// PUBLIC_APP_URL sent GitHub an unregistered redirect_uri ("not associated with
	// this application") whenever that env var was misconfigured. #195
	const redirectUri = `${url.origin}/api/github/callback`;

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		scope: 'repo user read:org',
		redirect_uri: redirectUri,
		state: userId
	});

	throw redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
