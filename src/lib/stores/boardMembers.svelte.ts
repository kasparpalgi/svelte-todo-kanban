/** @file src/lib/stores/boardMembers.svelte.ts */
import {
	GET_BOARD_MEMBERS,
	GET_BOARD_INVITATIONS,
	ADD_BOARD_MEMBER,
	UPDATE_BOARD_MEMBER,
	REMOVE_BOARD_MEMBER,
	CREATE_BOARD_INVITATION,
	UPDATE_BOARD_INVITATION,
	DELETE_BOARD_INVITATION,
	SEARCH_USERS
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetBoardMembersQuery,
	GetBoardInvitationsQuery,
	AddBoardMemberMutation,
	UpdateBoardMemberMutation,
	RemoveBoardMemberMutation,
	CreateBoardInvitationMutation,
	UpdateBoardInvitationMutation,
	DeleteBoardInvitationMutation,
	SearchUsersQuery,
	BoardMemberFieldsFragment,
	BoardInvitationFieldsFragment
} from '$lib/graphql/generated/graphql';
import { displayMessage } from './errorSuccess.svelte';

interface BoardMembersState {
	members: BoardMemberFieldsFragment[];
	invitations: BoardInvitationFieldsFragment[];
	loading: boolean;
	error: string | null;
}

interface StoreResult<T = void> {
	success: boolean;
	message: string;
	data?: T;
}

function createBoardMembersStore() {
	const state = $state<BoardMembersState>({
		members: [],
		invitations: [],
		loading: false,
		error: null
	});

	// ========== Board Members ==========

	async function loadMembers(boardId: string): Promise<BoardMemberFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const data: GetBoardMembersQuery = await request(GET_BOARD_MEMBERS, {
				where: { board_id: { _eq: boardId } },
				order_by: [{ created_at: 'asc' }]
			});

			state.members = data.board_members || [];
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
	): Promise<StoreResult<BoardInvitationFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!emailOrUsername.trim())
			return { success: false, message: 'Email or username is required' };

		try {
			const isEmail = emailOrUsername.includes('@');
			const invitation = {
				board_id: boardId,
				role,
				...(isEmail
					? { invitee_email: emailOrUsername.trim() }
					: { invitee_username: emailOrUsername.trim() })
			};

			const data: CreateBoardInvitationMutation = await request(CREATE_BOARD_INVITATION, {
				objects: [invitation]
			});

			const newInvitation = data.insert_board_invitations?.returning?.[0];
			if (newInvitation) {
				state.invitations = [...state.invitations, newInvitation];

				if (isEmail && newInvitation.board) {
					try {
						const inviterName = newInvitation.inviter?.name || newInvitation.inviter?.username;
						const boardName = newInvitation.board.name;
						const invitationUrl = `${window.location.origin}/signin`;

						await fetch('/api/invitations/send', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								inviteeEmail: emailOrUsername.trim(),
								boardName,
								inviterName,
								invitationUrl
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
			}

			return { success: false, message: 'Failed to send invitation' };
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
	): Promise<StoreResult<BoardMemberFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const memberIndex = state.members.findIndex((m) => m.id === memberId);
		const originalMember = memberIndex !== -1 ? { ...state.members[memberIndex] } : null;

		// Optimistic update
		if (memberIndex !== -1) {
			state.members[memberIndex] = { ...state.members[memberIndex], role };
		}

		try {
			const data: UpdateBoardMemberMutation = await request(UPDATE_BOARD_MEMBER, {
				where: { id: { _eq: memberId } },
				_set: { role }
			});

			const updatedMember = data.update_board_members?.returning?.[0];
			if (updatedMember) {
				if (memberIndex !== -1) {
					state.members[memberIndex] = updatedMember;
				}
				return {
					success: true,
					message: 'Member role updated',
					data: updatedMember
				};
			} else {
				if (memberIndex !== -1 && originalMember) {
					state.members[memberIndex] = originalMember;
				}
				return { success: false, message: 'Failed to update member role' };
			}
		} catch (error) {
			if (memberIndex !== -1 && originalMember) {
				state.members[memberIndex] = originalMember;
			}
			const message = error instanceof Error ? error.message : 'Error updating member role';
			console.error('Update member role error:', error);
			return { success: false, message };
		}
	}

	async function removeMember(memberId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalMembers = [...state.members];
		// Optimistic update
		state.members = state.members.filter((m) => m.id !== memberId);

		try {
			const data: RemoveBoardMemberMutation = await request(REMOVE_BOARD_MEMBER, {
				where: { id: { _eq: memberId } }
			});

			if (data.delete_board_members?.affected_rows && data.delete_board_members.affected_rows > 0) {
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

	// ========== Board Invitations ==========

	async function loadInvitations(boardId: string): Promise<BoardInvitationFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const data: GetBoardInvitationsQuery = await request(GET_BOARD_INVITATIONS, {
				where: { board_id: { _eq: boardId } },
				order_by: [{ created_at: 'desc' }]
			});

			state.invitations = data.board_invitations || [];
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

	async function cancelInvitation(invitationId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalInvitations = [...state.invitations];
		// Optimistic update
		state.invitations = state.invitations.filter((i) => i.id !== invitationId);

		try {
			const data: DeleteBoardInvitationMutation = await request(DELETE_BOARD_INVITATION, {
				where: { id: { _eq: invitationId } }
			});

			if (
				data.delete_board_invitations?.affected_rows &&
				data.delete_board_invitations.affected_rows > 0
			) {
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

	// ========== User Search ==========

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

	// ========== Public API ==========

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
