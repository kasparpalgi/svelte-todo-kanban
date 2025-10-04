/** @file e2e/github-create-issue.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('GitHub Issue Creation from Todos', () => {
	test.skip('should show GitHub checkbox when board is connected', async ({ page }) => {
		// TODO: Setup test user with GitHub OAuth
		// TODO: Create test board with GitHub repo

		await page.goto('/en/test-user/test-board');

		// Verify checkbox is visible
		const checkbox = page.getByRole('checkbox', { name: /create github issue/i });
		await expect(checkbox).toBeVisible();

		// Verify GitHub icon is shown
		const githubIcon = page.locator('label:has-text("Create GitHub issue") svg');
		await expect(githubIcon).toBeVisible();
	});

	test.skip('should not show GitHub checkbox when board not connected', async ({ page }) => {
		// TODO: Create board without GitHub repo
		await page.goto('/en/test-user/regular-board');

		const checkbox = page.getByRole('checkbox', { name: /create github issue/i });
		await expect(checkbox).not.toBeVisible();
	});

	test.skip('should create GitHub issue when checkbox is checked', async ({ page }) => {
		// TODO: Mock GitHub API
		await page.goto('/en/test-user/test-board');

		// Check the GitHub checkbox
		await page.getByRole('checkbox', { name: /create github issue/i }).check();

		// Enter todo title
		await page.getByPlaceholder(/enter task title/i).fill('Test todo with GitHub issue');

		// Click add button
		await page.getByRole('button', { name: /add/i }).click();

		// Verify todo created
		await expect(page.getByText('Test todo with GitHub issue')).toBeVisible();

		// Verify GitHub badge appears
		await expect(page.getByRole('link', { name: /#\d+/ })).toBeVisible();

		// Verify checkbox is unchecked after creation
		const checkbox = page.getByRole('checkbox', { name: /create github issue/i });
		await expect(checkbox).not.toBeChecked();
	});

	test.skip('should create todo even if GitHub issue creation fails', async ({ page }) => {
		// TODO: Mock GitHub API to return error
		await page.goto('/en/test-user/test-board');

		// Check the checkbox
		await page.getByRole('checkbox', { name: /create github issue/i }).check();

		// Create todo
		await page.getByPlaceholder(/enter task title/i).fill('Test todo');
		await page.getByRole('button', { name: /add/i }).click();

		// Todo should still be created
		await expect(page.getByText('Test todo')).toBeVisible();

		// But no GitHub badge
		await expect(page.getByRole('link', { name: /#\d+/ })).not.toBeVisible();
	});

	test.skip('should map priority to GitHub labels', async ({ page }) => {
		// TODO: Test that high/medium/low priority creates correct labels
	});

	test.skip('should include todo content in GitHub issue body', async ({ page }) => {
		// TODO: Test that todo description becomes issue body
	});
});

test.describe('GitHub Issue Creation Error Handling', () => {
	test.skip('should handle GitHub authentication errors', async ({ page }) => {
		// TODO: Mock 401 response
		await page.goto('/en/test-user/test-board');

		await page.getByRole('checkbox', { name: /create github issue/i }).check();
		await page.getByPlaceholder(/enter task title/i).fill('Test todo');
		await page.getByRole('button', { name: /add/i }).click();

		// Todo created but no badge
		await expect(page.getByText('Test todo')).toBeVisible();
		// Error logged to console (non-blocking)
	});

	test.skip('should handle GitHub rate limiting', async ({ page }) => {
		// TODO: Mock 403 response
	});

	test.skip('should handle repository not found', async ({ page }) => {
		// TODO: Mock 404 response
	});
});
