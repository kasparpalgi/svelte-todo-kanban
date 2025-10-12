import type { BoardInvitationFieldsFragment } from "$lib/graphql/generated/graphql";

export interface InvitationsState {
	myInvitations: BoardInvitationFieldsFragment[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

export interface StoreResult {
	success: boolean;
	message: string;
}