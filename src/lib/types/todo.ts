import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
import type { TodoImage } from './imageUpload';

export type Priority = 'low' | 'medium' | 'high';

export type AgentModel = 'fable' | 'opus' | 'sonnet' | 'haiku' | 'gemini';
export type AgentEffort = 'low' | 'medium' | 'high';

export type { AgentMachine } from '$lib/utils/agentMachine';

/**
 * A card as the board holds it: the light TodoFields (#211). `content` is the full body,
 * there only once the card was opened, edited or saved — the face uses `content_preview`.
 */
export type BoardTodo = TodoFieldsFragment & { content?: string | null };

export interface TodosState {
	todos: BoardTodo[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
	currentBoardId: string | null;
}

export interface StoreResult<T = any> {
	success: boolean;
	message: string;
	data?: T;
	/** Set when the failure is a free-plan limit that triggered the upgrade dialog. */
	upsell?: boolean;
}

/** Keyboard reordering directions: up/down within a list, left/right across lists. */
export type CardMoveDirection = 'up' | 'down' | 'left' | 'right';

export interface TodoItemProps {
	todo: BoardTodo;
	draggedTodo: BoardTodo | null;
	isDragging?: boolean;
	showDropAbove?: boolean;
	listId: string;
	onDragStart: (todo: BoardTodo) => void;
	onDragEnd: () => void;
	onMoveCard?: (todo: BoardTodo, direction: CardMoveDirection) => void;
	onDelete: (todoId: string) => void;
}

export interface TodoEditProps {
	todo: BoardTodo;
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

export type CardDetailViewProps = {
	todo: BoardTodo;
	lang: string;
	onClose: () => void;
};

export type KanbanColumnProps = {
	list: { id: string; name: string; board?: { github?: string } };
	todos: BoardTodo[];
	draggedTodo: BoardTodo | null;
	dropTarget: {
		listId: string;
		index: number;
		position: 'above' | 'below';
	} | null;
	onDragStart: (todo: BoardTodo) => void;
	onDragEnd: () => void;
	onMoveCard?: (todo: BoardTodo, direction: CardMoveDirection) => void;
	onDelete: (todoId: string) => void;
};

// Store results

export interface LabelManagementProps {
	todo: BoardTodo;
}

export interface CardImageProps {
	todoId: string;
	initialImages?: TodoImage[];
	/** Viewers: no upload or delete (#239). */
	readOnly?: boolean;
}
