import { test, expect } from '@playwright/test';
import crypto from 'crypto';

/**
 * E2E Tests for Phase 4: GitHub Webhooks & Real-Time Sync
 *
 * Tests the webhook endpoint and registration functionality
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must have GitHub OAuth token configured
 * - Board must have GitHub repo connected
 * - GITHUB_WEBHOOK_SECRET must be configured
 */

test.describe('GitHub Webhook Registration', () => {
	test.skip('should register webhook for GitHub repository', async ({ page, request }) => {
		// TODO: Setup authenticated session
		// TODO: Create board with GitHub repo

		await page.goto('/en/testuser/boards');

		// Open board management
		await page.click('[data-testid="board-menu"]');
		await page.click('[data-testid="github-settings"]');

		// Should see webhook status
		await expect(page.locator('text=Webhook Not Registered')).toBeVisible();

		// Click enable webhook
		await page.click('button:has-text("Enable Webhook")');

		// Wait for registration
		await page.waitForTimeout(2000);

		// Should now show webhook active
		await expect(page.locator('text=Webhook Active')).toBeVisible();
	});

	test.skip('should show webhook already registered message', async ({ page }) => {
		// TODO: Pre-register webhook

		await page.goto('/en/testuser/boards');

		// Open GitHub settings
		await page.click('[data-testid="board-menu"]');
		await page.click('[data-testid="github-settings"]');

		// Should show webhook active from the start
		await expect(page.locator('text=Webhook Active')).toBeVisible();
	});

	test.skip('should unregister webhook', async ({ page }) => {
		// TODO: Pre-register webhook

		await page.goto('/en/testuser/boards');
		await page.click('[data-testid="board-menu"]');
		await page.click('[data-testid="github-settings"]');

		// Click disable webhook
		await page.click('button:has-text("Disable Webhook")');

		// Confirm dialog
		page.on('dialog', async (dialog) => {
			expect(dialog.message()).toContain('disable real-time sync');
			await dialog.accept();
		});

		await page.waitForTimeout(2000);

		// Should show not registered
		await expect(page.locator('text=Webhook Not Registered')).toBeVisible();
	});

	test.skip('should require admin access to register webhook', async ({ request }) => {
		// TODO: Use token without admin access

		const response = await request.post('/api/github/register-webhook', {
			data: {
				owner: 'someowner',
				repo: 'privaterepo'
			}
		});

		expect(response.status()).toBe(403);
		const data = await response.json();
		expect(data.message).toContain('admin access');
	});
});

test.describe('GitHub Webhook Endpoint', () => {
	/**
	 * Helper to create webhook signature
	 */
	function createWebhookSignature(payload: string, secret: string): string {
		const hmac = crypto.createHmac('sha256', secret);
		return 'sha256=' + hmac.update(payload).digest('hex');
	}

	test.skip('should reject webhook with invalid signature', async ({ request }) => {
		const payload = JSON.stringify({
			action: 'opened',
			issue: { id: 123, number: 1, title: 'Test' }
		});

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': 'sha256=invalid',
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(401);
	});

	test.skip('should accept webhook with valid signature', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'ping',
			hook_id: 123456
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'ping',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.event).toBe('ping');
	});

	test.skip('should update todo when GitHub issue is edited', async ({ request, page }) => {
		// TODO: Create todo with GitHub issue link
		const todoId = 'test-todo-id';
		const githubIssueId = 123456;

		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'edited',
			issue: {
				id: githubIssueId,
				number: 42,
				title: 'Updated Issue Title',
				body: 'Updated issue body',
				state: 'open',
				html_url: 'https://github.com/owner/repo/issues/42',
				updated_at: new Date().toISOString()
			},
			repository: {
				full_name: 'owner/repo',
				owner: { login: 'owner' },
				name: 'repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);

		// TODO: Verify todo was updated in database
	});

	test.skip('should mark todo complete when GitHub issue is closed', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const closedAt = new Date().toISOString();
		const payload = JSON.stringify({
			action: 'closed',
			issue: {
				id: 123456,
				number: 42,
				title: 'Test Issue',
				body: 'Test body',
				state: 'closed',
				closed_at: closedAt,
				html_url: 'https://github.com/owner/repo/issues/42',
				updated_at: closedAt
			},
			repository: {
				full_name: 'owner/repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);

		// TODO: Verify todo has completed_at set
	});

	test.skip('should reopen todo when GitHub issue is reopened', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'reopened',
			issue: {
				id: 123456,
				number: 42,
				title: 'Test Issue',
				body: 'Test body',
				state: 'open',
				html_url: 'https://github.com/owner/repo/issues/42',
				updated_at: new Date().toISOString()
			},
			repository: {
				full_name: 'owner/repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);

		// TODO: Verify todo has completed_at cleared
	});

	test.skip('should handle issue deletion gracefully', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'deleted',
			issue: {
				id: 123456,
				number: 42,
				title: 'Deleted Issue',
				state: 'open'
			},
			repository: {
				full_name: 'owner/repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);

		// TODO: Verify todo is preserved (not deleted)
	});

	test.skip('should update comment when GitHub comment is edited', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'edited',
			comment: {
				id: 789,
				body: 'Updated comment text',
				html_url: 'https://github.com/owner/repo/issues/42#issuecomment-789',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user: { login: 'testuser' }
			},
			issue: {
				id: 123456,
				number: 42
			},
			repository: {
				full_name: 'owner/repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issue_comment',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);

		// TODO: Verify comment was updated
	});

	test.skip('should ignore webhook for unsynced issues', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = JSON.stringify({
			action: 'edited',
			issue: {
				id: 999999, // Non-existent issue
				number: 999,
				title: 'Unsynced Issue',
				state: 'open'
			},
			repository: {
				full_name: 'owner/repo'
			}
		});
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'x-github-delivery': 'test-delivery-id',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(200);
		// Should succeed but not do anything
	});

	test.skip('should handle malformed webhook payload', async ({ request }) => {
		const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
		const payload = 'invalid json{';
		const signature = createWebhookSignature(payload, secret);

		const response = await request.post('/api/github/webhook', {
			headers: {
				'x-hub-signature-256': signature,
				'x-github-event': 'issues',
				'content-type': 'application/json'
			},
			data: payload
		});

		expect(response.status()).toBe(500);
	});
});

test.describe('Webhook Registration API', () => {
	test.skip('should check webhook status for repository', async ({ request }) => {
		// TODO: Get auth token

		const response = await request.get(
			'/api/github/register-webhook?owner=testowner&repo=testrepo'
		);

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('registered');
	});

	test.skip('should return 401 if not authenticated', async ({ request }) => {
		const response = await request.post('/api/github/register-webhook', {
			data: {
				owner: 'testowner',
				repo: 'testrepo'
			}
		});

		expect(response.status()).toBe(401);
	});

	test.skip('should return 400 if missing required fields', async ({ request }) => {
		const response = await request.post('/api/github/register-webhook', {
			data: {
				owner: 'testowner'
				// Missing repo
			}
		});

		expect(response.status()).toBe(400);
	});
});
