/** @file e2e/github-import.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('GitHub Issues Import', () => {
	test.skip('should display import button when board is connected to GitHub', async ({ page }) => {
		// TODO: Setup test user with GitHub OAuth
		// TODO: Create test board with GitHub repo

		await page.goto('/en');

		// Navigate to board
		await page.click('[data-testid="board-link"]');

		// Verify import button is visible
		const importButton = page.getByRole('button', { name: /import issues/i });
		await expect(importButton).toBeVisible();
	});

	test.skip('should open import dialog when clicking import button', async ({ page }) => {
		// TODO: Setup test environment
		await page.goto('/en/test-user/test-board');

		await page.click('[title="Import GitHub Issues"]');

		// Verify dialog is open
		await expect(page.getByRole('heading', { name: /import github issues/i })).toBeVisible();

		// Verify list selector is present
		await expect(page.getByRole('combobox', { name: /import issues into list/i })).toBeVisible();
	});

	test.skip('should import issues into selected list', async ({ page }) => {
		// TODO: Mock GitHub API
		// TODO: Setup test data

		await page.goto('/en/test-user/test-board');

		// Open import dialog
		await page.click('[title="Import GitHub Issues"]');

		// Select target list
		await page.getByRole('combobox', { name: /import issues into list/i }).click();
		await page.getByRole('option', { name: 'To Do' }).click();

		// Click import
		await page.getByRole('button', { name: /import issues/i }).click();

		// Verify success message
		await expect(page.getByText(/successfully imported/i)).toBeVisible();

		// Verify todos appear with GitHub badges
		await expect(page.getByRole('link', { name: /#\d+/ })).toBeVisible();
	});

	test.skip('should not duplicate existing synced todos on re-import', async ({ page }) => {
		// TODO: Import same issues twice
		// TODO: Verify count doesn't increase
	});

	test.skip('should show error if GitHub token is missing', async ({ page }) => {
		// TODO: Test with user who hasn't connected GitHub
		await page.goto('/en/test-user/test-board');

		await page.click('[title="Import GitHub Issues"]');
		await page.getByRole('button', { name: /import issues/i }).click();

		// Verify error message
		await expect(page.getByText(/github not connected/i)).toBeVisible();
	});

	test.skip('should display GitHub issue number on todo cards', async ({ page }) => {
		// TODO: Create todo with GitHub metadata
		await page.goto('/en/test-user/test-board');

		// Verify GitHub badge is visible
		const githubBadge = page.getByRole('link', { name: /#42/ });
		await expect(githubBadge).toBeVisible();

		// Verify it links to GitHub
		const href = await githubBadge.getAttribute('href');
		expect(href).toContain('github.com');
	});

	test.skip('should open GitHub issue in new tab when clicking badge', async ({ page, context }) => {
		// TODO: Create todo with GitHub metadata
		await page.goto('/en/test-user/test-board');

		const githubBadge = page.getByRole('link', { name: /#42/ });

		// Verify target="_blank"
		const target = await githubBadge.getAttribute('target');
		expect(target).toBe('_blank');

		// Verify rel="noopener noreferrer"
		const rel = await githubBadge.getAttribute('rel');
		expect(rel).toContain('noopener');
		expect(rel).toContain('noreferrer');
	});
});

test.describe('GitHub Import Error Handling', () => {
	test.skip('should handle GitHub API rate limit', async ({ page }) => {
		// TODO: Mock 403 response
		await page.goto('/en/test-user/test-board');

		await page.click('[title="Import GitHub Issues"]');
		await page.getByRole('button', { name: /import issues/i }).click();

		await expect(page.getByText(/rate limit exceeded/i)).toBeVisible();
	});

	test.skip('should handle repository not found', async ({ page }) => {
		// TODO: Mock 404 response
		await page.goto('/en/test-user/test-board');

		await page.click('[title="Import GitHub Issues"]');
		await page.getByRole('button', { name: /import issues/i }).click();

		await expect(page.getByText(/repository not found/i)).toBeVisible();
	});

	test.skip('should handle network errors gracefully', async ({ page }) => {
		// TODO: Simulate network failure
		await page.goto('/en/test-user/test-board');

		await page.click('[title="Import GitHub Issues"]');
		await page.getByRole('button', { name: /import issues/i }).click();

		await expect(page.getByText(/failed to import/i)).toBeVisible();
	});
});
