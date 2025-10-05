/** @file e2e/github-webhooks.spec.ts */
import { test, expect } from './fixtures/github-fixtures';
import crypto from 'crypto';

/**
 * E2E Tests for GitHub Webhooks (Phase 4)
 *
 * Tests the critical real-time webhook processing
 */

// Helper to create webhook signature
function createWebhookSignature(payload: string, secret: string): string {
	const hmac = crypto.createHmac('sha256', secret);
	return 'sha256=' + hmac.update(payload).digest('hex');
}

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test-webhook-secret';

test.describe('GitHub Webhooks - Signature Verification', () => {
	test('should accept webhook with valid signature', async ({ page }) => {
		const payload = JSON.stringify({ action: 'ping' });
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'ping',
				'x-github-delivery': 'test-delivery-123',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('success', true);
		expect(data.event).toBe('ping');
	});

	test('should reject webhook with invalid signature', async ({ page }) => {
		const payload = JSON.stringify({ action: 'opened' });

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': 'sha256=invalid',
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(401);
	});

	test('should reject webhook without signature', async ({ page }) => {
		const payload = JSON.stringify({ action: 'opened' });

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(401);
	});
});

test.describe('GitHub Webhooks - Issue Events', () => {
	test('should process issue edited event', async ({ page }) => {
		const payload = JSON.stringify({
			action: 'edited',
			issue: {
				id: 123456,
				number: 42,
				title: 'Updated Issue Title',
				body: 'Updated issue body',
				state: 'open',
				html_url: 'https://github.com/test/repo/issues/42',
				updated_at: new Date().toISOString()
			},
			repository: {
				full_name: 'testuser/test-repo',
				owner: { login: 'testuser' },
				name: 'test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'delivery-edited',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify todo was updated in DB
	});

	test('should process issue closed event', async ({ page }) => {
		const closedAt = new Date().toISOString();
		const payload = JSON.stringify({
			action: 'closed',
			issue: {
				id: 123456,
				number: 42,
				title: 'Closed Issue',
				body: 'This issue is closed',
				state: 'closed',
				closed_at: closedAt,
				html_url: 'https://github.com/test/repo/issues/42',
				updated_at: closedAt
			},
			repository: {
				full_name: 'testuser/test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'delivery-closed',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify todo.completed_at was set
	});

	test('should process issue reopened event', async ({ page }) => {
		const payload = JSON.stringify({
			action: 'reopened',
			issue: {
				id: 123456,
				number: 42,
				title: 'Reopened Issue',
				body: 'This issue was reopened',
				state: 'open',
				html_url: 'https://github.com/test/repo/issues/42',
				updated_at: new Date().toISOString()
			},
			repository: {
				full_name: 'testuser/test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'delivery-reopened',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify todo.completed_at was cleared
	});

	test('should ignore webhook for unsynced issue', async ({ page }) => {
		const payload = JSON.stringify({
			action: 'edited',
			issue: {
				id: 999999, // Non-existent in our DB
				number: 999,
				title: 'Unsynced Issue',
				state: 'open'
			},
			repository: {
				full_name: 'testuser/test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		// Should succeed but not update anything
		expect(response.ok()).toBeTruthy();
	});
});

test.describe('GitHub Webhooks - Comment Events', () => {
	test('should process comment edited event', async ({ page }) => {
		const payload = JSON.stringify({
			action: 'edited',
			comment: {
				id: 789,
				body: 'Updated comment text',
				html_url: 'https://github.com/test/repo/issues/42#issuecomment-789',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user: { login: 'testuser' }
			},
			issue: {
				id: 123456,
				number: 42
			},
			repository: {
				full_name: 'testuser/test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issue_comment',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should handle comment created event', async ({ page }) => {
		const payload = JSON.stringify({
			action: 'created',
			comment: {
				id: 790,
				body: 'New comment from GitHub',
				html_url: 'https://github.com/test/repo/issues/42#issuecomment-790',
				created_at: new Date().toISOString(),
				user: { login: 'testuser' }
			},
			issue: {
				id: 123456,
				number: 42
			},
			repository: {
				full_name: 'testuser/test-repo'
			}
		});
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issue_comment',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.ok()).toBeTruthy();
		// Note: Comment creation requires user mapping (not yet implemented)
	});
});

test.describe('GitHub Webhooks - Error Handling', () => {
	test('should handle malformed JSON payload', async ({ page }) => {
		const payload = 'invalid json{';
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(500);
	});

	test('should handle unknown event type', async ({ page }) => {
		const payload = JSON.stringify({ action: 'unknown' });
		const signature = createWebhookSignature(payload, WEBHOOK_SECRET);

		const response = await page.request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'unknown_event_type',
				'content-type': 'application/json'
			},
			data: payload
		});

		// Should handle gracefully
		expect(response.ok()).toBeTruthy();
	});
});

test.describe('GitHub Webhook Registration', () => {
	test('should register webhook via API', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/register-webhook', {
			data: {
				owner: 'testuser',
				repo: 'test-repo'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('success', true);
		expect(data).toHaveProperty('webhookId');
	});

	test('should check webhook status', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.get(
			'/api/github/register-webhook?owner=testuser&repo=test-repo'
		);

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('registered');
	});

	test('should return 401 if not authenticated for registration', async ({ page }) => {
		const response = await page.request.post('/api/github/register-webhook', {
			data: {
				owner: 'testuser',
				repo: 'test-repo'
			}
		});

		expect(response.status()).toBe(401);
	});

	test('should return 400 if missing required fields', async ({ page }) => {
		const response = await page.request.post('/api/github/register-webhook', {
			data: {
				owner: 'testuser'
				// Missing repo
			}
		});

		expect(response.status()).toBe(400);
	});
});
