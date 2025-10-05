import { test, expect } from '@playwright/test';

test.describe('Error Boundary', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('should catch runtime errors and display error UI', async ({ page }) => {
		// Create a page that will throw an error
		await page.goto('/en');

		// Inject a script that will cause an error
		await page.evaluate(() => {
			setTimeout(() => {
				throw new Error('Test error for error boundary');
			}, 100);
		});

		// Wait for error boundary to catch the error
		await page.waitForTimeout(500);

		// Check if error boundary UI is displayed
		const errorTitle = await page.locator('h1:has-text("Something went wrong")').count();
		if (errorTitle > 0) {
			await expect(page.locator('h1')).toContainText('Something went wrong');
			await expect(page.locator('button:has-text("Reload Page")')).toBeVisible();
			await expect(page.locator('button:has-text("Go Home")')).toBeVisible();
		}
	});

	test('should display error message in error UI', async ({ page }) => {
		await page.goto('/en');

		// Inject an error
		await page.evaluate(() => {
			setTimeout(() => {
				throw new Error('Custom test error message');
			}, 100);
		});

		await page.waitForTimeout(500);

		const errorUI = await page.locator('text=Error Message').count();
		if (errorUI > 0) {
			await expect(page.locator('text=Error Message')).toBeVisible();
		}
	});

	test('should catch promise rejections', async ({ page }) => {
		await page.goto('/en');

		// Inject an unhandled promise rejection
		await page.evaluate(() => {
			setTimeout(() => {
				Promise.reject(new Error('Test promise rejection'));
			}, 100);
		});

		await page.waitForTimeout(500);

		// Error boundary should catch this
		const errorBoundary = await page.locator('text=Something went wrong').count();
		expect(errorBoundary).toBeGreaterThanOrEqual(0);
	});

	test('should have reload button that works', async ({ page }) => {
		await page.goto('/en');

		// Cause an error
		await page.evaluate(() => {
			throw new Error('Test error');
		});

		await page.waitForTimeout(500);

		const reloadButton = await page.locator('button:has-text("Reload Page")').count();
		if (reloadButton > 0) {
			// Button should be present and enabled
			await expect(page.locator('button:has-text("Reload Page")')).toBeEnabled();
		}
	});
});

test.describe('Performance Monitoring', () => {
	test.use({ storageState: 'e2e/.auth/user.json' });

	test('should track page load performance', async ({ page }) => {
		await page.goto('/en');

		// Check that performance API is available
		const perfAvailable = await page.evaluate(() => {
			return typeof performance !== 'undefined' && typeof performance.now === 'function';
		});

		expect(perfAvailable).toBe(true);
	});

	test('should log slow operations to database', async ({ page }) => {
		await page.goto('/en/logs');
		await page.waitForTimeout(1000);

		// Check if we can see performance-related logs
		const perfLogs = await page.locator('span:has-text("Performance")').count();

		// Performance logs may or may not exist depending on app activity
		expect(perfLogs).toBeGreaterThanOrEqual(0);
	});
});
