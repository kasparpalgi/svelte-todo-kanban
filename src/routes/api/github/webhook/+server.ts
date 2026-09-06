/** @file src/routes/api/github/webhook/+server.ts */
import { json, error } from '@sveltejs/kit';
import crypto from 'crypto';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { serverRequest } from '$lib/graphql/server-client';
import {
	UPDATE_TODOS,
	CREATE_COMMENT,
	UPDATE_COMMENT,
	DELETE_COMMENT,
	GET_TODO_BY_GITHUB_ISSUE,
	GET_COMMENT_BY_GITHUB_ID,
	GET_USER_BY_GITHUB_USERNAME,
	CREATE_ACTIVITY_LOG,
	CREATE_NOTIFICATION,
	GET_ACTIVITY_LOG_BY_COMMIT_SHA,
	GET_TODO_BY_ID,
	GET_BOARD_BY_REPO
} from '$lib/graphql/documents';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { findTaskFileRenames } from '$lib/server/taskfile';

/**
 * GitHub Webhook Endpoint
 *
 * Receives real-time events from GitHub when issues, comments, or commits change.
 * Implements signature verification for security.
 *
 * Supported events:
 * - issues: edited, closed, reopened, deleted, labeled/unlabeled (priority: high|medium|low)
 * - issue_comment: created, edited, deleted
 * - push: commits pushed to main/master branches (logs commits that reference issues)
 *
 * Every action creates an in-app notification for the todo's assignee (or board owner)
 * and, where relevant, an activity log entry attributed to the mapped app user. Comments
 * and commits are deduplicated so webhook redeliveries don't create duplicate records.
 */

interface GitHubIssueEvent {
	action: 'opened' | 'edited' | 'closed' | 'reopened' | 'deleted' | 'labeled' | 'unlabeled';
	issue: {
		id: number;
		number: number;
		title: string;
		body: string | null;
		state: 'open' | 'closed';
		html_url: string;
		closed_at: string | null;
		updated_at: string;
	};
	label?: {
		name: string;
	};
	sender?: {
		login: string;
	};
	repository: {
		full_name: string;
		owner: {
			login: string;
		};
		name: string;
	};
}

/** Maps a GitHub "priority: high|medium|low" label name to our priority value. */
function parsePriorityLabel(labelName: string): 'low' | 'medium' | 'high' | null {
	const match = /^priority:\s*(low|medium|high)$/i.exec(labelName.trim());
	return match ? (match[1].toLowerCase() as 'low' | 'medium' | 'high') : null;
}

interface GitHubCommentEvent {
	action: 'created' | 'edited' | 'deleted';
	comment: {
		id: number;
		body: string;
		html_url: string;
		created_at: string;
		updated_at: string;
		user: {
			login: string;
		};
	};
	issue: {
		id: number;
		number: number;
	};
	repository: {
		full_name: string;
	};
}

interface GitHubPushEvent {
	ref: string;
	before: string;
	after: string;
	repository: {
		id: number;
		full_name: string;
		owner: {
			login: string;
		};
		name: string;
	};
	pusher: {
		name: string;
		email: string;
	};
	commits: Array<{
		id: string;
		message: string;
		timestamp: string;
		url: string;
		author: {
			name: string;
			email: string;
			username?: string;
		};
		added: string[];
		removed: string[];
		modified: string[];
	}>;
}

/**
 * Verify GitHub webhook signature
 * Uses HMAC SHA-256 with the webhook secret
 */
function verifySignature(payload: string, signature: string | null): boolean {
	if (!signature) return false;
	if (!env.GITHUB_WEBHOOK_SECRET) {
		console.error('GITHUB_WEBHOOK_SECRET not configured');
		return false;
	}

	const hmac = crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET);
	const digest = 'sha256=' + hmac.update(payload).digest('hex');

	// Constant-time comparison to prevent timing attacks
	return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Handle issue events from GitHub
 */
