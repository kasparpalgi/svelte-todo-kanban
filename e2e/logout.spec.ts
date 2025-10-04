/** @file e2e/logout.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Logout functionality', () => {
	test('should logout successfully and clear user data', async ({ page, context }) => {
		// Navigate to the app (user is authenticated via auth.setup.ts)
		await page.goto('/');

		// Wait for the page to load
		await page.waitForLoadState('networkidle');

		// Verify we're logged in by checking for user menu elements
		const logoutButton = page.getByRole('button').filter({ has: page.locator('svg').filter({ hasText: '' }) }).first();
		await expect(logoutButton).toBeVisible({ timeout: 10000 });

		// Check that localStorage has some app data before logout
		const localStorageBefore = await page.evaluate(() => {
			return {
				hasSelectedBoard: localStorage.getItem('selectedBoardId') !== null,
				keys: Object.keys(localStorage)
			};
		});

		console.log('[Test] localStorage before logout:', localStorageBefore);

		// Click logout button
		console.log('[Test] Clicking logout button...');
		await logoutButton.click();

		// Wait for redirect to signin page
		await page.waitForURL(/\/signin/, { timeout: 10000 });
		console.log('[Test] Redirected to signin page');

		// Verify we're on the signin page
		await expect(page).toHaveURL(/\/signin/);

		// Verify localStorage has been cleared
		const localStorageAfter = await page.evaluate(() => {
			return {
				selectedBoardId: localStorage.getItem('selectedBoardId'),
				todoFilteringPreferences: localStorage.getItem('todo-filtering-preferences'),
				todoViewMode: localStorage.getItem('todo-view-mode'),
				allKeys: Object.keys(localStorage)
			};
		});

		console.log('[Test] localStorage after logout:', localStorageAfter);

		// Assert that app-specific localStorage items are cleared
		expect(localStorageAfter.selectedBoardId).toBeNull();
		expect(localStorageAfter.todoFilteringPreferences).toBeNull();
		expect(localStorageAfter.todoViewMode).toBeNull();

		// Verify we can't access protected pages without authentication
		await page.goto('/');
		await page.waitForURL(/\/signin/, { timeout: 5000 });
		await expect(page).toHaveURL(/\/signin/);
	});

	test('should show signin page elements after logout', async ({ page }) => {
		// Navigate to app
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Logout
		const logoutButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
		await logoutButton.click();

		// Wait for signin page
		await page.waitForURL(/\/signin/, { timeout: 10000 });

		// Verify signin page has expected elements
		// Note: Adjust these selectors based on your actual signin page
		await expect(page.getByText(/sign in/i).first()).toBeVisible();
	});

	test('should not show user-specific data after logout and re-visiting', async ({ page, context }) => {
		// Navigate to app
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Logout
		const logoutButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
		await logoutButton.click();

		// Wait for signin page
		await page.waitForURL(/\/signin/, { timeout: 10000 });

		// Try to visit a protected route directly
		await page.goto('/en');

		// Should redirect to signin
		await page.waitForURL(/\/signin/, { timeout: 5000 });
		await expect(page).toHaveURL(/\/signin/);
	});
});
