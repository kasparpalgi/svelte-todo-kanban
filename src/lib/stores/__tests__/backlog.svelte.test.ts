/** @file src/lib/stores/__tests__/backlog.svelte.test.ts */
// The combined backlog loads each board's open cards with getTodos (#241); a board
// that fails is counted, and the others still show.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backlogStore } from '../backlog.svelte';
import { call } from '$lib/api/call';

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));
vi.mock('$lib/api/call', () => ({ call: vi.fn() }));
vi.mock('../logging.svelte', () => ({ loggingStore: { warn: vi.fn() } }));

describe('backlogStore', () => {
	// Braces: a value returned from beforeEach runs as its teardown.
	beforeEach(() => {
		vi.mocked(call).mockReset();
	});

	it("asks for each board's open cards and keeps them by board", async () => {
		vi.mocked(call).mockImplementation((async (_op: string, input: { boardId: string }) => [
			{ id: `card-of-${input.boardId}` }
		]) as never);

		await backlogStore.load(['b1', 'b2']);

		expect(call).toHaveBeenCalledWith('getTodos', { boardId: 'b1', completed: false, limit: 1000 });
		expect(backlogStore.cards.b2).toEqual([{ id: 'card-of-b2' }]);
		expect(backlogStore.failed).toBe(0);
		expect(backlogStore.loading).toBe(false);
	});

	it('counts a board that fails and still loads the rest', async () => {
		vi.mocked(call).mockImplementation((async (_op: string, input: { boardId: string }) => {
			if (input.boardId === 'bad') throw new Error('403');
			return [{ id: 'fresh' }];
		}) as never);

		await backlogStore.load(['bad', 'good']);

		expect(backlogStore.cards.good).toEqual([{ id: 'fresh' }]);
		expect(backlogStore.failed).toBe(1);
	});
});
