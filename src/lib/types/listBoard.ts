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
