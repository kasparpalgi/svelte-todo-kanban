/** @file e2e/todo-functionality.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Todo management', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should create multiple todos', async ({ page }) => {
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		const todos = ['First todo', 'Second todo', 'Third todo'];

		for (const todo of todos) {
			await taskInput.fill(todo);
			await addButton.click();
			await expect(page.getByText(todo)).toBeVisible();
		}
	});

	test('should handle empty todo creation gracefully', async ({ page }) => {
		const taskInput = page.getByPlaceholder(/enter task title/i);
		const addButton = page.getByRole('button', { name: /add/i });

		await taskInput.fill('   ');
		await expect(addButton).toBeDisabled();
		// TODO: implement edge cases :P
	});
});
