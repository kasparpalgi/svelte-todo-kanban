/** @file src/lib/stores/boardMembers.svelte.ts */
import { SEARCH_USERS } from '$lib/graphql/documents';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { call } from '$lib/api/call';
import { locale } from '$lib/i18n';
import { displayMessage } from './errorSuccess.svelte';
import type {
	SearchUsersQuery,
	BoardMemberFieldsFragment,
	BoardInvitationFieldsFragment
} from '$lib/graphql/generated/graphql';
import type { BoardMembersState, BoardStoreResultGeneric } from '$lib/types/listBoard';

function createBoardMembersStore() {
	const state = $state<BoardMembersState>({
		members: [],
		invitations: [],
		loading: false,
		error: null
	});

	async function loadMembers(boardId: string): Promise<BoardMemberFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			state.members = await call('getBoardMembers', { boardId });
			return state.members;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading members';
			state.error = message;
			console.error('Load members error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function inviteUser(
		boardId: string,
		emailOrUsername: string,
		role: 'editor' | 'viewer'
	): Promise<BoardStoreResultGeneric<BoardInvitationFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!emailOrUsername.trim())
			return { success: false, message: 'Email or username is required' };

		// Free plan: cap collaborators per board. Count current non-owner members plus
		// pending invitations; surfaced only when the limit is hit (soft upsell).
		const { userStore } = await import('./user.svelte');
		const { isPaid, FREE_LIMITS } = await import('$lib/config/plan');
		if (!isPaid(userStore.user)) {
			const nonOwnerMembers = state.members.filter((m) => m.role !== 'owner').length;
			const collaborators = nonOwnerMembers + state.invitations.length;
			if (collaborators >= FREE_LIMITS.collaboratorsPerBoard) {
				const { upgradeStore } = await import('./upgrade.svelte');
				upgradeStore.trigger('collaborators');
				return { success: false, message: 'Collaborator limit reached', upsell: true };
			}
		}

		try {
			const isEmail = emailOrUsername.includes('@');
			const newInvitation = await call('createBoardInvitation', {
				boardId,
				invitee: emailOrUsername.trim(),
				role
			});

			state.invitations = [...state.invitations, newInvitation];

			if (isEmail && newInvitation.board && newInvitation.token) {
				try {
					const inviterName = newInvitation.inviter?.name || newInvitation.inviter?.username;
					const boardName = newInvitation.board.name;
					const inviteeEmail = emailOrUsername.trim();
					// Carry the invitation token + invitee email so the sign-in page can
					// lock the account to the invited address and, once authenticated,
					// route through /invite/<token> to auto-accept and land on the board.
					const invitationUrl =
						`${window.location.origin}/signin?invite=${encodeURIComponent(newInvitation.token)}` +
						`&email=${encodeURIComponent(inviteeEmail)}`;
					const currentLocale = get(locale);

					await fetch('/api/invitations/send', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							inviteeEmail: emailOrUsername.trim(),
							boardName,
							inviterName,
							invitationUrl,
							locale: currentLocale
						})
					});
				} catch (emailError) {
					console.error('Failed to send invitation email:', emailError);
				}
			}

			return {
				success: true,
				message: 'Invitation sent successfully',
				data: newInvitation
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error sending invitation';
			console.error('Invite user error:', error);
			console.error('Error details:', JSON.stringify(error, null, 2));
			return { success: false, message };
		}
	}

	async function updateMemberRole(
		memberId: string,
		role: 'owner' | 'editor' | 'viewer'
	): Promise<BoardStoreResultGeneric<BoardMemberFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const memberIndex = state.members.findIndex((m) => m.id === memberId);
		const originalMember = memberIndex !== -1 ? { ...state.members[memberIndex] } : null;

		if (memberIndex !== -1) {
			state.members[memberIndex] = { ...state.members[memberIndex], role };
		}

		try {
			const updatedMember = await call('updateBoardMember', { id: memberId, role });
			if (memberIndex !== -1) state.members[memberIndex] = updatedMember;
			return { success: true, message: 'Member role updated', data: updatedMember };
		} catch (error) {
			if (memberIndex !== -1 && originalMember) {
				state.members[memberIndex] = originalMember;
			}
			const message = error instanceof Error ? error.message : 'Error updating member role';
			console.error('Update member role error:', error);
			return { success: false, message };
		}
	}

	async function removeMember(memberId: string): Promise<BoardStoreResultGeneric> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalMembers = [...state.members];
		state.members = state.members.filter((m) => m.id !== memberId);

		try {
			const { deleted } = await call('removeBoardMember', { id: memberId });
			if (deleted) {
				return { success: true, message: 'Member removed successfully' };
			}

			state.members = originalMembers;
			return { success: false, message: 'Failed to remove member' };
		} catch (error) {
			state.members = originalMembers;
			const message = error instanceof Error ? error.message : 'Error removing member';
			console.error('Remove member error:', error);
			return { success: false, message };
		}
	}

	async function loadInvitations(boardId: string): Promise<BoardInvitationFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			state.invitations = await call('getBoardInvitations', { boardId });
			return state.invitations;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading invitations';
			state.error = message;
			console.error('Load invitations error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function cancelInvitation(invitationId: string): Promise<BoardStoreResultGeneric> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalInvitations = [...state.invitations];
		state.invitations = state.invitations.filter((i) => i.id !== invitationId);

		try {
			const { deleted } = await call('cancelInvitation', { id: invitationId });
			if (deleted) {
				return { success: true, message: 'Invitation cancelled' };
			}

			state.invitations = originalInvitations;
			return { success: false, message: 'Failed to cancel invitation' };
		} catch (error) {
			state.invitations = originalInvitations;
			const message = error instanceof Error ? error.message : 'Error cancelling invitation';
			console.error('Cancel invitation error:', error);
			return { success: false, message };
		}
	}

	async function searchUsers(searchTerm: string): Promise<SearchUsersQuery['users']> {
		if (!browser) return [];
		if (!searchTerm.trim()) return [];

		try {
			const data: SearchUsersQuery = await request(SEARCH_USERS, {
				search: `%${searchTerm.trim()}%`
			});

			return data.users || [];
		} catch (error) {
			console.error('Search users error:', error);
			displayMessage('Error searching users');
			return [];
		}
	}

	return {
		get members() {
			return state.members;
		},
		get invitations() {
			return state.invitations;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},

		loadMembers,
		inviteUser,
		updateMemberRole,
		removeMember,
		loadInvitations,
		cancelInvitation,
		searchUsers,

		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.members = [];
			state.invitations = [];
			state.loading = false;
			state.error = null;
		}
	};
}

export const boardMembersStore = createBoardMembersStore();
