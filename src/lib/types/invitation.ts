import type { BoardInvitationFieldsFragment } from "$lib/graphql/generated/graphql";

export interface InvitationsState {
	myInvitations: BoardInvitationFieldsFragment[];
	loading: boolean;
	error: string | null;
}

export interface StoreResult {
	success: boolean;
	message: string;
}