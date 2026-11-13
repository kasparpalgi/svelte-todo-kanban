/** @file src/lib/stores/__tests__/listsBoards-archive.test.ts */
import { listsStore } from '../listsBoards.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BoardFieldsFragment } from '$lib/graphql/generated/graphql';

vi.mock('$env/static/public', () => ({
	PUBLIC_API_ENDPOINT: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENDPOINT_DEV: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENV: 'development'
}));

vi.mock('$lib/api/call', () => ({
	call: vi.fn()
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
		whenReady: async () => null,
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

	// The scope itself (own, member, invited; never strangers' public boards) is
	// built on the server: see getBoards in src/lib/server/ops/__tests__/boards.test.ts.
	describe('loadBoards', () => {
		it('loads the switcher boards from the data API', async () => {
			const board = createMockBoard();
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValue([board]);

			await listsStore.loadBoards();

			expect(call).toHaveBeenCalledWith('getBoards', {});
			expect(listsStore.boards).toEqual([board]);
		});

		it('returns nothing and does not query when there is no signed-in user', async () => {
			const userModule = await import('../user.svelte');
			const original = userModule.userStore.user;
			// @ts-expect-error test override of the mocked getter value
			userModule.userStore.user = null;

			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValue([createMockBoard()]);

			const result = await listsStore.loadBoards();

			expect(call).not.toHaveBeenCalled();
			expect(result).toEqual([]);
			expect(listsStore.boards).toEqual([]);

			// @ts-expect-error restore the mocked getter value
			userModule.userStore.user = original;
		});
	});

	describe('loadArchivedBoards', () => {
		it('loads scoped archived boards and stores them separately', async () => {
			const archivedBoard = createMockBoard({ id: 'board-2', archived_at: '2025-06-01T00:00:00Z' });
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValue([archivedBoard]);

			await listsStore.loadArchivedBoards();

			expect(call).toHaveBeenCalledWith('getBoards', { archived: true });
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
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValue(publicBoard);

			const board = await listsStore.loadBoardByAlias('ftwbihss-board');

			expect(call).toHaveBeenCalledWith('getBoard', { alias: 'ftwbihss-board' });
			expect(board).toEqual(publicBoard);
			// Selected for viewing, but NOT added to the switcher list.
			expect(listsStore.selectedBoard).toEqual(publicBoard);
			expect(listsStore.boards).toEqual([]);
		});
	});

	describe('boardById', () => {
		it('finds a card board by id, including a viewed public board (#222)', async () => {
			const publicBoard = createMockBoard({ id: 'board-9', is_public: true });
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValue(publicBoard);
			await listsStore.loadBoardByAlias('test-board');

			expect(listsStore.boardById('board-9')).toEqual(publicBoard);
			expect(listsStore.boardById('missing')).toBeUndefined();
			expect(listsStore.boardById(null)).toBeUndefined();
		});
	});

	describe('archiveBoard', () => {
		it('optimistically moves the board from boards to archivedBoards on success', async () => {
			const board = createMockBoard();
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValueOnce([board]);
			await listsStore.loadBoards();

			const archivedReturn = { ...board, archived_at: '2025-06-01T00:00:00Z' };
			vi.mocked(call).mockResolvedValueOnce(archivedReturn);

			const result = await listsStore.archiveBoard(board.id);

			expect(result.success).toBe(true);
			expect(listsStore.boards).toEqual([]);
			expect(listsStore.archivedBoards).toEqual([archivedReturn]);
		});

		it('rolls back to boards and clears archivedBoards on failure', async () => {
			const board = createMockBoard();
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValueOnce([board]);
			await listsStore.loadBoards();

			vi.mocked(call).mockRejectedValueOnce(new Error('network error'));

			const result = await listsStore.archiveBoard(board.id);

			expect(result.success).toBe(false);
			expect(listsStore.boards).toEqual([board]);
			expect(listsStore.archivedBoards).toEqual([]);
		});
	});

	describe('restoreBoard', () => {
		it('optimistically moves the board from archivedBoards to boards on success', async () => {
			const archivedBoard = createMockBoard({ archived_at: '2025-06-01T00:00:00Z' });
			const { call } = await import('$lib/api/call');
			vi.mocked(call).mockResolvedValueOnce([archivedBoard]);
			await listsStore.loadArchivedBoards();

			const restoredReturn = { ...archivedBoard, archived_at: null };
			vi.mocked(call).mockResolvedValueOnce(restoredReturn);

			const result = await listsStore.restoreBoard(archivedBoard.id);

			expect(result.success).toBe(true);
			expect(listsStore.archivedBoards).toEqual([]);
			expect(listsStore.boards).toEqual([restoredReturn]);
		});
	});
});
