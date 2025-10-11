import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
import type { TodoImage } from './imageUpload';

export interface TodosState {
	todos: TodoFieldsFragment[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

export interface StoreResult<T = any> {
	success: boolean;
	message: string;
	data?: T;
}

export interface CanbanColumnProps {
	list: {
		id: string;
		name: string;
		sort_order: number;
		board?: { id: string; name: string; alias: string; sort_order: number; github?: string | null } | null;
	};
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

export type DragHandleProps = {
	attributes: Record<string, any>;
	listeners: Record<string, any>;
	isVisible?: boolean;
};

// Store results

export interface TodoStoreResult {
	success: boolean;
	message: string;
	data?: TodoFieldsFragment;
}

export interface GenericStoreResult {
	success: boolean;
	message: string;
}

export interface LabelManagementProps {
	todo: TodoFieldsFragment;
}