async function handleIssueEvent(event: GitHubIssueEvent): Promise<void> {
	const { action, issue, label, sender } = event;

	// Find the todo associated with this GitHub issue
	const data = await serverRequest<{ todos: Array<any> }, { githubIssueId: number }>(
		GET_TODO_BY_GITHUB_ISSUE,
		{ githubIssueId: issue.id }
	);

	const todo = data?.todos?.[0];

	if (!todo) {
		// Issue not synced to our app, ignore
		console.log(`Issue #${issue.number} not found in database, skipping`);
		return;
	}

	console.log(`Processing GitHub issue event: ${action} for todo ${todo.id}`);

	// Who triggered this on GitHub, mapped to an app user if possible (used for activity
	// log attribution and to avoid self-notifying).
	const actorUserId = sender?.login
		? await findUserByGithubUsername(sender.login, todo)
		: (todo.list?.board?.user_id ?? null);
	const logUserId: string | undefined = actorUserId ?? todo.list?.board?.user_id ?? undefined;

	switch (action) {
		case 'edited': {
			// Update todo title and content if changed
			const updates: any = {};
			if (issue.title !== todo.title) {
				updates.title = issue.title;
			}
			if (issue.body !== todo.content) {
				updates.content = issue.body;
			}

			if (Object.keys(updates).length > 0) {
				updates.github_synced_at = new Date().toISOString();
				await serverRequest(UPDATE_TODOS, {
					where: { id: { _eq: todo.id } },
					_set: updates
				});
				console.log(`Updated todo ${todo.id} from GitHub edit`);

				if (logUserId) {
					const titleChanged = updates.title !== undefined;
					try {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: logUserId,
								action_type: titleChanged ? 'title_changed' : 'content_updated',
								field_name: titleChanged ? 'title' : 'content',
								old_value: titleChanged ? todo.title : 'Content updated',
								new_value: titleChanged ? updates.title : 'Content updated',
								changes: { source: 'github', github_issue_number: issue.number }
							}
						});
					} catch (error) {
						console.error('Failed to log activity for GitHub issue edit:', error);
					}
				}

				await notifyUser(
					todo,
					'edited',
					actorUserId,
					`Issue #${issue.number} was edited on GitHub`
				);
			}
			break;
		}

		case 'closed':
			// Mark todo as completed
			if (!todo.completed_at) {
				await serverRequest(UPDATE_TODOS, {
					where: { id: { _eq: todo.id } },
					_set: {
						completed_at: issue.closed_at || new Date().toISOString(),
						github_synced_at: new Date().toISOString()
					}
				});
				console.log(`Marked todo ${todo.id} as completed from GitHub close`);

				if (logUserId) {
					try {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: logUserId,
								action_type: 'completed',
								changes: { source: 'github', github_issue_number: issue.number }
							}
						});
					} catch (error) {
						console.error('Failed to log activity for GitHub issue close:', error);
					}
				}
			}
			break;

		case 'reopened':
			// Reopen todo
			if (todo.completed_at) {
				await serverRequest(UPDATE_TODOS, {
					where: { id: { _eq: todo.id } },
					_set: {
						completed_at: null,
						github_synced_at: new Date().toISOString()
					}
				});
				console.log(`Reopened todo ${todo.id} from GitHub reopen`);

				if (logUserId) {
					try {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: logUserId,
								action_type: 'uncompleted',
								changes: { source: 'github', github_issue_number: issue.number }
							}
						});
					} catch (error) {
						console.error('Failed to log activity for GitHub issue reopen:', error);
					}
				}
			}
			break;

		case 'labeled':
		case 'unlabeled': {
			// Priority label added/removed → sync todos.priority
			const priorityFromLabel = label ? parsePriorityLabel(label.name) : null;
			if (!priorityFromLabel) {
				console.log(`Ignoring non-priority label "${label?.name}" on issue #${issue.number}`);
				break;
			}

			const newPriority = action === 'labeled' ? priorityFromLabel : null;

			if (todo.priority === newPriority) {
				// Already in sync (or this label removal doesn't match the current priority)
				break;
			}
			if (action === 'unlabeled' && todo.priority !== priorityFromLabel) {
				// A different priority label was removed than the one currently set, ignore
				break;
			}

			await serverRequest(UPDATE_TODOS, {
				where: { id: { _eq: todo.id } },
				_set: { priority: newPriority, github_synced_at: new Date().toISOString() }
			});
			console.log(`Synced todo ${todo.id} priority to "${newPriority}" from GitHub label`);

			if (logUserId) {
				try {
					await serverRequest(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todo.id,
							user_id: logUserId,
							action_type: 'priority_changed',
							field_name: 'priority',
							old_value: todo.priority || 'none',
							new_value: newPriority || 'none',
							changes: { source: 'github', github_issue_number: issue.number }
						}
					});
				} catch (error) {
					console.error('Failed to log activity for GitHub priority label change:', error);
				}
			}

			await notifyUser(
				todo,
				'priority_changed',
				actorUserId,
				`Priority changed to ${newPriority || 'none'} on GitHub`
			);
			break;
		}

		case 'deleted':
			// Optionally handle issue deletion
			// For now, we'll just log it and leave the todo intact
			console.log(`GitHub issue #${issue.number} was deleted, todo ${todo.id} preserved`);
			break;

		default:
			console.log(`Unhandled issue action: ${action}`);
	}
}

