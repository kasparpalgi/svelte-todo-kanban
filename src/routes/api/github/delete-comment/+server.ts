/** @file src/routes/api/github/delete-comment/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { loggingStore } from '$lib/stores/logging.svelte';

interface DeleteCommentInput {
	commentId: string;
	githubCommentId: number;
	owner: string;
	repo: string;
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { commentId, githubCommentId, owner, repo }: DeleteCommentInput = await req.json();

		if (!commentId || !githubCommentId || !owner || !repo) {
			throw error(400, 'Missing required parameters');
		}

		// Get decrypted GitHub token
		const githubToken = await getGithubToken(session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		// Delete comment on GitHub
		await githubRequest(
			`/repos/${owner}/${repo}/issues/comments/${githubCommentId}`,
			githubToken,
			{
				method: 'DELETE'
			}
		);

		loggingStore.info('GithubSync', 'Deleted GitHub comment', {
			commentId,
			githubCommentId,
			owner,
			repo
		});

		return json({
			success: true,
			message: 'GitHub comment deleted successfully'
		});
	} catch (err: any) {
		console.error('[delete-comment] Error:', err);

		loggingStore.error('GithubSync', 'Failed to delete GitHub comment', {
			error: err.message,
			userId: session?.user?.id
		});

		// Handle specific GitHub errors
		if (err.message?.includes('404')) {
			// Comment already deleted or doesn't exist on GitHub - not an error
			return json({
				success: true,
				message: 'Comment not found on GitHub (may already be deleted)'
			});
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded or insufficient permissions');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to delete GitHub comment');
	}
};
