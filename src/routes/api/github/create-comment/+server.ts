/** @file src/routes/api/github/create-comment/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { markComment } from '$lib/server/github/routeCards';
import { serverLog } from '$lib/server/log';
import { opCtx } from '$lib/server/ops/run';

interface CreateCommentInput {
	commentId: string;
	todoId: string;
	githubIssueNumber: number;
	owner: string;
	repo: string;
	body: string;
}

interface GitHubCommentResponse {
	id: number;
	html_url: string;
	body: string;
	created_at: string;
}

export const POST: RequestHandler = async ({ request: req, locals, platform }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { commentId, todoId, githubIssueNumber, owner, repo, body }: CreateCommentInput =
			await req.json();

		if (!commentId || !todoId || !githubIssueNumber || !owner || !repo || !body) {
			throw error(400, 'Missing required parameters');
		}

		const ctx = opCtx(session.user.id, platform);
		// Get decrypted GitHub token
		const githubToken = await getGithubToken(ctx, session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		// Create comment on GitHub
		const comment = await githubRequest<GitHubCommentResponse>(
			`/repos/${owner}/${repo}/issues/${githubIssueNumber}/comments`,
			githubToken,
			{
				method: 'POST',
				body: JSON.stringify({ body })
			}
		);

		// Update comment with GitHub metadata
		await markComment(ctx, commentId, comment.id);

		serverLog.info('GithubSync', 'Created GitHub comment', {
			commentId,
			todoId,
			githubCommentId: comment.id,
			issueNumber: githubIssueNumber,
			owner,
			repo
		});

		return json({
			success: true,
			githubCommentId: comment.id,
			githubCommentUrl: comment.html_url
		});
	} catch (err: any) {
		console.error('[create-comment] Error:', err);

		serverLog.error('GithubSync', 'Failed to create GitHub comment', {
			error: err.message,
			userId: session?.user?.id
		});

		// Handle specific GitHub errors
		if (err.message?.includes('404')) {
			throw error(404, 'Issue not found or access denied');
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded or insufficient permissions');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to create GitHub comment');
	}
};
