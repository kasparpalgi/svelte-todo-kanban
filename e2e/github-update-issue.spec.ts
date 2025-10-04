import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 3: Bidirectional GitHub Sync
 *
 * Tests the update-issue endpoint and automatic sync when todos change
 *
 * Prerequisites:
 * - User must be authenticated
 * - User must have GitHub OAuth token configured
 * - Board must have GitHub repo connected
 * - Todo must be linked to a GitHub issue
 */

test.describe('GitHub Issue Update Sync', () => {
	test.skip('should sync todo title change to GitHub issue', async ({ page }) => {
		// TODO: Setup authenticated session
		// TODO: Create board with GitHub repo
		// TODO: Create todo linked to GitHub issue

		await page.goto('/en/testuser/testboard');

		// Click on todo to edit
		await page.click('[data-testid="todo-item"]');

		// Change title
		const titleInput = page.locator('[data-testid="todo-title-input"]');
		await titleInput.fill('Updated Todo Title');
		await titleInput.blur();

		// Wait for sync to complete
		await page.waitForTimeout(1000);

		// Verify todo was updated locally
		await expect(page.locator('[data-testid="todo-item"]')).toContainText('Updated Todo Title');

		// TODO: Verify GitHub issue title was updated via API
	});

	test.skip('should sync todo content change to GitHub issue body', async ({ page }) => {
		await page.goto('/en/testuser/testboard');

		// Open todo detail
		await page.click('[data-testid="todo-item"]');

		// Change content
		const contentInput = page.locator('[data-testid="todo-content-input"]');
		await contentInput.fill('Updated todo description');
		await contentInput.blur();

		// Wait for sync
		await page.waitForTimeout(1000);

		// TODO: Verify GitHub issue body was updated
	});

	test.skip('should close GitHub issue when todo is marked complete', async ({ page }) => {
		await page.goto('/en/testuser/testboard');

		// Complete the todo
		await page.click('[data-testid="todo-checkbox"]');

		// Wait for sync
		await page.waitForTimeout(1000);

		// Verify todo is marked complete
		await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/completed/);

		// TODO: Verify GitHub issue state is 'closed'
	});

	test.skip('should reopen GitHub issue when completed todo is unchecked', async ({ page }) => {
		await page.goto('/en/testuser/testboard');

		// Uncheck a completed todo
		await page.click('[data-testid="completed-todo-checkbox"]');

		// Wait for sync
		await page.waitForTimeout(1000);

		// Verify todo is no longer complete
		await expect(page.locator('[data-testid="todo-item"]')).not.toHaveClass(/completed/);

		// TODO: Verify GitHub issue state is 'open'
	});

	test.skip('should not fail todo update if GitHub sync fails', async ({ page }) => {
		// TODO: Mock GitHub API to return error

		await page.goto('/en/testuser/testboard');

		// Change todo title
		await page.click('[data-testid="todo-item"]');
		const titleInput = page.locator('[data-testid="todo-title-input"]');
		await titleInput.fill('Title change that will fail to sync');
		await titleInput.blur();

		// Verify todo was updated locally despite GitHub failure
		await expect(page.locator('[data-testid="todo-item"]')).toContainText('Title change that will fail to sync');

		// Check console for error (should not throw)
		const logs = [];
		page.on('console', msg => logs.push(msg.text()));
		await page.waitForTimeout(500);

		// Should have logged error but not failed
		expect(logs.some(log => log.includes('Failed to sync todo to GitHub'))).toBe(true);
	});

	test.skip('should only sync changed fields to GitHub', async ({ page }) => {
		await page.goto('/en/testuser/testboard');

		// Change only title
		await page.click('[data-testid="todo-item"]');
		const titleInput = page.locator('[data-testid="todo-title-input"]');
		await titleInput.fill('Only title changed');
		await titleInput.blur();

		// TODO: Intercept GitHub API call
		// TODO: Verify payload only contains 'title' field, not 'body' or 'state'
	});

	test.skip('should not sync if todo is not linked to GitHub issue', async ({ page }) => {
		// Create a regular todo without GitHub link
		await page.goto('/en/testuser/testboard');

		// Add todo without creating GitHub issue
		const input = page.locator('[data-testid="add-todo-input"]');
		await input.fill('Local-only todo');
		await input.press('Enter');

		// Change the todo
		await page.click('[data-testid="todo-item"]:last-child');
		const titleInput = page.locator('[data-testid="todo-title-input"]');
		await titleInput.fill('Updated local todo');
		await titleInput.blur();

		// TODO: Verify no GitHub API call was made
	});

	test.skip('should not sync if board has no GitHub repo', async ({ page }) => {
		// TODO: Create board without GitHub connection

		await page.goto('/en/testuser/localboard');

		// Change todo
		await page.click('[data-testid="todo-item"]');
		const titleInput = page.locator('[data-testid="todo-title-input"]');
		await titleInput.fill('Changed on local board');
		await titleInput.blur();

		// TODO: Verify no GitHub API call was made
	});
});

test.describe('GitHub Update Issue API', () => {
	test.skip('should update issue title via API endpoint', async ({ request }) => {
		// TODO: Get auth token
		// TODO: Create test todo with GitHub issue

		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				title: 'New issue title'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.title).toBe('New issue title');
	});

	test.skip('should update issue body via API endpoint', async ({ request }) => {
		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				body: 'Updated issue description'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.body).toBe('Updated issue description');
	});

	test.skip('should close issue via API endpoint', async ({ request }) => {
		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				state: 'closed'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.state).toBe('closed');
	});

	test.skip('should reopen issue via API endpoint', async ({ request }) => {
		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				state: 'open'
			}
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.state).toBe('open');
	});

	test.skip('should return 401 if user not authenticated', async ({ request }) => {
		// TODO: Make request without auth

		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				title: 'Should fail'
			}
		});

		expect(response.status()).toBe(401);
	});

	test.skip('should return 400 if required fields missing', async ({ request }) => {
		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id'
				// Missing githubIssueNumber, owner, repo
			}
		});

		expect(response.status()).toBe(400);
	});

	test.skip('should return 404 if GitHub issue not found', async ({ request }) => {
		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 999999, // Non-existent issue
				owner: 'testowner',
				repo: 'testrepo',
				title: 'Update non-existent issue'
			}
		});

		expect(response.status()).toBe(404);
	});

	test.skip('should return 403 if user lacks GitHub permissions', async ({ request }) => {
		// TODO: Use GitHub token without write access

		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'someoneelse',
				repo: 'privaterepo',
				title: 'Should fail'
			}
		});

		expect(response.status()).toBe(403);
	});

	test.skip('should update github_synced_at timestamp in database', async ({ request }) => {
		// TODO: Get initial synced_at value

		const response = await request.patch('/api/github/update-issue', {
			data: {
				todoId: 'test-todo-id',
				githubIssueNumber: 123,
				owner: 'testowner',
				repo: 'testrepo',
				title: 'Trigger sync'
			}
		});

		expect(response.ok()).toBeTruthy();

		// TODO: Query database and verify github_synced_at was updated
	});
});
