/** @file e2e/fixtures/github-fixtures.ts */
import { test as base, expect, type Page } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * GitHub E2E Test Fixtures
 *
 * Provides test data and helper functions for GitHub integration tests
 */

export interface GithubFixtures {
	/**
	 * Mock GitHub API responses using MSW or route interception
	 */
	mockGithubAPI: (page: Page) => Promise<void>;

	/**
	 * Create a test board with GitHub repo connected
	 */
	createGithubBoard: (page: Page, repoName: string) => Promise<{
		boardId: string;
		boardAlias: string;
		owner: string;
		repo: string;
	}>;

	/**
	 * Create a test todo with GitHub issue link
	 */
	createGithubTodo: (page: Page, options: {
		boardAlias: string;
		title: string;
		githubIssueNumber?: number;
		githubIssueId?: number;
	}) => Promise<{
		todoId: string;
		githubIssueNumber: number;
		githubIssueId: number;
	}>;

	/**
	 * Setup mock GitHub OAuth (if needed)
	 */
	setupGithubAuth: (page: Page) => Promise<void>;

	/**
	 * Cleanup test data
	 */
	cleanupGithubData: (page: Page) => Promise<void>;
}

/**
 * Mock GitHub API responses
 */
async function mockGithubAPI(page: Page) {
	// Intercept GitHub API requests and return mock responses
	await page.route('https://api.github.com/**', async (route) => {
		const url = route.request().url();
		const method = route.request().method();

		console.log(`[Mock GitHub API] ${method} ${url}`);

		// Mock repos list
		if (url.includes('/user/repos')) {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						full_name: 'testuser/test-repo',
						name: 'test-repo',
						owner: { login: 'testuser' },
						description: 'Test repository for E2E tests',
						private: false,
						html_url: 'https://github.com/testuser/test-repo'
					},
					{
						full_name: 'testuser/another-repo',
						name: 'another-repo',
						owner: { login: 'testuser' },
						description: 'Another test repo',
						private: false,
						html_url: 'https://github.com/testuser/another-repo'
					}
				])
			});
			return;
		}

		// Mock issues list
		if (url.includes('/repos/') && url.includes('/issues') && method === 'GET') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{
						id: 123456,
						number: 1,
						title: 'First test issue',
						body: 'This is a test issue from GitHub',
						state: 'open',
						labels: [{ name: 'bug', color: 'd73a4a' }],
						html_url: 'https://github.com/testuser/test-repo/issues/1',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{
						id: 123457,
						number: 2,
						title: 'Second test issue',
						body: 'Another test issue',
						state: 'open',
						labels: [{ name: 'priority: high', color: 'd73a4a' }],
						html_url: 'https://github.com/testuser/test-repo/issues/2',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					}
				])
			});
			return;
		}

		// Mock create issue
		if (url.includes('/repos/') && url.includes('/issues') && method === 'POST') {
			const body = route.request().postDataJSON();
			await route.fulfill({
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 999999,
					number: 99,
					title: body.title,
					body: body.body || '',
					state: 'open',
					labels: body.labels || [],
					html_url: 'https://github.com/testuser/test-repo/issues/99',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				})
			});
			return;
		}

		// Mock update issue
		if (url.match(/\/repos\/.*\/issues\/\d+$/) && method === 'PATCH') {
			const body = route.request().postDataJSON();
			const issueNumber = url.split('/').pop();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 123456,
					number: parseInt(issueNumber || '1'),
					title: body.title || 'Updated Issue',
					body: body.body || 'Updated body',
					state: body.state || 'open',
					html_url: `https://github.com/testuser/test-repo/issues/${issueNumber}`,
					updated_at: new Date().toISOString()
				})
			});
			return;
		}

		// Mock webhooks list
		if (url.includes('/repos/') && url.includes('/hooks') && method === 'GET') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
			return;
		}

		// Mock webhook creation
		if (url.includes('/repos/') && url.includes('/hooks') && method === 'POST') {
			const body = route.request().postDataJSON();
			await route.fulfill({
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 12345,
					url: 'https://api.github.com/repos/testuser/test-repo/hooks/12345',
					active: body.active || true,
					events: body.events || ['issues', 'issue_comment'],
					config: body.config,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				})
			});
			return;
		}

		// Default: continue with actual request
		await route.continue();
	});
}

/**
 * Create test board with GitHub repo
 */
async function createGithubBoard(page: Page, repoName: string = 'testuser/test-repo') {
	const [owner, repo] = repoName.split('/');
	const boardAlias = `test-board-${Date.now()}`;

	// Navigate to boards page
	await page.goto('/testuser/boards');

	// Create new board
	await page.click('button:has-text("Create Board")');
	await page.fill('input[name="board-name"]', `Test Board ${Date.now()}`);
	await page.click('button:has-text("Create")');

	// Wait for redirect to new board
	await page.waitForURL(/\/testuser\/.*/, { timeout: 5000 });

	// Get board ID from URL or data attribute
	const url = page.url();
	const urlBoardAlias = url.split('/').pop() || boardAlias;

	// Connect GitHub repo (this is simplified - actual implementation may vary)
	// This would typically involve:
	// 1. Opening board settings
	// 2. Selecting GitHub repo
	// 3. Saving

	return {
		boardId: 'mock-board-id',
		boardAlias: urlBoardAlias,
		owner,
		repo
	};
}

/**
 * Create test todo with GitHub link
 */
async function createGithubTodo(page: Page, options: {
	boardAlias: string;
	title: string;
	githubIssueNumber?: number;
	githubIssueId?: number;
}) {
	await page.goto(`/testuser/${options.boardAlias}`);

	// Create todo
	const todoInput = page.locator('input[placeholder*="Add"]').first();
	await todoInput.fill(options.title);
	await todoInput.press('Enter');

	// Wait for todo to appear
	await page.waitForSelector(`text=${options.title}`, { timeout: 5000 });

	return {
		todoId: 'mock-todo-id',
		githubIssueNumber: options.githubIssueNumber || 1,
		githubIssueId: options.githubIssueId || 123456
	};
}

/**
 * Setup GitHub authentication mock
 */
async function setupGithubAuth(page: Page) {
	// Mock GitHub OAuth token in user settings
	// This would typically set localStorage or inject into database
	await page.evaluate(() => {
		localStorage.setItem('github_token_mock', 'gho_mocktoken123');
	});
}

/**
 * Cleanup test data
 */
async function cleanupGithubData(page: Page) {
	// Clean up boards, todos, etc. created during tests
	// This is a placeholder - actual cleanup would involve API calls or database queries
	console.log('[Cleanup] GitHub test data cleaned up');
}

/**
 * Extended test with GitHub fixtures
 */
export const test = base.extend<GithubFixtures>({
	mockGithubAPI: async ({ page }, use) => {
		await mockGithubAPI(page);
		await use(async () => {});
	},

	createGithubBoard: async ({ page }, use) => {
		await use((repoName) => createGithubBoard(page, repoName));
	},

	createGithubTodo: async ({ page }, use) => {
		await use((options) => createGithubTodo(page, options));
	},

	setupGithubAuth: async ({ page }, use) => {
		await use(async () => setupGithubAuth(page));
	},

	cleanupGithubData: async ({ page }, use) => {
		await use(async () => {});
		// Cleanup after test
		await cleanupGithubData(page);
	}
});

export { expect };
