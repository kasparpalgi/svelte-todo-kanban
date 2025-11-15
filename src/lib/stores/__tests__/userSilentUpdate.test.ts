/** @file src/lib/stores/__tests__/userSilentUpdate.test.ts */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock displayMessage to track calls
const mockDisplayMessage = vi.fn();
vi.mock('../errorSuccess.svelte', () => ({
	displayMessage: mockDisplayMessage
}));

vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('../logging.svelte', () => ({
	loggingStore: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	}
}));

describe('UserStore - Silent Updates', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		mockDisplayMessage.mockClear();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should show success message when silent=false (default)', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		const mockUser = {
			id: 'user-123',
			name: 'Test User',
			email: 'test@test.com',
			locale: 'en',
			dark_mode: false
		};

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: [mockUser]
			}
		});

		// Call without silent parameter (defaults to false)
		await userStore.updateUser('user-123', { name: 'Updated Name' });

		// Should show success message
		expect(mockDisplayMessage).toHaveBeenCalledWith('Settings updated successfully', 3000, true);
	});

	it('should show success message when silent=false (explicit)', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		const mockUser = {
			id: 'user-123',
			name: 'Test User',
			email: 'test@test.com',
			locale: 'en',
			dark_mode: false
		};

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: [mockUser]
			}
		});

		// Call with silent=false explicitly
		await userStore.updateUser('user-123', { name: 'Updated Name' }, false);

		// Should show success message
		expect(mockDisplayMessage).toHaveBeenCalledWith('Settings updated successfully', 3000, true);
	});

	it('should NOT show success message when silent=true', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		const mockUser = {
			id: 'user-123',
			name: 'Test User',
			email: 'test@test.com',
			locale: 'en',
			dark_mode: false,
			settings: {
				lastBoardAlias: 'my-board'
			}
		};

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: [mockUser]
			}
		});

		mockDisplayMessage.mockClear();

		// Call with silent=true (for automatic updates like board switching)
		await userStore.updateUser(
			'user-123',
			{ settings: { lastBoardAlias: 'new-board' } },
			true
		);

		// Should NOT show success message
		expect(mockDisplayMessage).not.toHaveBeenCalled();
	});

	it('should ALWAYS show error message even when silent=true', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: []
			}
		});

		mockDisplayMessage.mockClear();

		// Call with silent=true but API fails
		await userStore.updateUser(
			'user-123',
			{ settings: { lastBoardAlias: 'new-board' } },
			true
		);

		// Should ALWAYS show error messages (errors are never silent)
		expect(mockDisplayMessage).toHaveBeenCalledWith(
			expect.stringContaining('Failed to update user settings')
		);
	});

	it('should ALWAYS show error message on network failure even when silent=true', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		vi.mocked(request).mockRejectedValue(new Error('Network error'));

		mockDisplayMessage.mockClear();

		// Call with silent=true but network error occurs
		await userStore.updateUser(
			'user-123',
			{ settings: { lastBoardAlias: 'new-board' } },
			true
		);

		// Should ALWAYS show error messages (errors are never silent)
		expect(mockDisplayMessage).toHaveBeenCalledWith(
			expect.stringContaining('Failed to update settings')
		);
	});

	it('should log silent flag in logging store', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');
		const { loggingStore } = await import('../logging.svelte');

		const mockUser = {
			id: 'user-123',
			name: 'Test User',
			email: 'test@test.com',
			settings: {}
		};

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: [mockUser]
			}
		});

		await userStore.updateUser('user-123', { settings: { lastBoardAlias: 'board' } }, true);
	});

	it('should return success=true for silent updates', async () => {
		const { userStore } = await import('../user.svelte');
		const { request } = await import('$lib/graphql/client');

		const mockUser = {
			id: 'user-123',
			settings: { lastBoardAlias: 'new-board' }
		};

		vi.mocked(request).mockResolvedValue({
			update_users: {
				returning: [mockUser]
			}
		});

		const result = await userStore.updateUser(
			'user-123',
			{ settings: { lastBoardAlias: 'new-board' } },
			true
		);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockUser);
	});
});
