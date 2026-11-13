/** @file src/lib/stores/labels.svelte.ts */
import { call } from '$lib/api/call';
import { browser } from '$app/environment';
import type { StoreResult } from '$lib/types/todo';
import { todosStore } from './todos.svelte';

function createLabelsStore() {
	/** Adds or removes a label on a card; the server returns the updated card. */
	async function setTodoLabel(todoId: string, labelId: string, on: boolean): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const todo = await call(on ? 'addTodoLabel' : 'removeTodoLabel', { todoId, labelId });
			todosStore.putTodo(todo);
			return { success: true, message: on ? 'Label added successfully' : 'Label removed successfully' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error changing label';
			console.error('Todo label error:', error);
			return { success: false, message };
		}
	}

	const addTodoLabel = (todoId: string, labelId: string) => setTodoLabel(todoId, labelId, true);
	const removeTodoLabel = (todoId: string, labelId: string) => setTodoLabel(todoId, labelId, false);

	async function createLabel(boardId: string, name: string, color: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!name.trim()) return { success: false, message: 'Label name is required' };

		try {
			const newLabel = await call('createLabel', { boardId, name: name.trim(), color });
			return { success: true, message: 'Label created successfully', data: newLabel };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error creating label';
			console.error('Create label error:', error);
			return { success: false, message };
		}
	}

	async function updateLabel(
		labelId: string,
		updates: { name?: string; color?: string }
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const updatedLabel = await call('updateLabel', { id: labelId, set: updates });
			return { success: true, message: 'Label updated successfully', data: updatedLabel };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error updating label';
			console.error('Update label error:', error);
			return { success: false, message };
		}
	}

	async function deleteLabel(labelId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const { deleted } = await call('deleteLabel', { id: labelId });
			if (deleted) {
				return { success: true, message: 'Label deleted successfully' };
			}

			return { success: false, message: 'Failed to delete label' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error deleting label';
			console.error('Delete label error:', error);
			return { success: false, message };
		}
	}

	return {
		addTodoLabel,
		removeTodoLabel,
		createLabel,
		updateLabel,
		deleteLabel
	};
}

export const labelsStore = createLabelsStore();
