/** @file src/lib/stores/labels.svelte.ts */
import { ADD_TODO_LABEL, REMOVE_TODO_LABEL } from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { call } from '$lib/api/call';
import { browser } from '$app/environment';
import type { AddTodoLabelMutation, RemoveTodoLabelMutation } from '$lib/graphql/generated/graphql';
import type { StoreResult } from '$lib/types/todo';
import { todosStore } from './todos.svelte';

function createLabelsStore() {
	async function addTodoLabel(todoId: string, labelId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: AddTodoLabelMutation = await request(ADD_TODO_LABEL, {
				objects: [
					{
						todo_id: todoId,
						label_id: labelId
					}
				]
			});

			if (data.insert_todo_labels?.affected_rows && data.insert_todo_labels.affected_rows > 0) {
				await todosStore.refreshTodo(todoId);
				return { success: true, message: 'Label added successfully' };
			}

			return { success: false, message: 'Failed to add label' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error adding label';
			console.error('Add todo label error:', error);
			return { success: false, message };
		}
	}

	async function removeTodoLabel(todoId: string, labelId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: RemoveTodoLabelMutation = await request(REMOVE_TODO_LABEL, {
				where: {
					todo_id: { _eq: todoId },
					label_id: { _eq: labelId }
				}
			});

			if (data.delete_todo_labels?.affected_rows && data.delete_todo_labels.affected_rows > 0) {
				await todosStore.refreshTodo(todoId);
				return { success: true, message: 'Label removed successfully' };
			}

			return { success: false, message: 'Failed to remove label' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error removing label';
			console.error('Remove todo label error:', error);
			return { success: false, message };
		}
	}

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
