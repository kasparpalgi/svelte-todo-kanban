/** @file src/lib/components/todo/TodoItem.svelte.test.ts */
import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TodoItem from './TodoItem.svelte';

describe('TodoItem Component', () => {
	const mockTodo = {
		id: 'test-todo-1',
		title: 'Test Todo Item',
		content: 'This is a test todo description',
		completed_at: null,
		due_on: null,
		sort_order: 1,
		list: null
	};

	it('should render todo title', async () => {
		render(TodoItem, { todo: mockTodo });

		const todoTitle = page.getByText(mockTodo.title);
		await expect.element(todoTitle).toBeVisible();
	});

	it('should render todo content when provided', async () => {
		render(TodoItem, { todo: mockTodo });

		const todoContent = page.getByText(mockTodo.content);
		await expect.element(todoContent).toBeVisible();
	});

	it('should show toggle button', async () => {
		render(TodoItem, { todo: mockTodo });

		const toggleButton = page.getByRole('button').first();
		await expect.element(toggleButton).toBeVisible();
	});

	it('should show delete button on hover', async () => {
		render(TodoItem, { todo: mockTodo });

        const todoContainer = page.getByText(mockTodo.title).locator('..');
		//const todoContainer = page.locator('.group').first();
		await todoContainer.hover();

		const deleteButton = page.getByRole('button').last();
		await expect.element(deleteButton).toBeVisible();
	});
});
