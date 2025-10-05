/** @file src/routes/api/github/update-issue/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { UPDATE_TODOS } from '$lib/graphql/documents';
import { loggingStore } from '$lib/stores/logging.svelte';

interface UpdateIssueInput {
	todoId: string;
	githubIssueNumber: number;
	owner: string;
	repo: string;
	title?: string;
	body?: string | null;
	state?: 'open' | 'closed';
}

interface GitHubIssueUpdateResponse {
	id: number;
	number: number;
	html_url: string;
	title: string;
	state: string;
}

export const PATCH: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { todoId, githubIssueNumber, owner, repo, title, body, state }: UpdateIssueInput =
			await req.json();

		if (!todoId || !githubIssueNumber || !owner || !repo) {
			throw error(400, 'Missing required parameters');
		}

		// Get decrypted GitHub token
		const githubToken = await getGithubToken(session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		// Build update payload (only include fields that are provided)
		const updatePayload: any = {};
		if (title !== undefined) updatePayload.title = title;
		if (body !== undefined) updatePayload.body = body || '';
		if (state !== undefined) updatePayload.state = state;

		// Update issue on GitHub
		const issue = await githubRequest<GitHubIssueUpdateResponse>(
			`/repos/${owner}/${repo}/issues/${githubIssueNumber}`,
			githubToken,
			{
				method: 'PATCH',
				body: JSON.stringify(updatePayload)
			}
		);

		// Update todo's synced_at timestamp
		await serverRequest(UPDATE_TODOS, {
			where: { id: { _eq: todoId } },
			_set: {
				github_synced_at: new Date().toISOString()
			}
		});

		loggingStore.info('GithubSync', 'Updated GitHub issue from todo', {
			todoId,
			issueNumber: issue.number,
			issueUrl: issue.html_url,
			owner,
			repo,
			updates: Object.keys(updatePayload)
		});

		return json({
			success: true,
			issueNumber: issue.number,
			issueUrl: issue.html_url,
			state: issue.state
		});
	} catch (err: any) {
		console.error('[update-issue] Error:', err);

		loggingStore.error('GithubSync', 'Failed to update GitHub issue', {
			error: err.message,
			userId: session?.user?.id
		});

		// Handle specific GitHub errors
		if (err.message?.includes('404')) {
			throw error(404, 'Repository or issue not found');
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded or insufficient permissions');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to update GitHub issue');
	}
};
