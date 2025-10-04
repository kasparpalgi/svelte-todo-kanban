/** @file src/lib/stores/invitations.svelte.ts */
import {
	GET_MY_INVITATIONS,
	UPDATE_BOARD_INVITATION,
	ADD_BOARD_MEMBER
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import { userStore } from './user.svelte';
import type {
	GetMyInvitationsQuery,
	UpdateBoardInvitationMutation,
	AddBoardMemberMutation,
	BoardInvitationFieldsFragment
} from '$lib/graphql/generated/graphql';
import type { InvitationsState, StoreResult } from '$lib/types/invitation';

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
			console.log('=== ACCEPTING INVITATION ===');
			console.log('Invitation ID:', invitationId);
			console.log('Board ID:', invitation.board_id);
			console.log('User ID:', user.id);
			console.log('Role:', invitation.role);
			console.log('Step 1: Creating board member...');

			const memberData: AddBoardMemberMutation = await request(ADD_BOARD_MEMBER, {
				objects: [
					{
						board_id: invitation.board_id,
						user_id: user.id,
						role: invitation.role
					}
				]
			});

			console.log('Board member mutation result:', memberData);
			console.log('Affected rows:', memberData.insert_board_members?.affected_rows);
			console.log('Returning:', memberData.insert_board_members?.returning);
			console.log('Step 2: Updating invitation status...');
			const invitationData: UpdateBoardInvitationMutation = await request(UPDATE_BOARD_INVITATION, {
				where: { id: { _eq: invitationId } },
				_set: { status: 'accepted' }
			});

			console.log('Invitation update mutation result:', invitationData);
			console.log('Update affected rows:', invitationData?.update_board_invitations?.affected_rows);
			console.log('Update returning:', invitationData?.update_board_invitations?.returning);

			const updateSuccess = invitationData?.update_board_invitations?.affected_rows &&
			                      invitationData.update_board_invitations.affected_rows > 0;

			console.log('Update success check:', updateSuccess);

			if (updateSuccess) {
				console.log('✓ Invitation accepted successfully');
				state.myInvitations = state.myInvitations.filter((i) => i.id !== invitationId);
				return { success: true, message: 'Invitation accepted' };
			}

			console.error('✗ Invitation status update failed');
			console.error('Full invitationData object:', JSON.stringify(invitationData, null, 2));
			return { success: false, message: 'Failed to update invitation status' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error accepting invitation';
			console.error('✗ Accept invitation error:', error);
			console.error('Error details:', JSON.stringify(error, null, 2));
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

	const pendingCount = $derived(state.myInvitations.length);

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
