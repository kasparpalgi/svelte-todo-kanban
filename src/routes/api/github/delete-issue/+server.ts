/** @file src/routes/api/github/delete-issue/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { loggingStore } from '$lib/stores/logging.svelte';

interface DeleteIssueInput {
	todoId: string;
	githubIssueNumber: number;
	owner: string;
	repo: string;
	closeIssue?: boolean; // true = close, false/undefined = delete (not possible via API, so we close)
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { todoId, githubIssueNumber, owner, repo, closeIssue = true }: DeleteIssueInput =
			await req.json();

		if (!todoId || !githubIssueNumber || !owner || !repo) {
			throw error(400, 'Missing required parameters');
		}

		// Get decrypted GitHub token
		const githubToken = await getGithubToken(session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		// Close the issue on GitHub (GitHub API doesn't support deleting issues, only closing)
		await githubRequest(
			`/repos/${owner}/${repo}/issues/${githubIssueNumber}`,
			githubToken,
			{
				method: 'PATCH',
				body: JSON.stringify({
					state: 'closed'
				})
			}
		);

		loggingStore.info('GithubSync', 'Closed GitHub issue on todo deletion', {
			todoId,
			issueNumber: githubIssueNumber,
			owner,
			repo
		});

		return json({
			success: true,
			message: 'GitHub issue closed successfully'
		});
	} catch (err: any) {
		console.error('[delete-issue] Error:', err);

		loggingStore.error('GithubSync', 'Failed to close GitHub issue', {
			error: err.message,
			userId: session?.user?.id
		});

		// Handle specific GitHub errors
		if (err.message?.includes('404')) {
			// Issue already deleted or doesn't exist - not a critical error
			return json({
				success: true,
				message: 'Issue not found (may already be deleted)'
			});
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded or insufficient permissions');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to close GitHub issue');
	}
};
