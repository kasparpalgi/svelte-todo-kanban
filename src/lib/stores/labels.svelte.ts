/** @file src/lib/stores/labels.svelte.ts */
import {
	ADD_TODO_LABEL,
	REMOVE_TODO_LABEL,
	CREATE_LABEL,
	UPDATE_LABEL,
	DELETE_LABEL
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	AddTodoLabelMutation,
	RemoveTodoLabelMutation,
	CreateLabelMutation,
	UpdateLabelMutation,
	DeleteLabelMutation
} from '$lib/graphql/generated/graphql';
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
			const data: CreateLabelMutation = await request(CREATE_LABEL, {
				objects: [
					{
						board_id: boardId,
						name: name.trim(),
						color: color
					}
				]
			});

			const newLabel = data.insert_labels?.returning?.[0];
			if (newLabel) {
				return {
					success: true,
					message: 'Label created successfully',
					data: newLabel
				};
			}

			return { success: false, message: 'Failed to create label' };
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
			const data: UpdateLabelMutation = await request(UPDATE_LABEL, {
				where: { id: { _eq: labelId } },
				_set: updates
			});

			const updatedLabel = data.update_labels?.returning?.[0];
			if (updatedLabel) {
				return {
					success: true,
					message: 'Label updated successfully',
					data: updatedLabel
				};
			}

			return { success: false, message: 'Failed to update label' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error updating label';
			console.error('Update label error:', error);
			return { success: false, message };
		}
	}

	async function deleteLabel(labelId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: DeleteLabelMutation = await request(DELETE_LABEL, {
				where: { id: { _eq: labelId } }
			});

			if (data.delete_labels?.affected_rows && data.delete_labels.affected_rows > 0) {
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
