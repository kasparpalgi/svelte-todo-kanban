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

export interface TodoEditProps {
	todo: TodoFieldsFragment;
	editData: any;
	validationErrors: Record<string, string>;
	images: TodoImage[];
	isDragOver: boolean;
	isSubmitting: boolean;
	onSave: () => Promise<void>;
	onCancel: () => void;
	onKeydown: (event: KeyboardEvent) => void;
	onDragOver: (event: DragEvent) => void;
	onDragLeave: (event: DragEvent) => void;
	onDrop: (event: DragEvent) => void;
	onFileSelect: (event: Event) => void;
	onRemoveImage: (id: string) => void;
	fileInput: HTMLInputElement | undefined;
}

type TodoImage = { id: string; file: File | null; preview: string; isExisting?: boolean };