/**
 * Find user by GitHub username from their settings
 * Falls back to the todo's board owner if user not found
 */
async function findUserByGithubUsername(
	githubUsername: string,
	fallbackTodo: any
): Promise<string | null> {
	try {
		// Try to find user by GitHub username in settings
		const userData = await serverRequest<{ users: Array<any> }, { githubUsername: string }>(
			GET_USER_BY_GITHUB_USERNAME,
			{ githubUsername }
		);

		if (userData?.users?.length > 0) {
			return userData.users[0].id;
		}

		// Fallback: use the board owner
		const boardOwnerId = fallbackTodo?.list?.board?.user_id;
		if (boardOwnerId) {
			console.log(
				`GitHub user ${githubUsername} not found, using board owner ${boardOwnerId} as fallback`
			);
			return boardOwnerId;
		}

		console.log(`Could not map GitHub user ${githubUsername} to app user`);
		return null;
	} catch (error) {
		console.error('Error finding user by GitHub username:', error);
		return null;
	}
}

/**
 * Notify the todo's assignee (or board owner as fallback) about an action that came in
 * from GitHub. Never notifies the user who triggered the action themselves.
 */
async function notifyUser(
	todo: any,
	type: 'commented' | 'comment_edited' | 'comment_removed' | 'edited' | 'priority_changed',
	triggeredByUserId: string | null,
	content: string,
	relatedCommentId?: string
): Promise<void> {
	const targetUserId: string | undefined = todo?.assigned_to || todo?.list?.board?.user_id;

	if (!targetUserId || targetUserId === triggeredByUserId) {
		return;
	}

	try {
		await serverRequest(CREATE_NOTIFICATION, {
			notification: {
				user_id: targetUserId,
				todo_id: todo.id,
				type,
				triggered_by_user_id: triggeredByUserId,
				related_comment_id: relatedCommentId,
				content
			}
		});
	} catch (error) {
		console.error(`Failed to create ${type} notification for todo ${todo.id}:`, error);
	}
}

/**
 * Handle comment events from GitHub
 */
