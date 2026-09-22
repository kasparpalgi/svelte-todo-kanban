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

const WEBHOOK_PATH = '/api/github/webhook';

/**
 * GitHub does not follow redirects on a delivery: it records the 3xx as the response and
 * moves on, so a hook pointing at a domain that redirects never reaches the handler and
 * fails silently. `PUBLIC_APP_URL` was the apex `todzz.eu`, which 307s to `www` — every
 * delivery died there. Derive the callback from the real request origin instead, the same
 * fix the OAuth redirect_uri needed in #195.
 */
const webhookUrlFor = (origin: string) => `${origin}${WEBHOOK_PATH}`;

/** Match on the path, not the full URL — a hook registered from another domain is still ours. */
const isOurWebhook = (hook: GitHubWebhookResponse) =>
	Boolean(hook.config?.url?.endsWith(WEBHOOK_PATH));

/**
 * POST - Register webhook for a repository
 */
export const POST: RequestHandler = async ({ request: req, url, locals }) => {
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
		throw error(
			500,
			'Webhook feature not configured on this server. Add GITHUB_WEBHOOK_SECRET to your .env file (generate with: openssl rand -hex 32).'
		);
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

		const webhookUrl = webhookUrlFor(url.origin);
		const existingWebhook = existingWebhooks.find(isOurWebhook);

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
		await githubRequest(`/repos/${owner}/${repo}/hooks/${webhookId}`, githubToken, {
			method: 'DELETE'
		});

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

		const ourWebhook = webhooks.find(isOurWebhook);

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
