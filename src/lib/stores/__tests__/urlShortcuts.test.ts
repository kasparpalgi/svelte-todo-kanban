/** @file src/lib/stores/__tests__/urlShortcuts.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const requestMock = vi.fn();
vi.mock('$lib/graphql/client', () => ({
	request: (...args: unknown[]) => requestMock(...args)
}));

import { urlShortcutsStore } from '../urlShortcuts.svelte';

describe('urlShortcutsStore', () => {
	beforeEach(() => {
		requestMock.mockReset();
		urlShortcutsStore.setItems([]);
	});

	it('loadShortcuts populates items from query', async () => {
		requestMock.mockResolvedValueOnce({
			url_shortcuts: [
				{
					id: '1',
					user_id: 'u1',
					alias: 'a',
					target_url: 'https://example.com',
					visit_count: 0,
					created_at: 'now',
					updated_at: 'now'
				}
			]
		});

		await urlShortcutsStore.loadShortcuts();
		expect(urlShortcutsStore.items.length).toBe(1);
		expect(urlShortcutsStore.items[0].alias).toBe('a');
	});

	it('createShortcut prepends a new item on success', async () => {
		const item = {
			id: '2',
			user_id: 'u1',
			alias: 'foo',
			target_url: 'https://foo.bar',
			visit_count: 0,
			created_at: 'now',
			updated_at: 'now'
		};
		requestMock.mockResolvedValueOnce({ insert_url_shortcuts_one: item });

		const result = await urlShortcutsStore.createShortcut('foo', 'https://foo.bar');
		expect(result.success).toBe(true);
		expect(urlShortcutsStore.items[0]).toEqual(item);
	});

	it('createShortcut surfaces a friendly message on unique-violation', async () => {
		requestMock.mockRejectedValueOnce(new Error('Uniqueness violation. duplicate key value'));
		const result = await urlShortcutsStore.createShortcut('foo', 'https://foo.bar');
		expect(result.success).toBe(false);
		expect(result.message).toMatch(/already taken/i);
	});

	it('deleteShortcut removes optimistically and rolls back on failure', async () => {
		urlShortcutsStore.setItems([
			{
				id: '3',
				user_id: 'u1',
				alias: 'x',
				target_url: 'https://x',
				visit_count: 0,
				created_at: 'now',
				updated_at: 'now'
			}
		]);

		requestMock.mockRejectedValueOnce(new Error('boom'));
		const result = await urlShortcutsStore.deleteShortcut('3');
		expect(result.success).toBe(false);
		expect(urlShortcutsStore.items.length).toBe(1);
	});

	it('deleteShortcut succeeds when mutation returns the row', async () => {
		urlShortcutsStore.setItems([
			{
				id: '4',
				user_id: 'u1',
				alias: 'y',
				target_url: 'https://y',
				visit_count: 0,
				created_at: 'now',
				updated_at: 'now'
			}
		]);
		requestMock.mockResolvedValueOnce({ delete_url_shortcuts_by_pk: { id: '4' } });

		const result = await urlShortcutsStore.deleteShortcut('4');
		expect(result.success).toBe(true);
		expect(urlShortcutsStore.items.length).toBe(0);
	});
});