async function handleCommentEvent(event: GitHubCommentEvent): Promise<void> {
	const { action, comment, issue } = event;

	// First, find the todo this comment belongs to
	const todoData = await serverRequest<{ todos: Array<any> }, { githubIssueId: number }>(
		GET_TODO_BY_GITHUB_ISSUE,
		{ githubIssueId: issue.id }
	);

	const todo = todoData?.todos?.[0];

	if (!todo) {
		console.log(`Issue #${issue.number} not found, skipping comment event`);
		return;
	}

	console.log(`Processing GitHub comment event: ${action} for todo ${todo.id}`);

	switch (action) {
		case 'created':
			// Check if comment already exists
			const existingData = await serverRequest<
				{ comments: Array<any> },
				{ githubCommentId: number }
			>(GET_COMMENT_BY_GITHUB_ID, { githubCommentId: comment.id });

			if (existingData?.comments?.length === 0) {
				// Find or map the user
				const userId = await findUserByGithubUsername(comment.user.login, todo);

				if (userId) {
					// Determine if this is a fallback user (board owner) vs actual mapped user
					const userData = await serverRequest<{ users: Array<any> }, { githubUsername: string }>(
						GET_USER_BY_GITHUB_USERNAME,
						{ githubUsername: comment.user.login }
					);

					const isActualUser = userData?.users?.length > 0;

					// Prefix comment with GitHub username if using fallback user
					const commentContent = isActualUser
						? comment.body
						: `**[${comment.user.login} on GitHub]:**\n\n${comment.body}`;

					// Create new comment
					const result = await serverRequest(CREATE_COMMENT, {
						objects: [
							{
								todo_id: todo.id,
								user_id: userId,
								content: commentContent,
								github_comment_id: comment.id,
								github_synced_at: new Date().toISOString()
							}
						]
					});

					const newComment = result?.insert_comments?.returning?.[0];
					if (newComment) {
						console.log(
							`Created comment ${newComment.id} from GitHub comment ${comment.id} (${isActualUser ? 'mapped user' : 'fallback to board owner'})`
						);

						// Log activity
						try {
							await serverRequest(CREATE_ACTIVITY_LOG, {
								log: {
									todo_id: todo.id,
									user_id: userId,
									action_type: 'commented',
									new_value:
										comment.body.substring(0, 200) + (comment.body.length > 200 ? '...' : ''),
									changes: {
										source: 'github',
										github_comment_id: comment.id,
										github_user: comment.user.login,
										is_fallback_user: !isActualUser
									}
								}
							});
						} catch (error) {
							console.error('Failed to log activity for GitHub comment creation:', error);
						}

						await notifyUser(
							todo,
							'commented',
							isActualUser ? userId : null,
							`${comment.user.login} commented on GitHub: "${comment.body.substring(0, 100)}${comment.body.length > 100 ? '...' : ''}"`,
							newComment.id
						);
					}
				} else {
					console.log(`Could not create comment: user mapping failed for ${comment.user.login}`);
				}
			}
			break;

		case 'edited':
			// Find existing comment
			const commentData = await serverRequest<
				{ comments: Array<any> },
				{ githubCommentId: number }
			>(GET_COMMENT_BY_GITHUB_ID, { githubCommentId: comment.id });

			const existingComment = commentData?.comments?.[0];

			if (existingComment && existingComment.content !== comment.body) {
				const editorUserId = await findUserByGithubUsername(comment.user.login, todo);

				await serverRequest(UPDATE_COMMENT, {
					where: { id: { _eq: existingComment.id } },
					_set: {
						content: comment.body,
						github_synced_at: new Date().toISOString()
					}
				});
				console.log(`Updated comment ${existingComment.id} from GitHub edit`);

				// Log activity
				if (editorUserId) {
					try {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: editorUserId,
								action_type: 'comment_edited',
								old_value:
									existingComment.content.substring(0, 200) +
									(existingComment.content.length > 200 ? '...' : ''),
								new_value:
									comment.body.substring(0, 200) + (comment.body.length > 200 ? '...' : ''),
								changes: { source: 'github', github_comment_id: comment.id }
							}
						});
					} catch (error) {
						console.error('Failed to log activity for GitHub comment edit:', error);
					}
				}

				await notifyUser(
					todo,
					'comment_edited',
					editorUserId,
					`${comment.user.login} edited a comment on GitHub`,
					existingComment.id
				);
			}
			break;

		case 'deleted':
			// Find and delete comment
			const deleteData = await serverRequest<{ comments: Array<any> }, { githubCommentId: number }>(
				GET_COMMENT_BY_GITHUB_ID,
				{ githubCommentId: comment.id }
			);

			const commentToDelete = deleteData?.comments?.[0];

			if (commentToDelete) {
				const deleterUserId =
					(await findUserByGithubUsername(comment.user.login, todo)) ?? commentToDelete.user_id;

				// Log activity BEFORE deletion
				if (deleterUserId) {
					try {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: deleterUserId,
								action_type: 'comment_deleted',
								changes: { source: 'github', github_comment_id: comment.id }
							}
						});
					} catch (error) {
						console.error('Failed to log activity for GitHub comment deletion:', error);
					}
				}

				await notifyUser(
					todo,
					'comment_removed',
					deleterUserId ?? null,
					`${comment.user.login} deleted a comment on GitHub`
				);

				// Delete the comment
				await serverRequest(DELETE_COMMENT, {
					where: { id: { _eq: commentToDelete.id } }
				});
				console.log(
					`Deleted comment ${commentToDelete.id} from GitHub comment deletion ${comment.id}`
				);
			}
			break;

		default:
			console.log(`Unhandled comment action: ${action}`);
	}
}

/**
 * Extract issue numbers from commit message
 * Looks for patterns like #123, fixes #456, closes #789, etc.
 */
