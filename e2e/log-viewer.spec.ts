import { test, expect } from '@playwright/test';

test.describe('Log Viewer', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('should display logs page and filters', async ({ page }) => {
		await page.goto('/en/logs');

		// Check page title
		await expect(page.locator('h1')).toContainText('System Logs');

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

		// Check if pagination buttons exist
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
			await expect(firstLog.locator('.font-mono')).toBeVisible(); // Component name
			await expect(firstLog.locator('.text-sm').first()).toBeVisible(); // Message

			// Check if data details toggle exists
			const detailsToggle = firstLog.locator('details summary');
			if (await detailsToggle.count() > 0) {
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

		// Set up download listener
		const downloadPromise = page.waitForEvent('download');

		// Click export button
		await page.click('button:has-text("Export")');

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
});
