/** @file src/routes/api/github/register-webhook/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getGithubToken, githubRequest } from '$lib/server/github';

/**
 * Webhook Registration Endpoint
 *
 * Registers a GitHub webhook for a repository to receive real-time updates
 * about issues, comments, and commits.
 *
 * Requirements:
 * - User must have admin access to the repository
 * - GITHUB_WEBHOOK_SECRET must be configured
 * - PUBLIC_APP_URL must be set for webhook callback URL
 */

interface WebhookConfig {
	name: 'web';
	active: boolean;
	events: string[];
	config: {
		url: string;
		content_type: 'json';
		secret: string;
		insecure_ssl: '0';
	};
}

interface GitHubWebhookResponse {
	id: number;
	url: string;
	test_url: string;
	ping_url: string;
	deliveries_url: string;
	active: boolean;
	events: string[];
	config: {
		url: string;
		content_type: string;
		insecure_ssl: string;
	};
	created_at: string;
	updated_at: string;
}

/**
 * POST - Register webhook for a repository
 */
export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const { owner, repo } = await req.json();

	if (!owner || !repo) {
		throw error(400, 'Missing required fields: owner, repo');
	}

	// Validate environment configuration
	if (!env.GITHUB_WEBHOOK_SECRET) {
		throw error(500, 'GITHUB_WEBHOOK_SECRET not configured');
	}

	if (!env.PUBLIC_APP_URL) {
		throw error(500, 'PUBLIC_APP_URL not configured');
	}

	// Get user's GitHub token
	const githubToken = await getGithubToken(session.user.id);
	if (!githubToken) {
		throw error(401, 'GitHub not connected');
	}

	try {
		// Check if webhook already exists
		const existingWebhooks = await githubRequest<GitHubWebhookResponse[]>(
			`/repos/${owner}/${repo}/hooks`,
			githubToken,
			{ method: 'GET' }
		);

		const webhookUrl = `${env.PUBLIC_APP_URL}/api/github/webhook`;
		const existingWebhook = existingWebhooks.find(
			(hook) => hook.config?.url === webhookUrl
		);

		if (existingWebhook) {
			return json({
				success: true,
				message: 'Webhook already registered',
				webhookId: existingWebhook.id,
				webhookUrl: existingWebhook.url,
				alreadyExists: true
			});
		}

		// Create new webhook
		const webhookConfig: WebhookConfig = {
			name: 'web',
			active: true,
			events: ['issues', 'issue_comment', 'push'],
			config: {
				url: webhookUrl,
				content_type: 'json',
				secret: env.GITHUB_WEBHOOK_SECRET,
				insecure_ssl: '0'
			}
		};

		const webhook = await githubRequest<GitHubWebhookResponse>(
			`/repos/${owner}/${repo}/hooks`,
			githubToken,
			{
				method: 'POST',
				body: JSON.stringify(webhookConfig)
			}
		);

		return json({
			success: true,
			message: 'Webhook registered successfully',
			webhookId: webhook.id,
			webhookUrl: webhook.url,
			events: webhook.events,
			alreadyExists: false
		});
	} catch (err: any) {
		console.error('Failed to register webhook:', err);

		// Handle specific GitHub API errors
		if (err.status === 403) {
			throw error(
				403,
				'Permission denied. You need admin access to this repository to register webhooks.'
			);
		}

		if (err.status === 404) {
			throw error(404, 'Repository not found');
		}

		throw error(500, err.message || 'Failed to register webhook');
	}
};

/**
 * DELETE - Unregister webhook for a repository
 */
export const DELETE: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const { owner, repo, webhookId } = await req.json();

	if (!owner || !repo || !webhookId) {
		throw error(400, 'Missing required fields: owner, repo, webhookId');
	}

	// Get user's GitHub token
	const githubToken = await getGithubToken(session.user.id);
	if (!githubToken) {
		throw error(401, 'GitHub not connected');
	}

	try {
		await githubRequest(
			`/repos/${owner}/${repo}/hooks/${webhookId}`,
			githubToken,
			{ method: 'DELETE' }
		);

		return json({
			success: true,
			message: 'Webhook unregistered successfully'
		});
	} catch (err: any) {
		console.error('Failed to unregister webhook:', err);

		if (err.status === 404) {
			throw error(404, 'Webhook not found');
		}

		throw error(500, err.message || 'Failed to unregister webhook');
	}
};

/**
 * GET - Check webhook status for a repository
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const owner = url.searchParams.get('owner');
	const repo = url.searchParams.get('repo');

	if (!owner || !repo) {
		throw error(400, 'Missing required parameters: owner, repo');
	}

	// Get user's GitHub token
	const githubToken = await getGithubToken(session.user.id);
	if (!githubToken) {
		throw error(401, 'GitHub not connected');
	}

	try {
		const webhooks = await githubRequest<GitHubWebhookResponse[]>(
			`/repos/${owner}/${repo}/hooks`,
			githubToken,
			{ method: 'GET' }
		);

		const webhookUrl = `${env.PUBLIC_APP_URL}/api/github/webhook`;
		const ourWebhook = webhooks.find(
			(hook) => hook.config?.url === webhookUrl
		);

		if (ourWebhook) {
			return json({
				registered: true,
				webhookId: ourWebhook.id,
				active: ourWebhook.active,
				events: ourWebhook.events,
				createdAt: ourWebhook.created_at,
				updatedAt: ourWebhook.updated_at
			});
		}

		return json({
			registered: false
		});
	} catch (err: any) {
		console.error('Failed to check webhook status:', err);

		if (err.status === 404) {
			throw error(404, 'Repository not found');
		}

		throw error(500, err.message || 'Failed to check webhook status');
	}
};
