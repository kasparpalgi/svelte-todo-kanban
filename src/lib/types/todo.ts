import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

export interface TodosState {
	todos: TodoFieldsFragment[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

export interface StoreResult {
	success: boolean;
	message: string;
	data?: TodoFieldsFragment;
}

export interface CanbanColumnProps {
	list: { id: string; name: string; sort_order: number };
	todos: TodoFieldsFragment[];
	isHighlighted?: boolean;
}

export interface TodoItemProps {
	todo: TodoFieldsFragment;
	isDragging?: boolean;
}