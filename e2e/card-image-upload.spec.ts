/** @file e2e/card-image-upload.spec.ts */
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Card Image Upload', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app (user is authenticated via auth.setup.ts)
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('should display upload area when clicking attach images button', async ({ page }) => {
		// Create a todo first
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test todo for image upload');
		await addButton.click();
		await expect(page.getByText('Test todo for image upload')).toBeVisible();

		// Click on the todo card to open detail view
		await page.getByText('Test todo for image upload').click();
		await page.waitForURL(/\/[^/]+$/); // Wait for card detail page

		// Wait for card modal to be visible
		await expect(page.getByRole('dialog')).toBeVisible();

		// Click "Attach images" button
		const attachButton = page.getByRole('button', { name: /attach images/i });
		await attachButton.click();

		// Verify upload area is now visible
		await expect(page.getByText(/drag and drop images here/i)).toBeVisible();
	});

	test('should display existing attachments in card detail', async ({ page }) => {
		// Create a todo first
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Todo with attachments');
		await addButton.click();
		await expect(page.getByText('Todo with attachments')).toBeVisible();

		// Click on the todo card to open detail view
		await page.getByText('Todo with attachments').click();
		await page.waitForURL(/\/[^/]+$/);

		// Wait for card modal to be visible
		await expect(page.getByRole('dialog')).toBeVisible();

		// Check that Attachments section exists
		await expect(page.getByText(/Attachments/i)).toBeVisible();
	});

	test('should show upload UI components when attach button is clicked', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test upload UI');
		await addButton.click();
		await expect(page.getByText('Test upload UI')).toBeVisible();

		// Open card detail
		await page.getByText('Test upload UI').click();
		await page.waitForURL(/\/[^/]+$/);
		await expect(page.getByRole('dialog')).toBeVisible();

		// Click attach images button
		const attachButton = page.getByRole('button', { name: /attach images/i });
		await attachButton.click();

		// Verify all upload UI elements are present
		await expect(page.getByText(/drag and drop images here/i)).toBeVisible();
		await expect(page.getByText(/click to select/i)).toBeVisible();
		await expect(page.getByText(/png, jpg up to 5mb each/i)).toBeVisible();
	});

	test('should have accessible upload area', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test accessibility');
		await addButton.click();
		await expect(page.getByText('Test accessibility')).toBeVisible();

		// Open card detail
		await page.getByText('Test accessibility').click();
		await page.waitForURL(/\/[^/]+$/);
		await expect(page.getByRole('dialog')).toBeVisible();

		// Click attach images button
		const attachButton = page.getByRole('button', { name: /attach images/i });
		await attachButton.click();

		// Verify upload area has proper ARIA attributes
		const uploadArea = page.getByRole('button', {
			name: /upload images by drag and drop or click to browse/i
		});
		await expect(uploadArea).toBeVisible();
		await expect(uploadArea).toHaveAttribute('tabindex', '0');
	});

	test('should close modal and return to board view on close', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test modal close');
		await addButton.click();
		await expect(page.getByText('Test modal close')).toBeVisible();

		// Open card detail
		await page.getByText('Test modal close').click();
		await page.waitForURL(/\/[^/]+$/);
		await expect(page.getByRole('dialog')).toBeVisible();

		// Close the modal using the X button
		const closeButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
		await closeButton.click();

		// Verify we're back on the board view
		await page.waitForURL(/^(?!.*\/[^/]+$)/); // Wait for URL without card ID
		await expect(page.getByText('Test modal close')).toBeVisible(); // Todo should still be visible on board
	});

	test('should close modal on Escape key', async ({ page }) => {
		// Create a todo
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('Test escape key');
		await addButton.click();
		await expect(page.getByText('Test escape key')).toBeVisible();

		// Open card detail
		await page.getByText('Test escape key').click();
		await page.waitForURL(/\/[^/]+$/);
		await expect(page.getByRole('dialog')).toBeVisible();

		// Press Escape key
		await page.keyboard.press('Escape');

		// Verify modal is closed
		await page.waitForURL(/^(?!.*\/[^/]+$)/);
		await expect(page.getByText('Test escape key')).toBeVisible();
	});
});
