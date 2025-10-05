/** @file src/routes/api/github/webhook/+server.ts */
import { json, error } from '@sveltejs/kit';
import crypto from 'crypto';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { serverRequest } from '$lib/graphql/server-client';
import {
	UPDATE_TODOS,
	CREATE_COMMENT,
	UPDATE_COMMENT
	// TODO: Uncomment when database migrations are applied
	// GET_TODO_BY_GITHUB_ISSUE,
	// GET_COMMENT_BY_GITHUB_ID
} from '$lib/graphql/documents';

/**
 * GitHub Webhook Endpoint
 *
 * Receives real-time events from GitHub when issues or comments change.
 * Implements signature verification for security.
 *
 * Supported events:
 * - issues: edited, closed, reopened, deleted
 * - issue_comment: created, edited, deleted
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
				// Create new comment
				// Note: We don't have the user_id from GitHub, so we'll need to handle this
				// For now, we'll skip creating comments from webhooks until we implement user mapping
				console.log(`Comment creation from webhook not yet implemented (GitHub comment ${comment.id})`);
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
			}
			break;

		case 'deleted':
			// Find and optionally delete comment
			const deleteData = await serverRequest<
				{ comments: Array<any> },
				{ githubCommentId: number }
			>(GET_COMMENT_BY_GITHUB_ID, { githubCommentId: comment.id });

			if (deleteData?.comments?.length > 0) {
				// For now, we'll preserve the comment but log it
				console.log(`GitHub comment ${comment.id} was deleted, preserving local comment`);
			}
			break;

		default:
			console.log(`Unhandled comment action: ${action}`);
	}
}

/**
 * POST handler for GitHub webhooks
 */
export const POST: RequestHandler = async ({ request }) => {
	// TODO: Remove this when database migrations are applied
	throw error(503, 'GitHub webhook endpoint temporarily disabled - database migrations required');

	/* eslint-disable @typescript-eslint/no-unreachable */
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
