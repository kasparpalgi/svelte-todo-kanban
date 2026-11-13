/** @file src/lib/stores/backlog.svelte.ts */
// Open cards of every board the user works on, for the combined backlog (#241). Each
// board is one getTodos call — the same call a board refresh makes — a few at a time,
// so a board's cards appear as soon as they arrive.
import { browser } from '$app/environment';
import { call } from '$lib/api/call';
import type { BoardTodo } from '$lib/types/todo';
import { loggingStore } from './logging.svelte';

const AT_ONCE = 4;

function createBacklogStore() {
	const state = $state({
		cards: {} as Record<string, BoardTodo[]>,
		loading: false,
		failed: 0
	});

	let running = 0;

	async function loadBoard(boardId: string): Promise<boolean> {
		try {
			state.cards[boardId] = await call('getTodos', { boardId, completed: false, limit: 1000 });
			return true;
		} catch (error) {
			loggingStore.warn('Backlog', 'Board cards failed to load', { boardId, error: `${error}` });
			return false;
		}
	}

	/** Loads (or refreshes) the given boards; cards already shown stay until replaced. */
	async function load(boardIds: string[]): Promise<void> {
		if (!browser) return;
		running++;
		state.loading = true;
		let failed = 0;
		for (let i = 0; i < boardIds.length; i += AT_ONCE) {
			const done = await Promise.all(boardIds.slice(i, i + AT_ONCE).map(loadBoard));
			failed += done.filter((ok) => !ok).length;
		}
		state.failed = failed;
		state.loading = --running > 0;
	}

	return {
		get cards() {
			return state.cards;
		},
		get loading() {
			return state.loading;
		},
		/** Boards whose cards could not be loaded on the last run. */
		get failed() {
			return state.failed;
		},
		load
	};
}

export const backlogStore = createBacklogStore();
