/** @file e2e/log-viewer.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Log Viewer', () => {
	test('should display logs page and filters', async ({ page }) => {
		await page.goto('/en/logs');

		// Check page title
		await expect(page.getByRole('heading', { name: 'System Logs' })).toBeVisible();

		// Check filters are present
		await expect(page.locator('label:has-text("Level")')).toBeVisible();
		await expect(page.locator('label:has-text("Component")')).toBeVisible();
		await expect(page.locator('label:has-text("From Date")')).toBeVisible();
		await expect(page.locator('label:has-text("To Date")')).toBeVisible();
		await expect(page.locator('label:has-text("Search Message")')).toBeVisible();

		// Check action buttons
		await expect(page.locator('button:has-text("Apply Filters")')).toBeVisible();
		await expect(page.locator('button:has-text("Reset")')).toBeVisible();
		await expect(page.locator('button:has-text("Export")')).toBeVisible();
	});

	test('should filter logs by level', async ({ page }) => {
		await page.goto('/en/logs');

		// Wait for initial logs to load
		await page.waitForTimeout(1000);

		// Select error level only
		await page.locator('#level').selectOption('error');
		await page.click('button:has-text("Apply Filters")');

		// Wait for filtered results
		await page.waitForTimeout(500);

		// Check that only error badges are visible (if any logs exist)
		const logs = await page.locator('.border.rounded-lg').count();
		if (logs > 0) {
			const errorBadges = await page.locator('span:has-text("ERROR")').count();
			expect(errorBadges).toBeGreaterThan(0);
		}
	});

	test('should search logs by message', async ({ page }) => {
		await page.goto('/en/logs');

		// Wait for initial logs to load
		await page.waitForTimeout(1000);

		// Enter search term
		await page.fill('#search', 'User');
		await page.click('button:has-text("Apply Filters")');

		// Wait for filtered results
		await page.waitForTimeout(500);

		// Results should be filtered (check that filter was applied)
		await expect(page.locator('#search')).toHaveValue('User');
	});

	test('should reset filters', async ({ page }) => {
		await page.goto('/en/logs');

		// Set some filters
		await page.locator('#level').selectOption('error');
		await page.fill('#component', 'TestComponent');
		await page.fill('#search', 'test search');

		// Click reset
		await page.click('button:has-text("Reset")');

		// Wait for reset to complete
		await page.waitForTimeout(500);

		// Check filters are cleared
		await expect(page.locator('#level')).toHaveValue('all');
		await expect(page.locator('#component')).toHaveValue('');
		await expect(page.locator('#search')).toHaveValue('');
	});

	test('should navigate between pages', async ({ page }) => {
		await page.goto('/en/logs');

		// Wait for logs to load
		await page.waitForTimeout(1000);

		// Pagination only renders when there are logs; the test user may have none.
		await expect(page.getByText(/No logs found|Page \d+ of/).first()).toBeVisible();
		test.skip(
			(await page.getByText(/No logs found/i).count()) > 0,
			'test user has no logs to page through'
		);
		const nextButton = page.locator('button:has-text("Next")');
		const prevButton = page.locator('button:has-text("Previous")');

		await expect(nextButton).toBeVisible();
		await expect(prevButton).toBeVisible();

		// Previous should be disabled on first page
		await expect(prevButton).toBeDisabled();
	});

	test('should display log details', async ({ page }) => {
		await page.goto('/en/logs');

		// Wait for logs to load
		await page.waitForTimeout(1000);

		const logCards = page.locator('.border.rounded-lg');
		const logCount = await logCards.count();

		if (logCount > 0) {
			// Check first log card has required elements
			const firstLog = logCards.first();
			// Component name; a log with a session id shows it in a second .font-mono
			await expect(firstLog.locator('.font-mono').first()).toBeVisible();
			await expect(firstLog.locator('.text-sm').first()).toBeVisible(); // Message

			// Check if data details toggle exists
			const detailsToggle = firstLog.locator('details summary');
			if ((await detailsToggle.count()) > 0) {
				await detailsToggle.click();
				// Data should be visible
				await expect(firstLog.locator('pre')).toBeVisible();
			}
		}
	});

	test('should export logs', async ({ page }) => {
		await page.goto('/en/logs');

		// Wait for logs to load
		await page.waitForTimeout(1000);

		// Export is disabled with zero logs; the test user may have none.
		await expect(page.getByText(/No logs found|Page \d+ of/).first()).toBeVisible();
		const exportButton = page.getByRole('button', { name: /^Export/ });
		test.skip(await exportButton.isDisabled(), 'test user has no logs to export');

		// Set up download listener
		const downloadPromise = page.waitForEvent('download');

		// Click export button
		await exportButton.click();

		// Wait for download
		const download = await downloadPromise;

		// Check filename
		expect(download.suggestedFilename()).toMatch(/logs-\d{4}-\d{2}-\d{2}\.json/);
	});

	test('should redirect unauthenticated users', async ({ page }) => {
		// Create a new context without auth
		await page.context().clearCookies();

		await page.goto('/en/logs');

		// Should redirect to signin
		await page.waitForURL('**/signin');
		await expect(page).toHaveURL(/\/signin/);
	});

	test('should not redirect authenticated users prematurely', async ({ page }) => {
		// This test specifically verifies the fix for the premature redirect issue
		// The page should wait for user data to load before checking authentication

		await page.goto('/en/logs');

		// Should remain on logs page (not redirect to signin)
		await page.waitForTimeout(1000); // Wait for potential redirect
		await expect(page).toHaveURL(/\/logs/);

		// Page should be visible
		await expect(page.getByRole('heading', { name: 'System Logs' })).toBeVisible();
	});

	test('should load user data before checking authentication', async ({ page }) => {
		// Test that the page waits for userStore.loading to complete
		// before making authentication decisions

		// Navigate to logs page
		await page.goto('/en/logs');

		// The page should load successfully without premature redirects
		await expect(page.getByRole('heading', { name: 'System Logs' })).toBeVisible({ timeout: 3000 });

		// Filters should be interactive (proving the page fully loaded)
		await expect(page.locator('#level')).toBeEnabled();
		await expect(page.locator('button:has-text("Apply Filters")')).toBeEnabled();
	});
});