function extractIssueNumbers(message: string): number[] {
	const patterns = [
		/#(\d+)/g, // Basic #123
		/(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi // Keywords + #123
	];

	const issueNumbers = new Set<number>();

	for (const pattern of patterns) {
		const matches = message.matchAll(pattern);
		for (const match of matches) {
			const issueNumber = parseInt(match[1], 10);
			if (!isNaN(issueNumber)) {
				issueNumbers.add(issueNumber);
			}
		}
	}

	return Array.from(issueNumbers);
}

/**
 * Handle push events from GitHub
 * Logs commits that reference issues in the activity log
 */

/** Move the card to Review and post a comment when a DONE file is pushed. */
async function handleTaskFileDone(
	rename: { number: string; doneFile: string },
	commit: GitHubPushEvent['commits'][number],
	repository: GitHubPushEvent['repository']
): Promise<void> {
	// Find the board owner and their token
	const boardData = await serverRequest<
		{ boards: Array<{ id: string; user_id: string; lists: Array<{ id: string; name: string }> }> },
		{ fullName: string }
	>(GET_BOARD_BY_REPO, { fullName: `%${repository.full_name}%` });

	const board = boardData?.boards?.[0];
	if (!board) {
		console.log(`[016] No board found for repo ${repository.full_name}`);
		return;
	}

	const token = await getGithubToken(board.user_id);

	// Fetch DONE file to extract card ID
	let cardId: string | null = null;
	if (token) {
		try {
			const fileResp = await githubRequest<{ content: string }>(
				`/repos/${repository.full_name}/contents/${rename.doneFile}?ref=${commit.id}`,
				token
			);
			const content = Buffer.from(fileResp.content, 'base64').toString('utf-8');
			const match = /From Kanban card `([0-9a-f-]+)`/.exec(content);
			cardId = match?.[1] ?? null;
		} catch (err) {
			console.log(`[016] Could not fetch DONE file content: ${(err as Error).message}`);
		}
	}

	if (!cardId) {
		console.log(`[016] Card ID not found in DONE file ${rename.doneFile}, skipping`);
		return;
	}

	// Load the todo
	const todoData = await serverRequest(GET_TODO_BY_ID, { id: cardId });
	const todo = todoData?.todos_by_pk;
	if (!todo) {
		console.log(`[016] Todo ${cardId} not found`);
		return;
	}

	const lists: Array<{ id: string; name: string }> = todo.list?.board?.lists ?? board.lists;
	const currentList = lists.find((l: { id: string }) => l.id === todo.list_id);

	// Idempotency: skip if already past TODO
	if (currentList && !/todo/i.test(currentList.name)) {
		console.log(`[016] Card ${cardId} already in "${currentList.name}", skipping`);
		return;
	}

	const reviewList = lists.find((l: { name: string }) => /review/i.test(l.name));
	const ownerId: string = todo.list?.board?.user_id ?? board.user_id;

	if (reviewList) {
		await serverRequest(UPDATE_TODOS, {
			where: { id: { _eq: cardId } },
			_set: { list_id: reviewList.id }
		});
		console.log(`[016] Moved card ${cardId} to "${reviewList.name}"`);
	} else {
		console.log(`[016] No Review list on board, skipping move`);
	}

	const shortSha = commit.id.substring(0, 7);
	await serverRequest(CREATE_COMMENT, {
		objects: [
			{
				todo_id: cardId,
				user_id: ownerId,
				content: `✅ **Task complete** — [\`${shortSha}\`](${commit.url})\n\n\`${rename.doneFile}\``
			}
		]
	});
	console.log(`[016] Posted completion comment on card ${cardId}`);

	// Close linked GitHub issue
	if (todo.github_issue_number && token) {
		try {
			await githubRequest(
				`/repos/${repository.full_name}/issues/${todo.github_issue_number}`,
				token,
				{ method: 'PATCH', body: JSON.stringify({ state: 'closed' }) }
			);
			console.log(`[016] Closed GitHub issue #${todo.github_issue_number}`);
		} catch (err) {
			console.error(`[016] Failed to close GitHub issue: ${(err as Error).message}`);
		}
	}
}

async function handlePushEvent(event: GitHubPushEvent): Promise<void> {
	const { commits, repository, ref } = event;

	// Only process commits on main/master branches
	const branch = ref.replace('refs/heads/', '');
	if (!['main', 'master'].includes(branch)) {
		console.log(`Skipping push event on branch ${branch} (only processing main/master)`);
		return;
	}

	console.log(
		`Processing ${commits.length} commits from push event on ${repository.full_name}/${branch}`
	);

	for (const commit of commits) {
		// Extract issue numbers from commit message
		const issueNumbers = extractIssueNumbers(commit.message);

		if (issueNumbers.length === 0) {
			continue; // Skip commits that don't reference any issues
		}

		console.log(
			`Commit ${commit.id.substring(0, 7)} references issues: ${issueNumbers.join(', ')}`
		);

		// For each issue number, find the corresponding todo and log activity
		for (const issueNumber of issueNumbers) {
			try {
				// Find todos for this repository with this issue number
				const todoData = await serverRequest<
					{ todos: Array<any> },
					{ issueNumber: number; repo: string }
				>(
					`
						query GetTodoByIssueNumber($issueNumber: bigint!, $repo: String!) {
							todos(
								where: {
									github_issue_number: { _eq: $issueNumber }
									list: { board: { github: { _ilike: $repo } } }
								}
								limit: 1
							) {
								id
								title
								github_issue_number
								list {
									board {
										id
										user_id
										github
									}
								}
							}
						}
					`,
					{ issueNumber, repo: `%${repository.full_name}%` }
				);

				const todo = todoData?.todos?.[0];

				if (todo) {
					// Dedup: GitHub may redeliver the same push event, don't double-log the commit
					const existingLog = await serverRequest<{ activity_logs: Array<any> }, any>(
						GET_ACTIVITY_LOG_BY_COMMIT_SHA,
						{ todoId: todo.id, commitSha: { commit_sha: commit.id } }
					);

					if (existingLog?.activity_logs?.length > 0) {
						console.log(
							`Commit ${commit.id.substring(0, 7)} already logged for todo ${todo.id}, skipping`
						);
						continue;
					}

					// Log commit activity
					const commitShortId = commit.id.substring(0, 7);
					const commitFirstLine = commit.message.split('\n')[0];
					const commitAuthor = commit.author.username || commit.author.name;
					const authorUserId =
						(commit.author.username
							? await findUserByGithubUsername(commit.author.username, todo)
							: null) ?? todo.list?.board?.user_id;

					if (authorUserId) {
						await serverRequest(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: todo.id,
								user_id: authorUserId,
								action_type: 'github_commit',
								new_value: `${commitAuthor}: ${commitFirstLine}`,
								changes: {
									source: 'github',
									commit_sha: commit.id,
									commit_short_sha: commitShortId,
									commit_url: commit.url,
									commit_author: commitAuthor,
									commit_message: commit.message,
									branch: branch,
									files_changed:
										commit.added.length + commit.modified.length + commit.removed.length
								}
							}
						});

						console.log(
							`Logged commit ${commitShortId} to todo ${todo.id} (issue #${issueNumber})`
						);
					}
				} else {
					console.log(
						`Issue #${issueNumber} not found in ${repository.full_name} - skipping commit ${commit.id.substring(0, 7)}`
					);
				}
			} catch (error) {
				console.error(`Error processing commit ${commit.id} for issue #${issueNumber}:`, error);
			}
		}
	}

	// Task-file rename loop: DONE file → move card to Review
	for (const commit of commits) {
		const renames = findTaskFileRenames(commit);
		for (const rename of renames) {
			await handleTaskFileDone(rename, commit, repository).catch((err: Error) =>
				console.error(`[016] ${rename.doneFile}: ${err.message}`)
			);
		}
	}
}

