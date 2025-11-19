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
	CREATE_ACTIVITY_LOG
} from '$lib/graphql/documents';

/**
 * GitHub Webhook Endpoint
 *
 * Receives real-time events from GitHub when issues, comments, or commits change.
 * Implements signature verification for security.
 *
 * Supported events:
 * - issues: edited, closed, reopened, deleted
 * - issue_comment: created, edited, deleted
 * - push: commits pushed to main/master branches (logs commits that reference issues)
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
	repository: {
		full_name: string;
		owner: {
			login: string;
		};
		name: string;
	};
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
	const { action, issue } = event;

	// Find the todo associated with this GitHub issue
	const data = await serverRequest<
		{ todos: Array<any> },
		{ githubIssueId: number }
	>(GET_TODO_BY_GITHUB_ISSUE, { githubIssueId: issue.id });

	const todo = data?.todos?.[0];

	if (!todo) {
		// Issue not synced to our app, ignore
		console.log(`Issue #${issue.number} not found in database, skipping`);
		return;
	}

	console.log(`Processing GitHub issue event: ${action} for todo ${todo.id}`);

	switch (action) {
		case 'edited':
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
			}
			break;

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
			}
			break;

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
		const userData = await serverRequest<
			{ users: Array<any> },
			{ githubUsername: string }
		>(GET_USER_BY_GITHUB_USERNAME, { githubUsername });

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
 * Handle comment events from GitHub
 */
async function handleCommentEvent(event: GitHubCommentEvent): Promise<void> {
	const { action, comment, issue } = event;

	// First, find the todo this comment belongs to
	const todoData = await serverRequest<
		{ todos: Array<any> },
		{ githubIssueId: number }
	>(GET_TODO_BY_GITHUB_ISSUE, { githubIssueId: issue.id });

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
					const userData = await serverRequest<
						{ users: Array<any> },
						{ githubUsername: string }
					>(GET_USER_BY_GITHUB_USERNAME, { githubUsername: comment.user.login });

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

					if (result?.insert_comments?.returning?.[0]) {
						console.log(
							`Created comment ${result.insert_comments.returning[0].id} from GitHub comment ${comment.id} (${isActualUser ? 'mapped user' : 'fallback to board owner'})`
						);

						// Log activity
						try {
							await serverRequest(CREATE_ACTIVITY_LOG, {
								log: {
									todo_id: todo.id,
									action_type: 'commented',
									new_value:
										comment.body.substring(0, 200) +
										(comment.body.length > 200 ? '...' : ''),
									metadata: {
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
				await serverRequest(UPDATE_COMMENT, {
					where: { id: { _eq: existingComment.id } },
					_set: {
						content: comment.body,
						github_synced_at: new Date().toISOString()
					}
				});
				console.log(`Updated comment ${existingComment.id} from GitHub edit`);

				// Log activity
				try {
					await serverRequest(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todo.id,
							action_type: 'comment_edited',
							old_value:
								existingComment.content.substring(0, 200) +
								(existingComment.content.length > 200 ? '...' : ''),
							new_value: comment.body.substring(0, 200) + (comment.body.length > 200 ? '...' : ''),
							metadata: { source: 'github', github_comment_id: comment.id }
						}
					});
				} catch (error) {
					console.error('Failed to log activity for GitHub comment edit:', error);
				}
			}
			break;

		case 'deleted':
			// Find and delete comment
			const deleteData = await serverRequest<
				{ comments: Array<any> },
				{ githubCommentId: number }
			>(GET_COMMENT_BY_GITHUB_ID, { githubCommentId: comment.id });

			const commentToDelete = deleteData?.comments?.[0];

			if (commentToDelete) {
				// Log activity BEFORE deletion
				try {
					await serverRequest(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todo.id,
							action_type: 'comment_deleted',
							metadata: { source: 'github', github_comment_id: comment.id }
						}
					});
				} catch (error) {
					console.error('Failed to log activity for GitHub comment deletion:', error);
				}

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

		console.log(`Commit ${commit.id.substring(0, 7)} references issues: ${issueNumbers.join(', ')}`);

		// For each issue number, find the corresponding todo and log activity
		for (const issueNumber of issueNumbers) {
			try {
				// Find todos for this repository with this issue number
				const todoData = await serverRequest<
					{ todos: Array<any> },
					{ issueNumber: number; repoFullName: string }
				>(
					`
						query GetTodoByIssueNumber($issueNumber: bigint!, $repoFullName: String!) {
							todos(
								where: {
									github_issue_number: { _eq: $issueNumber }
									list: {
										board: {
											github: { _contains: { owner: "${repository.owner.login}", repo: "${repository.name}" } }
										}
									}
								}
								limit: 1
							) {
								id
								title
								github_issue_number
								list {
									board {
										id
										github
									}
								}
							}
						}
					`,
					{ issueNumber, repoFullName: repository.full_name }
				);

				const todo = todoData?.todos?.[0];

				if (todo) {
					// Log commit activity
					const commitShortId = commit.id.substring(0, 7);
					const commitFirstLine = commit.message.split('\n')[0];
					const commitAuthor = commit.author.username || commit.author.name;

					await serverRequest(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todo.id,
							action_type: 'github_commit',
							new_value: `${commitAuthor}: ${commitFirstLine}`,
							metadata: {
								source: 'github',
								commit_sha: commit.id,
								commit_short_sha: commitShortId,
								commit_url: commit.url,
								commit_author: commitAuthor,
								commit_message: commit.message,
								branch: branch,
								files_changed: commit.added.length + commit.modified.length + commit.removed.length
							}
						}
					});

					console.log(`Logged commit ${commitShortId} to todo ${todo.id} (issue #${issueNumber})`);
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
