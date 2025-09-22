/** @file e2e/authenticated.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Authenticated user flow', () => {
	test('should access todos', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
		await expect(page.getByPlaceholder(/enter task title/i)).toBeVisible();
	});

	test('should create new todo item', async ({ page }) => {
		await page.goto('/');

		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });
		const testTodoTitle = 'E2E test todo';
		await taskInput.fill(testTodoTitle);
		await addButton.click();

		const todoContainer = page.locator('div[class*="grid-cols-1"]');
		await expect(todoContainer.getByText(testTodoTitle)).toBeVisible();
	});

	test('should toggle between list/kanban', async ({ page }) => {
		await page.goto('/');

		const listButton = page.getByRole('button', { name: /list/i });
		const kanbanButton = page.getByRole('button', { name: /kanban/i });

		await expect(kanbanButton).toHaveClass(/bg-primary/);
		await listButton.click();
		await expect(listButton).toHaveClass(/bg-primary/);
		await kanbanButton.click();
		await expect(kanbanButton).toHaveClass(/bg-primary/);
	});

	test('should display quick add form', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByText(/add new task/i)).toBeVisible();
		await expect(page.getByText(/what.*accomplish/i)).toBeVisible();

		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await expect(addButton).toBeDisabled();
		await taskInput.fill('Test task');
		await expect(addButton).toBeEnabled();

		await taskInput.fill('');
		await expect(addButton).toBeDisabled();
	});

	test('should handle keyboard shortcuts', async ({ page }) => {
		await page.goto('/');

		const taskInput = page.getByPlaceholder(/enter task title/i);

		await taskInput.fill('Keyboard shortcut todo');
		await taskInput.press('Enter');

		const todoContainer = page.locator('div[class*="grid-cols-1"]');
		await expect(todoContainer.getByText('Keyboard shortcut todo')).toBeVisible();

		await expect(taskInput).toHaveValue('');
	});

	test('should show error handling', async ({ page }) => {
		await page.goto('/');

		const errorContainer = page.locator('.border-destructive');

		// TODO: trigger error condition
	});

	test('should persist view mode preference', async ({ page }) => {
		await page.goto('/');

		const listButton = page.getByRole('button', { name: /list/i });
		await listButton.click();
		await page.reload();
		await expect(listButton).toHaveClass(/bg-primary/);
	});
});
