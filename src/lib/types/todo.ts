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
