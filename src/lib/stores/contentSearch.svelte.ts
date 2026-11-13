/** @file src/lib/stores/contentSearch.svelte.ts */
// "Search in content" without card bodies on the board (#211): the `searchTodos` op
// finds the cards whose content matches, and the filter reads their ids.
import { browser } from '$app/environment';
import { call } from '$lib/api/call';

const DEBOUNCE_MS = 300;

function createContentSearchStore() {
	const state = $state<{ ids: Set<string> }>({ ids: new Set() });
	let wanted = '';
	let timer: ReturnType<typeof setTimeout> | undefined;

	/** Match `term` in the board's card bodies; no board or no term clears the match. */
	function sync(boardId: string | null | undefined, term: string | undefined) {
		if (!browser) return;
		const key = boardId && term ? `${boardId}\n${term}` : '';
		if (key === wanted) return;
		wanted = key;
		clearTimeout(timer);
		state.ids = new Set();
		if (!key) return;

		timer = setTimeout(async () => {
			try {
				const ids = await call('searchTodos', { boardId: boardId!, term: term! });
				if (wanted === key) state.ids = new Set(ids);
			} catch (error) {
				console.error('Content search error:', error);
			}
		}, DEBOUNCE_MS);
	}

	return {
		sync,
		has: (id: string) => state.ids.has(id)
	};
}

export const contentSearch = createContentSearchStore();
