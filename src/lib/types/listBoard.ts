import type { BoardFieldsFragment, ListFieldsFragment } from '$lib/graphql/generated/graphql';

export interface ListBoardStoreResult<T = any> {
	success: boolean;
	message: string;
	data?: T;
}

export interface ListsState {
	lists: ListFieldsFragment[];
	boards: BoardFieldsFragment[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

export interface ListStoreResult {
	success: boolean;
	message: string;
	data?: ListFieldsFragment;
}

export interface BoardStoreResult {
	success: boolean;
	message: string;
	data?: BoardFieldsFragment;
}

export interface GithubRepoSelectorProps {
	open: boolean;
	currentRepo?: string | null;
	onSelect: (repo: string | null) => void;
}

export interface MembersProps {
	board: BoardFieldsFragment;
	open: boolean;
	onClose: () => void;
}

export interface VisibilityProps {
	board: BoardFieldsFragment;
	open: boolean;
	onClose: () => void;
}