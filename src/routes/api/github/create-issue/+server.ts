/** @file src/routes/api/github/create-issue/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { GET_BOARDS, UPDATE_TODOS } from '$lib/graphql/documents';
import { loggingStore } from '$lib/stores/logging.svelte';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

interface CreateIssueInput {
	todoId: string;
	title: string;
	body?: string | null;
	priority?: 'low' | 'medium' | 'high' | null;
}

interface GitHubIssueResponse {
	id: number;
	number: number;
	html_url: string;
	title: string;
	state: string;
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { todoId, title, body, priority }: CreateIssueInput = await req.json();

		if (!todoId || !title) {
			throw error(400, 'Missing todoId or title');
		}

		// 1. Get todo's board to find GitHub repo
		const todoData = await serverRequest<
			{
				todos_by_pk: {
					id: string;
					title: string;
					list: {
						board: {
							id: string;
							github: string | null;
						};
					};
				} | null;
			},
			{ todoId: string }
		>(
			`
			query GetTodoBoard($todoId: uuid!) {
				todos_by_pk(id: $todoId) {
					id
					title
					list {
						board {
							id
							github
						}
					}
				}
			}
		`,
			{ todoId }
		);

		const todo = todoData.todos_by_pk;

		if (!todo) {
			throw error(404, 'Todo not found');
		}

		if (!todo.list) {
			throw error(400, 'Todo must be assigned to a list to create GitHub issue');
		}

		if (!todo.list.board) {
			throw error(400, 'List must be assigned to a board to create GitHub issue');
		}

		const boardGithub = todo.list.board.github;

		if (!boardGithub) {
			throw error(400, 'Board not connected to GitHub repository');
		}

		const githubData = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
		const { owner, repo } = githubData as { owner: string; repo: string };

		// 2. Get decrypted GitHub token
		const githubToken = await getGithubToken(session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		// 3. Map priority to GitHub labels
		const labels: string[] = [];
		if (priority === 'high') {
			labels.push('priority: high');
		} else if (priority === 'medium') {
			labels.push('priority: medium');
		} else if (priority === 'low') {
			labels.push('priority: low');
		}

		// 4. Create issue on GitHub
		const issue = await githubRequest<GitHubIssueResponse>(
			`/repos/${owner}/${repo}/issues`,
			githubToken,
			{
				method: 'POST',
				body: JSON.stringify({
					title,
					body: body || '',
					labels
				})
			}
		);

		// 5. Update todo with GitHub metadata
		await serverRequest(UPDATE_TODOS, {
			where: { id: { _eq: todoId } },
			_set: {
				github_issue_number: issue.number,
				github_issue_id: issue.id,
				github_url: issue.html_url,
				github_synced_at: new Date().toISOString()
			}
		});

		loggingStore.info('GithubSync', 'Created GitHub issue from todo', {
			todoId,
			issueNumber: issue.number,
			issueUrl: issue.html_url,
			owner,
			repo
		});

		return json({
			success: true,
			issueNumber: issue.number,
			issueUrl: issue.html_url,
			issueId: issue.id
		});
	} catch (err: any) {
		console.error('[create-issue] Error:', err);

		loggingStore.error('GithubSync', 'Failed to create GitHub issue', {
			error: err.message,
			userId: session?.user?.id
		});

		// Handle specific GitHub errors
		if (err.message?.includes('404')) {
			throw error(404, 'Repository not found or access denied');
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded or insufficient permissions');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to create GitHub issue');
	}
};
