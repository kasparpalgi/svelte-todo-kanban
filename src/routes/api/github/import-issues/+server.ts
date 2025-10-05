/** @file src/routes/api/github/import-issues/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { GET_BOARDS, CREATE_TODO } from '$lib/graphql/documents';
import { loggingStore } from '$lib/stores/logging.svelte';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	html_url: string;
	state: 'open' | 'closed';
	closed_at: string | null;
	pull_request?: any;
	labels: Array<{ name: string }>;
	milestone?: { due_on: string | null };
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { boardId, targetListId } = await req.json();

		if (!boardId || !targetListId) {
			throw error(400, 'Missing boardId or targetListId');
		}

		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(boardId) || !uuidRegex.test(targetListId)) {
			throw error(400, 'Invalid boardId or targetListId format');
		}

		// 1. Get board with GitHub repo info
		const boardData = await serverRequest<GetBoardsQuery, { where: any }>(GET_BOARDS, {
			where: { id: { _eq: boardId } }
		});

		const board = boardData.boards[0];

		if (!board) {
			throw error(404, 'Board not found');
		}

		if (!board.github) {
			throw error(400, 'Board not connected to GitHub repository');
		}

		const githubData = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
		const { owner, repo } = githubData as { owner: string; repo: string };
		const githubToken = await getGithubToken(session.user.id);

		if (!githubToken) {
			throw error(401, 'GitHub not connected. Please connect GitHub in settings.');
		}

		const issues = await githubRequest<GitHubIssue[]>(
			`/repos/${owner}/${repo}/issues?state=open&per_page=100`,
			githubToken
		);

		if (!issues || issues.length === 0) {
			return json({
				success: true,
				imported: 0,
				total: 0,
				message: 'No issues found in repository'
			});
		}

		const issuesOnly = issues.filter((issue) => !issue.pull_request && issue.title?.trim());

		const todos = issuesOnly.map((issue, index) => {
			let priority: 'low' | 'medium' | 'high' | null = null;
			const priorityLabel = issue.labels.find((l) =>
				l.name.toLowerCase().includes('priority')
			)?.name.toLowerCase();

			if (priorityLabel?.includes('high')) {
				priority = 'high';
			} else if (priorityLabel?.includes('medium')) {
				priority = 'medium';
			} else if (priorityLabel?.includes('low')) {
				priority = 'low';
			}

			return {
				title: issue.title.trim(),
				content: issue.body?.trim() || null,
				list_id: targetListId,
				user_id: session.user.id,
				github_issue_number: issue.number,
				github_issue_id: issue.id,
				github_url: issue.html_url,
				github_synced_at: new Date().toISOString(),
				sort_order: index,
				priority: priority || 'medium',
				completed_at: issue.state === 'closed' ? issue.closed_at : null,
				due_on: issue.milestone?.due_on || null
			};
		});

		const result = await serverRequest(CREATE_TODO, {
			objects: todos
		});

		const imported = result.insert_todos?.returning?.length || 0;

		loggingStore.info('GithubImport', 'Successfully imported GitHub issues', {
			boardId,
			listId: targetListId,
			owner,
			repo,
			total: issuesOnly.length,
			imported
		});

		return json({
			success: true,
			imported,
			total: issuesOnly.length,
			message: `Successfully imported ${imported} of ${issuesOnly.length} issues`
		});
	} catch (err: any) {
		console.error('[import-issues] Error:', err);

		loggingStore.error('GithubImport', 'Failed to import GitHub issues', {
			error: err.message,
			userId: session?.user?.id
		});

		if (err.message?.includes('404')) {
			throw error(404, 'Repository not found or access denied');
		}

		if (err.message?.includes('403')) {
			throw error(403, 'GitHub rate limit exceeded. Please try again later.');
		}

		if (err.message?.includes('401')) {
			throw error(401, 'GitHub authentication failed. Please reconnect in settings.');
		}

		throw error(500, err.message || 'Failed to import issues');
	}
};
