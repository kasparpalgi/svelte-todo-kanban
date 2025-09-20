export interface Todo {
	id: string;
	title: string;
	content?: string | null;
	due_on?: string | null;
	sort_order?: number | null;
	completed_at?: string | null;
	list?: { id: string; name: string } | null;
	created_at: string;
	updated_at: string;
}

export interface TodosState {
	todos: Todo[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

export interface StoreResult {
	success: boolean;
	message: string;
}