/**
 * POST handler for GitHub webhooks
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get raw body for signature verification
		const body = await request.text();
		const signature = request.headers.get('x-hub-signature-256');

		// Verify webhook signature
		if (!verifySignature(body, signature)) {
			console.error('Invalid webhook signature');
			throw error(401, 'Invalid signature');
		}

		// Parse event
		const event = JSON.parse(body);
		const eventType = request.headers.get('x-github-event');
		const deliveryId = request.headers.get('x-github-delivery');

		console.log(`Received GitHub webhook: ${eventType} (delivery: ${deliveryId})`);

		// Handle different event types
		switch (eventType) {
			case 'issues':
				await handleIssueEvent(event as GitHubIssueEvent);
				break;

			case 'issue_comment':
				await handleCommentEvent(event as GitHubCommentEvent);
				break;

			case 'push':
				await handlePushEvent(event as GitHubPushEvent);
				break;

			case 'ping':
				// GitHub sends this when webhook is first created
				console.log('Webhook ping received');
				break;

			default:
				console.log(`Unhandled event type: ${eventType}`);
		}

		return json({ success: true, event: eventType, deliveryId });
	} catch (err) {
		console.error('Webhook processing error:', err);

		// Don't expose internal errors to GitHub
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Internal server error');
	}
};
