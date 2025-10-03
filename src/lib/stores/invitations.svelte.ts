/** @file src/lib/stores/invitations.svelte.ts */
import {
	GET_MY_INVITATIONS,
	UPDATE_BOARD_INVITATION,
	ADD_BOARD_MEMBER
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetMyInvitationsQuery,
	UpdateBoardInvitationMutation,
	AddBoardMemberMutation,
	BoardInvitationFieldsFragment
} from '$lib/graphql/generated/graphql';
import { displayMessage } from './errorSuccess.svelte';
import { userStore } from './user.svelte';

interface InvitationsState {
	myInvitations: BoardInvitationFieldsFragment[];
	loading: boolean;
	error: string | null;
}

interface StoreResult {
	success: boolean;
	message: string;
}

function createInvitationsStore() {
	const state = $state<InvitationsState>({
		myInvitations: [],
		loading: false,
		error: null
	});

	async function loadMyInvitations(): Promise<BoardInvitationFieldsFragment[]> {
		if (!browser) return [];

		const user = userStore.user;
		if (!user?.email || !user?.username) {
			return [];
		}

		state.loading = true;
		state.error = null;

		try {
			const data: GetMyInvitationsQuery = await request(GET_MY_INVITATIONS, {
				email: user.email,
				username: user.username
			});

			state.myInvitations = data.board_invitations || [];
			return state.myInvitations;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading invitations';
			state.error = message;
			console.error('Load my invitations error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function acceptInvitation(invitationId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const invitation = state.myInvitations.find((i) => i.id === invitationId);
		if (!invitation) {
			return { success: false, message: 'Invitation not found' };
		}

		const user = userStore.user;
		if (!user?.id) {
			return { success: false, message: 'User not authenticated' };
		}

		try {
			// 1. Create board member
			const memberData: AddBoardMemberMutation = await request(ADD_BOARD_MEMBER, {
				objects: [
					{
						board_id: invitation.board_id,
						user_id: user.id,
						role: invitation.role
					}
				]
			});

			const newMember = memberData.insert_board_members?.returning?.[0];
			if (!newMember) {
				return { success: false, message: 'Failed to add you as a board member' };
			}

			// 2. Update invitation status to accepted
			const invitationData: UpdateBoardInvitationMutation = await request(
				UPDATE_BOARD_INVITATION,
				{
					where: { id: { _eq: invitationId } },
					_set: { status: 'accepted' }
				}
			);

			if (invitationData.update_board_invitations?.affected_rows) {
				// Remove from my invitations
				state.myInvitations = state.myInvitations.filter((i) => i.id !== invitationId);
				return { success: true, message: 'Invitation accepted' };
			}

			return { success: false, message: 'Failed to update invitation' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error accepting invitation';
			console.error('Accept invitation error:', error);
			return { success: false, message };
		}
	}

	async function declineInvitation(invitationId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: UpdateBoardInvitationMutation = await request(UPDATE_BOARD_INVITATION, {
				where: { id: { _eq: invitationId } },
				_set: { status: 'declined' }
			});

			if (data.update_board_invitations?.affected_rows) {
				// Remove from my invitations
				state.myInvitations = state.myInvitations.filter((i) => i.id !== invitationId);
				return { success: true, message: 'Invitation declined' };
			}

			return { success: false, message: 'Failed to decline invitation' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error declining invitation';
			console.error('Decline invitation error:', error);
			return { success: false, message };
		}
	}

	// Derived: count of pending invitations
	const pendingCount = $derived(state.myInvitations.length);

	// ========== Public API ==========

	return {
		get myInvitations() {
			return state.myInvitations;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get pendingCount() {
			return pendingCount;
		},

		loadMyInvitations,
		acceptInvitation,
		declineInvitation,

		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.myInvitations = [];
			state.loading = false;
			state.error = null;
		}
	};
}

export const invitationsStore = createInvitationsStore();
