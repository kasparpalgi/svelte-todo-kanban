/** @file src/lib/stores/__tests__/listsBoards-archive.test.ts */
import { listsStore } from '../listsBoards.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BoardFieldsFragment } from '$lib/graphql/generated/graphql';

vi.mock('$env/static/public', () => ({
	PUBLIC_API_ENDPOINT: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENDPOINT_DEV: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENV: 'development'
}));

vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('../user.svelte', () => ({
	userStore: {
		user: { id: 'user-1', settings: {} },
		updateUser: vi.fn()
	}
}));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();
vi.stubGlobal('localStorage', localStorageMock);

const createMockBoard = (overrides: Partial<BoardFieldsFragment> = {}): BoardFieldsFragment => ({
	id: 'board-1',
	name: 'Test Board',
	alias: 'test-board',
	sort_order: 1,
	github: null,
	is_public: false,
	allow_public_comments: false,
	settings: null,
	archived_at: null,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
	labels: [],
	user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
	board_members: [],
	__typename: 'boards',
	...overrides
});

describe('ListsStore - archive boards', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		listsStore.reset();
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// The mocked user has no email/username, so the scope covers owner + membership.
	const ownerOrMemberScope = {
		_or: [{ user_id: { _eq: 'user-1' } }, { board_members: { user_id: { _eq: 'user-1' } } }]
	};

	describe('loadBoards', () => {
		it('excludes archived boards and scopes to the user (issue #192 — no public leak)', async () => {
			const board = createMockBoard();
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [board] });

			await listsStore.loadBoards();

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					where: { _and: [{ archived_at: { _is_null: true } }, ownerOrMemberScope] }
				})
			);
			expect(listsStore.boards).toEqual([board]);
		});

		it('includes invitation conditions when the user has email/username', async () => {
			const userModule = await import('../user.svelte');
			const original = userModule.userStore.user;
			// @ts-expect-error test override of the mocked getter value
			userModule.userStore.user = {
				id: 'user-1',
				email: 'kaspar@e-stonia.co.uk',
				username: 'kaspar1',
				settings: {}
			};

			const board = createMockBoard();
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [board] });

			await listsStore.loadBoards();

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					where: {
						_and: [
							{ archived_at: { _is_null: true } },
							{
								_or: [
									{ user_id: { _eq: 'user-1' } },
									{ board_members: { user_id: { _eq: 'user-1' } } },
									{
										board_invitations: {
											_or: [
												{ invitee_email: { _eq: 'kaspar@e-stonia.co.uk' } },
												{ invitee_username: { _eq: 'kaspar1' } }
											]
										}
									}
								]
							}
						]
					}
				})
			);

			// @ts-expect-error restore the mocked getter value
			userModule.userStore.user = original;
		});

		it('returns nothing and does not query when there is no signed-in user', async () => {
			const userModule = await import('../user.svelte');
			const original = userModule.userStore.user;
			// @ts-expect-error test override of the mocked getter value
			userModule.userStore.user = null;

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [createMockBoard()] });

			const result = await listsStore.loadBoards();

			expect(request).not.toHaveBeenCalled();
			expect(result).toEqual([]);
			expect(listsStore.boards).toEqual([]);

			// @ts-expect-error restore the mocked getter value
			userModule.userStore.user = original;
		});
	});

	describe('loadArchivedBoards', () => {
		it('loads scoped archived boards and stores them separately', async () => {
			const archivedBoard = createMockBoard({ id: 'board-2', archived_at: '2025-06-01T00:00:00Z' });
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [archivedBoard] });

			await listsStore.loadArchivedBoards();

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					where: { _and: [{ archived_at: { _is_null: false } }, ownerOrMemberScope] }
				})
			);
			expect(listsStore.archivedBoards).toEqual([archivedBoard]);
		});
	});

	describe('loadBoardByAlias', () => {
		it('fetches a single public board by alias and selects it', async () => {
			const publicBoard = createMockBoard({
				id: 'board-9',
				alias: 'ftwbihss-board',
				is_public: true,
				user: { id: 'someone-else', username: 'ftwbihs', email: 'ftwbihs@yandex.by' }
			});
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [publicBoard] });

			const board = await listsStore.loadBoardByAlias('ftwbihss-board');

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ where: { alias: { _eq: 'ftwbihss-board' } }, limit: 1 })
			);
			expect(board).toEqual(publicBoard);
			// Selected for viewing, but NOT added to the switcher list.
			expect(listsStore.selectedBoard).toEqual(publicBoard);
			expect(listsStore.boards).toEqual([]);
		});
	});

	describe('archiveBoard', () => {
		it('optimistically moves the board from boards to archivedBoards on success', async () => {
			const board = createMockBoard();
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({ boards: [board] });
			await listsStore.loadBoards();

			const archivedReturn = { ...board, archived_at: '2025-06-01T00:00:00Z' };
			vi.mocked(request).mockResolvedValueOnce({
				update_boards: { affected_rows: 1, returning: [archivedReturn] }
			});

			const result = await listsStore.archiveBoard(board.id);

			expect(result.success).toBe(true);
			expect(listsStore.boards).toEqual([]);
			expect(listsStore.archivedBoards).toEqual([archivedReturn]);
		});

		it('rolls back to boards and clears archivedBoards on failure', async () => {
			const board = createMockBoard();
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({ boards: [board] });
			await listsStore.loadBoards();

			vi.mocked(request).mockRejectedValueOnce(new Error('network error'));

			const result = await listsStore.archiveBoard(board.id);

			expect(result.success).toBe(false);
			expect(listsStore.boards).toEqual([board]);
			expect(listsStore.archivedBoards).toEqual([]);
		});
	});

	describe('restoreBoard', () => {
		it('optimistically moves the board from archivedBoards to boards on success', async () => {
			const archivedBoard = createMockBoard({ archived_at: '2025-06-01T00:00:00Z' });
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({ boards: [archivedBoard] });
			await listsStore.loadArchivedBoards();

			const restoredReturn = { ...archivedBoard, archived_at: null };
			vi.mocked(request).mockResolvedValueOnce({
				update_boards: { affected_rows: 1, returning: [restoredReturn] }
			});

			const result = await listsStore.restoreBoard(archivedBoard.id);

			expect(result.success).toBe(true);
			expect(listsStore.archivedBoards).toEqual([]);
			expect(listsStore.boards).toEqual([restoredReturn]);
		});
	});
});
