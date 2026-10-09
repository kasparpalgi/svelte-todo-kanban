/** @file src/routes/api/github/repos/+server.ts  */
import { json, error } from '@sveltejs/kit';
import { getGithubToken, githubRequest } from '$lib/server/github';
import type { RequestEvent } from './$types';

type Repo = { full_name: string; description: string | null };

const PER_PAGE = 100;
const MAX_PAGES = 10; // 1000 repos is plenty for a picker

export async function GET({ url }: RequestEvent) {
	const userId = url.searchParams.get('userId');
	if (!userId) throw error(401, 'User ID required');

	const token = await getGithubToken(userId);
	if (!token) throw error(400, 'GitHub not connected');

	try {
		// Page through everything: users with >100 repos never saw the older ones (#54).
		const repos: Repo[] = [];
		for (let page = 1; page <= MAX_PAGES; page++) {
			const batch = await githubRequest<Repo[]>(
				`/user/repos?per_page=${PER_PAGE}&sort=updated&page=${page}`,
				token
			);
			repos.push(...batch);
			if (batch.length < PER_PAGE) break;
		}

		return json(repos.map(({ full_name, description }) => ({ full_name, description })));
	} catch (err) {
		console.error('Error fetching GitHub repos:', err);
		throw error(500, err instanceof Error ? err.message : 'Failed to fetch repositories');
	}
}
