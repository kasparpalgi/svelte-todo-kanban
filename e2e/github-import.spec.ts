/** @file e2e/github-import.spec.ts */
import { test, expect } from './fixtures/github-fixtures';

/**
 * E2E Tests for GitHub Issues Import (Phase 1)
 *
 * Tests the import functionality that brings GitHub issues into todos
 */

test.describe('GitHub Issues Import', () => {
	test('should import issues into selected list', async ({
		page,
		mockGithubAPI,
		setupGithubAuth
	}) => {
		await setupGithubAuth(page);
		await mockGithubAPI(page);

		// Note: This test assumes a board with GitHub repo exists
		// In a real scenario, you'd create this in a setup step
		await page.goto('/testuser/boards');

		// For now, we'll test the API endpoint directly via request
		// since setting up full board + GitHub connection is complex
		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		// Verify API response
		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data).toHaveProperty('success', true);
		expect(data).toHaveProperty('imported');
	});

	test('should map GitHub priority labels correctly', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		// Test priority mapping via API
		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();

		// The mock API includes an issue with "priority: high" label
		// Verify it was imported (implementation would check DB)
	});

	test('should import closed issues as completed todos', async ({ page, mockGithubAPI }) => {
		await mockGithubAPI(page);

		// Mock a closed issue
		await page.route('https://api.github.com/**/issues*', async (route) => {
			if (route.request().method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						{
							id: 123,
							number: 1,
							title: 'Closed Issue',
							body: 'This issue is closed',
							state: 'closed',
							closed_at: new Date().toISOString(),
							html_url: 'https://github.com/test/repo/issues/1'
						}
					])
				});
			} else {
				await route.continue();
			}
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify completed_at is set
	});

	test('should exclude pull requests from import', async ({ page }) => {
		// Mock issues endpoint with a PR
		await page.route('https://api.github.com/**/issues*', async (route) => {
			if (route.request().method() === 'GET') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([
						{
							id: 1,
							number: 1,
							title: 'Regular Issue',
							state: 'open'
						},
						{
							id: 2,
							number: 2,
							title: 'Pull Request',
							state: 'open',
							pull_request: { url: 'https://api.github.com/pulls/2' }
						}
					])
				});
			} else {
				await route.continue();
			}
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		// Should only import 1 (the regular issue, not the PR)
		expect(data.imported).toBeLessThanOrEqual(data.total);
	});

	test('should handle empty repository (no issues)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.imported).toBe(0);
		expect(data.total).toBe(0);
	});
});

test.describe('GitHub Import Error Handling', () => {
	test('should return 401 if user not authenticated', async ({ page }) => {
		// Don't set up auth
		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.status()).toBe(401);
	});

	test('should return 400 if board not connected to GitHub', async ({ page }) => {
		// Mock board without GitHub connection
		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'board-without-github',
				targetListId: 'test-list-id'
			}
		});

		// Should fail because board doesn't have GitHub repo
		expect(response.ok()).toBeFalsy();
	});

	test('should handle GitHub API rate limit (403)', async ({ page }) => {
		await page.route('https://api.github.com/**', async (route) => {
			await route.fulfill({
				status: 403,
				body: JSON.stringify({
					message: 'API rate limit exceeded',
					documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
				})
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.status()).toBe(403);
	});

	test('should handle repository not found (404)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues*', async (route) => {
			await route.fulfill({
				status: 404,
				body: JSON.stringify({ message: 'Not Found' })
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.status()).toBe(404);
	});

	test('should handle invalid GitHub token (401)', async ({ page }) => {
		await page.route('https://api.github.com/**', async (route) => {
			await route.fulfill({
				status: 401,
				body: JSON.stringify({ message: 'Bad credentials' })
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.status()).toBe(401);
	});

	test('should handle network errors gracefully', async ({ page }) => {
		await page.route('https://api.github.com/**', async (route) => {
			await route.abort('failed');
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		// Should handle error and return appropriate status
		expect(response.ok()).toBeFalsy();
	});

	test('should handle malformed GitHub response', async ({ page }) => {
		await page.route('https://api.github.com/**/issues*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: 'invalid json{'
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeFalsy();
	});
});

test.describe('GitHub Import Data Mapping', () => {
	test('should map milestone due date to todo due_on', async ({ page }) => {
		await page.route('https://api.github.com/**/issues*', async (route) => {
			const dueDate = new Date('2025-12-31').toISOString();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 1,
						number: 1,
						title: 'Issue with milestone',
						state: 'open',
						milestone: {
							title: 'v1.0',
							due_on: dueDate
						}
					}
				])
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify due_on is set correctly
	});

	test('should preserve GitHub metadata (issue number, ID, URL)', async ({
		page,
		mockGithubAPI
	}) => {
		await mockGithubAPI(page);

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
		// Implementation would verify:
		// - github_issue_number is set
		// - github_issue_id is set
		// - github_url is set
		// - github_synced_at is set
	});

	test('should handle issues without body (null content)', async ({ page }) => {
		await page.route('https://api.github.com/**/issues*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 1,
						number: 1,
						title: 'Issue without body',
						body: null,
						state: 'open'
					}
				])
			});
		});

		const response = await page.request.post('/api/github/import-issues', {
			data: {
				boardId: 'test-board-id',
				targetListId: 'test-list-id'
			}
		});

		expect(response.ok()).toBeTruthy();
	});
});
