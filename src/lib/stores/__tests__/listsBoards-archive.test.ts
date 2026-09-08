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

vi.mock('./user.svelte', () => ({
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

	describe('loadBoards', () => {
		it('excludes archived boards and filters with archived_at is_null', async () => {
			const board = createMockBoard();
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [board] });

			await listsStore.loadBoards();

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ where: { archived_at: { _is_null: true } } })
			);
			expect(listsStore.boards).toEqual([board]);
		});
	});

	describe('loadArchivedBoards', () => {
		it('loads boards with archived_at set and stores them separately', async () => {
			const archivedBoard = createMockBoard({ id: 'board-2', archived_at: '2025-06-01T00:00:00Z' });
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ boards: [archivedBoard] });

			await listsStore.loadArchivedBoards();

			expect(request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ where: { archived_at: { _is_null: false } } })
			);
			expect(listsStore.archivedBoards).toEqual([archivedBoard]);
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
