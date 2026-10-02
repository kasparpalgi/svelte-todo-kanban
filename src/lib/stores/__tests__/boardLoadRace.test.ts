/** @file src/lib/stores/__tests__/boardLoadRace.test.ts
 * Regression for #206: on a fresh page load the board page asked for boards
 * before the layout had hydrated the user, so the board switcher and the board
 * itself stayed empty until a refresh. Uses the real user store.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET_BOARDS, GET_USERS } from '$lib/graphql/documents';

vi.mock('$env/static/public', () => ({
	PUBLIC_API_ENDPOINT: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENDPOINT_DEV: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENV: 'development'
}));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$lib/graphql/client', () => ({
	request: vi.fn(),
	clearTokenCache: vi.fn(),
	ensureTokenForUser: vi.fn()
}));

vi.mock('../logging.svelte', () => ({
	loggingStore: {
		setUserId: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	}
}));

const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
	getItem: (k: string) => storage[k] ?? null,
	setItem: (k: string, v: string) => (storage[k] = v),
	removeItem: (k: string) => delete storage[k]
});
vi.stubGlobal('document', { documentElement: { classList: { toggle: vi.fn() } } });

const board = {
	id: 'board-1',
	alias: 'my-board',
	name: 'My Board',
	sort_order: 1,
	user: { id: 'user-1', username: 'me' },
	board_members: []
};

describe('board load before user hydration (#206)', () => {
	beforeEach(async () => {
		// loadBoards() lazily imports this large module; a cold import is slow
		// enough to hide the race (which is why the bug was intermittent in prod).
		await import('$lib/graphql/generated/graphql');
		await import('$lib/stores/states.svelte');
		const { userStore } = await import('../user.svelte');
		const { listsStore } = await import('../listsBoards.svelte');
		userStore.reset();
		userStore.clearLogoutFlag();
		listsStore.reset();
		vi.mocked((await import('$lib/graphql/client')).request).mockReset();
	});

	it('waits for the user instead of loading an empty board list', async () => {
		const { request } = await import('$lib/graphql/client');
		const { userStore } = await import('../user.svelte');
		const { listsStore } = await import('../listsBoards.svelte');

		vi.mocked(request).mockImplementation(async (doc: unknown) => {
			if (doc === GET_USERS) {
				return { users: [{ id: 'user-1', email: 'me@example.com', username: 'me' }] };
			}
			if (doc === GET_BOARDS) return { boards: [board] };
			throw new Error('unexpected request');
		});

		// Board page onMount runs before the layout's user request returns: the
		// load must stay pending rather than settle with an empty list.
		const boardsPromise = listsStore.loadBoards();
		const early = await Promise.race([
			boardsPromise.then(() => 'settled'),
			new Promise((resolve) => setTimeout(() => resolve('pending'), 100))
		]);
		expect(early).toBe('pending');

		await userStore.initializeUser({ id: 'user-1' });

		expect(await boardsPromise).toEqual([board]);
		expect(listsStore.boards).toEqual([board]);
		expect(listsStore.boardsInitialized).toBe(true);
		expect(request).toHaveBeenCalledWith(
			GET_BOARDS,
			expect.objectContaining({
				where: {
					_and: [
						{ archived_at: { _is_null: true } },
						expect.objectContaining({
							_or: expect.arrayContaining([{ user_id: { _eq: 'user-1' } }])
						})
					]
				}
			})
		);
	});

	it('falls back to the session user when the profile request fails', async () => {
		const { request } = await import('$lib/graphql/client');
		const { userStore } = await import('../user.svelte');

		vi.mocked(request).mockRejectedValue(new TypeError('Failed to fetch'));

		await userStore.initializeUser({ id: 'user-1', email: 'me@example.com' });

		expect(await userStore.whenReady()).toMatchObject({ id: 'user-1' });
	});

	it('whenReady gives up after the timeout when nobody initializes the user', async () => {
		const { userStore } = await import('../user.svelte');

		expect(await userStore.whenReady(10)).toBeNull();
	});
});
