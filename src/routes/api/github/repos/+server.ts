/** @file src/routes/api/github/repos/+server.ts  */
import { json, error } from '@sveltejs/kit';
import { decryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
import type { RequestEvent } from './$types';
import type { GetUserGithubTokenResult } from '$lib/types/github';

export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('userId');

	if (!userId) {
		throw error(401, 'User ID required');
	}

	try {
		const userData = await serverRequest<GetUserGithubTokenResult, { userId: string }>(
			`query GetUserGithubToken($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					settings
				}
			}`,
			{ userId }
		);

		const encryptedToken = userData.users_by_pk?.settings?.tokens?.github?.encrypted;

		if (!encryptedToken) {
			throw error(400, 'GitHub not connected');
		}

		const githubToken = decryptToken(encryptedToken);

		const reposResponse = await fetch(
			'https://api.github.com/user/repos?per_page=100&sort=updated',
			{
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: 'application/vnd.github.v3+json'
				}
			}
		);

		if (!reposResponse.ok) {
			throw error(reposResponse.status, 'Failed to fetch GitHub repositories');
		}

		const repos = await reposResponse.json();

		return json(
			repos.map((repo: any) => ({
				full_name: repo.full_name,
				description: repo.description
			}))
		);
	} catch (err: any) {
		console.error('Error fetching GitHub repos:', err);
		throw error(500, err.message || 'Failed to fetch repositories');
	}
}
