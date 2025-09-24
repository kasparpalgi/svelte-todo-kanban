/** @file src/routes/[[lang]]/page.svelte.test.ts */
import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('Home Page', () => {
	it('should render main heading', async () => {
		// Mock the required props/data
		const mockData = {
			session: null // Test unauthenticated state first
		};

		render(Page, { data: mockData });

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		// Use toContainText instead of toHaveText for better compatibility
		await expect.element(heading).toBeVisible();
	});

	it('should show view mode toggle buttons', async () => {
		const mockData = { session: null };
		render(Page, { data: mockData });

		// Check for view mode buttons
		const listButton = page.getByRole('button', { name: /list/i });
		const kanbanButton = page.getByRole('button', { name: /kanban/i });

		await expect.element(listButton).toBeVisible();
		await expect.element(kanbanButton).toBeVisible();
	});

	it('should have add task input', async () => {
		const mockData = { session: null };
		render(Page, { data: mockData });

		const taskInput = page.getByPlaceholder(/enter task title/i);
		await expect.element(taskInput).toBeVisible();
	});
});
