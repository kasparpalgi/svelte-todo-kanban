/** @file src/lib/stores/invitations.svelte.ts */
import { call } from '$lib/api/call';
import { browser } from '$app/environment';
import { userStore } from './user.svelte';
import type { BoardInvitationFieldsFragment } from '$lib/graphql/generated/graphql';
import type { InvitationsState, StoreResult } from '$lib/types/invitation';

function createInvitationsStore() {
	const state = $state<InvitationsState>({
		myInvitations: [],
		loading: false,
		error: null,
		initialized: false
	});

	async function loadMyInvitations(): Promise<BoardInvitationFieldsFragment[]> {
		if (!browser) return [];

		if (!userStore.user?.id) return [];

		if (state.loading) return state.myInvitations;

		state.loading = true;
		state.error = null;

		try {
			state.myInvitations = await call('getMyInvitations', {});
			state.initialized = true;
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

		try {
			// One server op: checks the invitation is pending and the caller's, then joins.
			await call('acceptInvitation', { id: invitationId });
			state.myInvitations = state.myInvitations.filter((i) => i.id !== invitationId);
			return { success: true, message: 'Invitation accepted' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error accepting invitation';
			console.error('Accept invitation error:', error);
			return { success: false, message };
		}
	}

	async function declineInvitation(invitationId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			await call('declineInvitation', { id: invitationId });

			state.myInvitations = state.myInvitations.filter((i) => i.id !== invitationId);
			return { success: true, message: 'Invitation declined' };
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
		get initialized() {
			return state.initialized;
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
			state.initialized = false;
		}
	};
}

export const invitationsStore = createInvitationsStore();
