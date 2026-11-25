/** @file src/routes/api/auth/github/callback/+server.ts  */
import { env } from '$env/dynamic/private';
import { UPDATE_USER } from '$lib/graphql/documents';
import { isRedirect, redirect } from '@sveltejs/kit';
import { encryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
import { GITHUB_USER_AGENT } from '$lib/server/github';
import { opCtx } from '$lib/server/ops/run';
import { putSecret } from '$lib/server/secrets';
import type { RequestEvent } from './$types';
import type { GetUserResult, GitHubTokenResponse, GitHubUser } from '$lib/types/github';

async function saveOnHasura(userId: string, github: Record<string, string>) {
	const userData = await serverRequest<GetUserResult, { userId: string }>(
		`
		query GetUser($userId: uuid!) {
			users_by_pk(id: $userId) {
				id
				settings
			}
		}
	`,
		{ userId }
	);
	const currentSettings = userData.users_by_pk?.settings || {};
	await serverRequest(UPDATE_USER, {
		where: { id: { _eq: userId } },
		_set: {
			settings: {
				...currentSettings,
				tokens: { ...(currentSettings.tokens || {}), github }
			}
		}
	});
}

export async function GET({ url, platform }: RequestEvent) {
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
				Accept: 'application/json',
				'User-Agent': GITHUB_USER_AGENT
			},
			body: JSON.stringify({
				client_id: env.GITHUB_CLIENT_ID,
				client_secret: env.GITHUB_CLIENT_SECRET,
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
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': GITHUB_USER_AGENT
			}
		});

		if (!userResponse.ok) {
			throw new Error('Failed to fetch GitHub user info');
		}

		const githubUser: GitHubUser = await userResponse.json();
		const encryptedToken = encryptToken(tokenData.access_token);

		const token = {
			encrypted: encryptedToken,
			username: githubUser.login,
			connectedAt: new Date().toISOString()
		};
		const ctx = opCtx(state, platform);
		if (ctx.d1) {
			await putSecret(ctx.d1, state, 'github', token);
		} else {
			await saveOnHasura(state, token);
		}

		throw redirect(302, '/settings?connected=github');
	} catch (error: any) {
		// The success redirect is thrown inside the try: it is not a failure.
		if (isRedirect(error)) throw error;
		console.error('GitHub OAuth error:', error);
		throw redirect(
			302,
			`/settings?error=${encodeURIComponent(error.message || 'Failed to connect GitHub')}`
		);
	}
}
