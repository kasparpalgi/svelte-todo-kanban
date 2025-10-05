/** @file src/lib/server/github.ts */
import { serverRequest } from '$lib/graphql/server-client';
import { decryptToken } from '$lib/utils/crypto';
import type { GetUserGithubTokenResult } from '$lib/types/github';

const GET_USER_GITHUB_TOKEN = `
  query GetUserGithubToken($userId: uuid!) {
    users_by_pk(id: $userId) {
      id
      settings
    }
  }
`;

/**
 * Get decrypted GitHub token for a user
 * @param userId - User's UUID
 * @returns Decrypted GitHub access token or null if not connected
 */
export async function getGithubToken(userId: string): Promise<string | null> {
	try {
		const data = await serverRequest<GetUserGithubTokenResult, { userId: string }>(
			GET_USER_GITHUB_TOKEN,
			{ userId }
		);

		const encryptedToken = data.users_by_pk?.settings?.tokens?.github?.encrypted;

		if (!encryptedToken) {
			return null;
		}

		return decryptToken(encryptedToken);
	} catch (error) {
		console.error('[getGithubToken] Error:', error);
		return null;
	}
}

/**
 * Make authenticated GitHub API request
 * @param endpoint - GitHub API endpoint (e.g., '/repos/owner/repo/issues')
 * @param token - GitHub access token
 * @param options - Fetch options
 */
export async function githubRequest<T = any>(
	endpoint: string,
	token: string,
	options: RequestInit = {}
): Promise<T> {
	const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github.v3+json',
			...options.headers
		}
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`GitHub API error (${response.status}): ${error}`);
	}

	return response.json();
}
