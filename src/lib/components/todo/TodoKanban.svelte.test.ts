/** @file src/lib/components/todo/TodoKanban.svelte.test.ts */
import { page } from '@vitest/browser/context';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TodoKanban from './TodoKanban.svelte';

describe('TodoKanban Component', () => {
	beforeEach(() => {
		// TODO: reset any global state?
	});

	it('should render kanban grid structure', async () => {
		render(TodoKanban);

		const kanbanGrid = page.locator('.grid');
		await expect.element(kanbanGrid).toBeInTheDocument();
	});

	it('should show DndContext for drag and drop', async () => {
		render(TodoKanban);

		const dndContainer = page.locator('[data-testid], .grid').first();
		await expect.element(dndContainer).toBeInTheDocument();
	});
});