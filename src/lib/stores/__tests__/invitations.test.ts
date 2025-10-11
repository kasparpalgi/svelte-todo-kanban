/** @file src/lib/stores/__tests__/invitations.test.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invitationsStore } from '../invitations.svelte';

// Mock the GraphQL client
vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

// Mock the user store
vi.mock('../user.svelte', () => ({
	userStore: {
		user: {
			id: 'user-123',
			email: 'test@example.com',
			username: 'testuser'
		}
	}
}));

describe('invitationsStore', () => {
	beforeEach(() => {
		// Reset store state
		invitationsStore.reset();
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should have empty invitations array initially', () => {
			expect(invitationsStore.myInvitations).toEqual([]);
		});

		it('should not be loading initially', () => {
			expect(invitationsStore.loading).toBe(false);
		});

		it('should have no errors initially', () => {
			expect(invitationsStore.error).toBe(null);
		});

		it('should have pending count of 0 initially', () => {
			expect(invitationsStore.pendingCount).toBe(0);
		});
	});

	describe('Store Methods', () => {
		it('should have loadMyInvitations method', () => {
			expect(typeof invitationsStore.loadMyInvitations).toBe('function');
		});

		it('should have acceptInvitation method', () => {
			expect(typeof invitationsStore.acceptInvitation).toBe('function');
		});

		it('should have declineInvitation method', () => {
			expect(typeof invitationsStore.declineInvitation).toBe('function');
		});

		it('should have clearError method', () => {
			expect(typeof invitationsStore.clearError).toBe('function');
		});

		it('should have reset method', () => {
			expect(typeof invitationsStore.reset).toBe('function');
		});
	});

	describe('Store Getters', () => {
		it('should expose myInvitations getter', () => {
			expect(invitationsStore).toHaveProperty('myInvitations');
		});

		it('should expose loading getter', () => {
			expect(invitationsStore).toHaveProperty('loading');
		});

		it('should expose error getter', () => {
			expect(invitationsStore).toHaveProperty('error');
		});

		it('should expose pendingCount getter', () => {
			expect(invitationsStore).toHaveProperty('pendingCount');
		});
	});

	describe('Reset Functionality', () => {
		it('should reset all state when reset is called', () => {
			// Store would be modified by operations, then reset should clear it
			invitationsStore.reset();

			expect(invitationsStore.myInvitations).toEqual([]);
			expect(invitationsStore.loading).toBe(false);
			expect(invitationsStore.error).toBe(null);
		});
	});

	describe('Error Handling', () => {
		it('should clear errors when clearError is called', () => {
			invitationsStore.clearError();
			expect(invitationsStore.error).toBe(null);
		});
	});
});
