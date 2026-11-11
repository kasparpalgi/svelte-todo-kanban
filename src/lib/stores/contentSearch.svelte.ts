/** @file src/lib/stores/contentSearch.svelte.ts */
// "Search in content" without card bodies on the board (#211): Postgres finds the cards
// whose content matches, and the filter reads their ids.
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { SEARCH_TODO_CONTENT } from '$lib/graphql/documents';
import type { SearchTodoContentQuery } from '$lib/graphql/generated/graphql';

const DEBOUNCE_MS = 300;

/** `%` and `_` in the search term are text, not LIKE wildcards. */
export function escapeLike(term: string): string {
	return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

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
				const data = await request<SearchTodoContentQuery>(SEARCH_TODO_CONTENT, {
					where: {
						list: { board_id: { _eq: boardId } },
						content: { _ilike: `%${escapeLike(term!)}%` }
					}
				});
				if (wanted === key) state.ids = new Set(data.todos.map((t) => t.id));
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
