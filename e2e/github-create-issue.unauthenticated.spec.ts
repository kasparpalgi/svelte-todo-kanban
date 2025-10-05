/** @file e2e/github-create-issue.spec.ts */
import { test, expect } from './fixtures/github-fixtures';

/**
 * E2E Tests for GitHub Issue Creation (Phase 2)
 *
 * Tests the critical path of creating GitHub issues from todos
 */

test.describe('GitHub Issue Creation - Critical Path', () => {
	test('should create GitHub issue via API endpoint', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo-123',
				title: 'New GitHub Issue',
				body: 'This is a test issue created from a todo',
				priority: 'high'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('success', true);
		expect(data).toHaveProperty('issueNumber');
		expect(data).toHaveProperty('issueId');
		expect(data).toHaveProperty('issueUrl');
		expect(data.issueUrl).toContain('github.com');
	});

	test('should map priority to GitHub labels', async ({ page }) => {
		let capturedLabels: string[] = [];

		await page.route('https://api.github.com/**/issues', async (route) => {
			if (route.request().method() === 'POST') {
				const body = route.request().postDataJSON();
				capturedLabels = body.labels || [];

				await route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify({
						id: 999,
						number: 42,
						title: body.title,
						body: body.body,
						labels: body.labels,
						html_url: 'https://github.com/test/repo/issues/42'
					})
				});
			} else {
				await route.continue();
			}
		});

		// Test high priority
		await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'High Priority Issue',
				body: 'Description',
				priority: 'high'
			}
		});

		expect(capturedLabels).toContain('priority: high');
	});

	test('should handle issue creation without priority', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'No Priority Issue',
				body: 'Description'
				// No priority field
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should handle issue creation without body', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Issue without body'
				// No body field
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should update todo with GitHub metadata after creation', async ({ page }) => {
		await page.route('https://api.github.com/**/issues', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify({
						id: 123456,
						number: 99,
						title: 'Test Issue',
						html_url: 'https://github.com/owner/repo/issues/99',
						created_at: new Date().toISOString()
					})
				});
			} else {
				await route.continue();
			}
		});

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test Issue'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.issueNumber).toBe(99);
		expect(data.issueId).toBe(123456);
		expect(data.issueUrl).toBe('https://github.com/owner/repo/issues/99');
	});
});

test.describe('GitHub Issue Creation - Error Handling', () => {
	test('should return 401 if user not authenticated', async ({ page }) => {
		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Should Fail'
			}
		});

		expect(response.status()).toBe(401);
	});

	test('should return 400 if required fields missing', async ({ page }) => {
		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo'
				// Missing title
			}
		});

		expect(response.status()).toBe(400);
	});

	test('should handle GitHub API errors (422)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues', async (route) => {
			await route.fulfill({
				status: 422,
				contentType: 'application/json',
				body: JSON.stringify({
					message: 'Validation Failed',
					errors: [{ field: 'title', code: 'missing_field' }]
				})
			});
		});

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: ''
			}
		});

		expect(response.status()).toBe(422);
	});

	test('should handle repository not found (404)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues', async (route) => {
			await route.fulfill({
				status: 404,
				body: JSON.stringify({ message: 'Not Found' })
			});
		});

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test Issue'
			}
		});

		expect(response.status()).toBe(404);
	});

	test('should handle permission denied (403)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues', async (route) => {
			await route.fulfill({
				status: 403,
				body: JSON.stringify({ message: 'Forbidden' })
			});
		});

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test Issue'
			}
		});

		expect(response.status()).toBe(403);
	});

	test('should handle network errors', async ({ page }) => {
		await page.route('https://api.github.com/**', async (route) => {
			await route.abort('failed');
		});

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test Issue'
			}
		});

		expect(response.ok()).toBeFalsy();
	});
});

test.describe('GitHub Issue Creation - Data Validation', () => {
	test('should handle special characters in title', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test 📝 Issue with émojis & spëcial chârs'
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should handle markdown in body', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/create-issue', {
			data: {
				todoId: 'test-todo',
				title: 'Test Issue',
				body: '## Heading\n\n- List item 1\n- List item 2\n\n**Bold** and *italic*'
			}
		});

		expect(response.ok()).toBeTruthy();
	});
});
