/** @file src/routes/api/auth/github/callback/+server.ts  */
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { UPDATE_USER } from '$lib/graphql/documents';
import { redirect } from '@sveltejs/kit';
import { encryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
import type { RequestEvent } from './$types';
import type { GetUserResult, GitHubTokenResponse, GitHubUser } from '$lib/types/github';

export async function GET({ url }: RequestEvent) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!state) {
		throw redirect(302, '/settings?error=missing_user_id');
	}

	if (!code) {
		throw redirect(302, '/settings?error=github_auth_failed');
	}

	try {
		// Must be byte-for-byte identical to the redirect_uri used at authorize time
		// (src/routes/api/github/+server.ts) or GitHub rejects the token exchange.
		const redirectUri = `${url.origin}/api/github/callback`;

		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				client_id: GITHUB_CLIENT_ID,
				client_secret: GITHUB_CLIENT_SECRET,
				code,
				redirect_uri: redirectUri
			})
		});

		const tokenData: GitHubTokenResponse = await tokenResponse.json();

		if (!tokenData.access_token || tokenData.error) {
			throw new Error(tokenData.error || 'Failed to get access token');
		}

		const userResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `token ${tokenData.access_token}`,
				Accept: 'application/vnd.github.v3+json'
			}
		});

		if (!userResponse.ok) {
			throw new Error('Failed to fetch GitHub user info');
		}

		const githubUser: GitHubUser = await userResponse.json();
		const encryptedToken = encryptToken(tokenData.access_token);

		const userData = await serverRequest<GetUserResult, { userId: string }>(
			`
			query GetUser($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					settings
				}
			}
		`,
			{ userId: state }
		);

		const currentSettings = userData.users_by_pk?.settings || {};

		const result = await serverRequest(UPDATE_USER, {
			where: { id: { _eq: state } },
			_set: {
				settings: {
					...currentSettings,
					tokens: {
						...(currentSettings.tokens || {}),
						github: {
							encrypted: encryptedToken,
							username: githubUser.login,
							connectedAt: new Date().toISOString()
						}
					}
				}
			}
		});

		throw redirect(302, '/settings?connected=github');
	} catch (error: any) {
		console.error('GitHub OAuth error:', error);
		throw redirect(
			302,
			`/settings?error=${encodeURIComponent(error.message || 'Failed to connect GitHub')}`
		);
	}
}
