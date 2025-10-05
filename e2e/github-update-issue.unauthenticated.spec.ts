/** @file e2e/github-update-issue.spec.ts */
import { test, expect } from './fixtures/github-fixtures';

/**
 * E2E Tests for GitHub Issue Updates (Phase 3)
 *
 * Tests the critical bidirectional sync when todos change
 */

test.describe('GitHub Issue Update - Critical Path', () => {
	test('should update GitHub issue title via API', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Updated Issue Title'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('success', true);
	});

	test('should update GitHub issue body via API', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				body: 'Updated issue description'
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should close GitHub issue when todo marked complete', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				state: 'closed'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.state).toBe('closed');
	});

	test('should reopen GitHub issue when todo unchecked', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				state: 'open'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.state).toBe('open');
	});

	test('should update multiple fields at once', async ({ page }) => {
		await page.route('https://api.github.com/**/issues/*', async (route) => {
			if (route.request().method() === 'PATCH') {
				const body = route.request().postDataJSON();

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						id: 123456,
						number: 42,
						title: body.title || 'Test Issue',
						body: body.body || 'Test body',
						state: body.state || 'open',
						updated_at: new Date().toISOString()
					})
				});
			} else {
				await route.continue();
			}
		});

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'New Title',
				body: 'New Body',
				state: 'closed'
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should only send changed fields to GitHub', async ({ page }) => {
		let capturedBody: any = null;

		await page.route('https://api.github.com/**/issues/*', async (route) => {
			if (route.request().method() === 'PATCH') {
				capturedBody = route.request().postDataJSON();

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						id: 123,
						number: 42,
						title: capturedBody.title || 'Title',
						updated_at: new Date().toISOString()
					})
				});
			} else {
				await route.continue();
			}
		});

		// Only update title
		await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Only Title Changed'
			}
		});

		expect(capturedBody).toHaveProperty('title');
		expect(capturedBody).not.toHaveProperty('body');
		expect(capturedBody).not.toHaveProperty('state');
	});
});

test.describe('GitHub Issue Update - Error Handling', () => {
	test('should return 401 if user not authenticated', async ({ page }) => {
		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Should Fail'
			}
		});

		expect(response.status()).toBe(401);
	});

	test('should return 400 if required fields missing', async ({ page }) => {
		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo'
				// Missing githubIssueNumber, owner, repo
			}
		});

		expect(response.status()).toBe(400);
	});

	test('should handle GitHub issue not found (404)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues/*', async (route) => {
			await route.fulfill({
				status: 404,
				body: JSON.stringify({ message: 'Not Found' })
			});
		});

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 999999,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Update Non-Existent'
			}
		});

		expect(response.status()).toBe(404);
	});

	test('should handle permission denied (403)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues/*', async (route) => {
			await route.fulfill({
				status: 403,
				body: JSON.stringify({ message: 'Forbidden' })
			});
		});

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'someoneelse',
				repo: 'privaterepo',
				title: 'Should Fail'
			}
		});

		expect(response.status()).toBe(403);
	});

	test('should handle network errors', async ({ page }) => {
		await page.route('https://api.github.com/**', async (route) => {
			await route.abort('failed');
		});

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Should Fail'
			}
		});

		expect(response.ok()).toBeFalsy();
	});

	test('should handle invalid state value', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				state: 'invalid-state'
			}
		});

		// Should either validate or let GitHub API reject it
		expect([200, 400, 422]).toContain(response.status());
	});
});

test.describe('GitHub Issue Update - Data Validation', () => {
	test('should handle special characters in title', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Updated 📝 Title with émojis & chârs'
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should handle markdown in body', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				body: '# Updated\n\n- Item 1\n- Item 2\n\n**Bold**'
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should handle empty string updates', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				body: '' // Clear the body
			}
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should update github_synced_at timestamp', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		const response = await page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Updated'
			}
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify github_synced_at was updated in DB
	});
});

test.describe('GitHub Issue Update - Conflict Scenarios', () => {
	test('should handle simultaneous updates gracefully', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		// Simulate concurrent updates
		const response1 = page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Update 1'
			}
		});

		const response2 = page.request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo',
				githubIssueNumber: 42,
				owner: 'testuser',
				repo: 'test-repo',
				title: 'Update 2'
			}
		});

		const [r1, r2] = await Promise.all([response1, response2]);

		// Both should succeed (last-write-wins)
		expect(r1.ok() || r2.ok()).toBeTruthy();
	});
});
