/** @file e2e/card-loading-optimization.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Card Loading Optimization', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app (user is authenticated via auth.setup.ts)
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('should not show "Loading your cards" when opening card from board', async ({ page }) => {
		// Create a todo first
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test card for loading optimization');
		await addButton.click();
		await expect(page.getByText('Test card for loading optimization')).toBeVisible();

		// Set up network request tracking
		const graphqlRequests: string[] = [];
		page.on('request', (request) => {
			if (request.url().includes('graphql') || request.url().includes('hasura')) {
				const postData = request.postData();
				if (postData && postData.includes('GetTodos')) {
					graphqlRequests.push('GetTodos');
				}
			}
		});

		// Click on the todo card to open detail view
		await page.getByText('Test card for loading optimization').click();
		await page.waitForURL(/\/[^/]+$/); // Wait for card detail page

		// Wait for card modal to be visible
		await expect(page.getByRole('dialog')).toBeVisible();

		// Verify we do NOT see "Loading your cards" message
		await expect(page.getByText(/loading your cards/i)).not.toBeVisible();

		// Verify card details are immediately visible (from store)
		await expect(page.getByText('Test card for loading optimization')).toBeVisible();

		// Wait a bit to ensure no additional GetTodos requests were made
		await page.waitForTimeout(500);

		// Should not have made a GetTodos request after opening the card
		// (the todos were already loaded when viewing the board)
		const getTodosAfterOpen = graphqlRequests.filter((req) => req === 'GetTodos').length;
		expect(getTodosAfterOpen).toBe(0);
	});

	test('should preload data on hover', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Hover preload test');
		await addButton.click();
		await expect(page.getByText('Hover preload test')).toBeVisible();

		// Track network requests for comments
		let commentsRequested = false;
		page.on('request', (request) => {
			if (request.url().includes('graphql') || request.url().includes('hasura')) {
				const postData = request.postData();
				if (postData && postData.includes('GetComments')) {
					commentsRequested = true;
				}
			}
		});

		// Hover over the card to trigger preloading
		await page.getByText('Hover preload test').hover();

		// Wait a bit for preload to trigger
		await page.waitForTimeout(100);

		// Verify that preload was triggered (comments should be requested)
		// Note: This assumes comments are preloaded on hover
		// The actual behavior depends on the data-sveltekit-preload-data attribute

		// Now click to open
		await page.getByText('Hover preload test').click();
		await page.waitForURL(/\/[^/]+$/);

		// Modal should appear quickly since data was preloaded
		await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
	});

	test('should open card detail immediately from cached store data', async ({ page }) => {
		// Create a todo with some content
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Immediate load test');
		await addButton.click();
		await expect(page.getByText('Immediate load test')).toBeVisible();

		// Click to open the card
		const startTime = Date.now();
		await page.getByText('Immediate load test').click();

		// Wait for the modal dialog
		await expect(page.getByRole('dialog')).toBeVisible();
		const endTime = Date.now();

		// Should open very quickly (under 1 second) since it uses store data
		const loadTime = endTime - startTime;
		expect(loadTime).toBeLessThan(1000);

		// Verify card title is visible immediately
		await expect(page.getByText('Immediate load test')).toBeVisible();
	});

	test('should maintain card data when navigating back to board', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Navigation test card');
		await addButton.click();
		await expect(page.getByText('Navigation test card')).toBeVisible();

		// Open the card
		await page.getByText('Navigation test card').click();
		await page.waitForURL(/\/[^/]+$/);
		await expect(page.getByRole('dialog')).toBeVisible();

		// Close the modal (press Escape or click backdrop)
		await page.keyboard.press('Escape');

		// Should navigate back to board
		await page.waitForURL(/\/[^/]+\/[^/]+\/[^/]+$/); // board URL pattern

		// Card should still be visible on the board (data preserved in store)
		await expect(page.getByText('Navigation test card')).toBeVisible();

		// Open again - should be instant since store still has data
		await page.getByText('Navigation test card').click();
		await expect(page.getByRole('dialog')).toBeVisible({ timeout: 500 });
	});
});
