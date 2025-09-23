/** @file src/lib/stores/states.svelte.ts */
import { t } from '$lib/i18n';
import { get } from 'svelte/store';

export let actionState = $state({
	edit: '',
	viewMode: 'kanban',

	tBoard() {
		return this.viewMode === 'list' ? get(t)('board.project') : get(t)('board.board');
	},
	tBoards() {
		return this.viewMode === 'list' ? get(t)('board.projects') : get(t)('board.boards');
	},
	tList() {
		return this.viewMode === 'list' ? get(t)('board.category') : get(t)('board.list');
	},
	tLists() {
		return this.viewMode === 'list' ? get(t)('board.categories') : get(t)('board.lists');
	}
});
