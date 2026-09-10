/** @file src/lib/stores/states.svelte.ts */
import { t } from '$lib/i18n';
import { get } from 'svelte/store';
import type { TranslationFunction } from 'sveltekit-i18n';

export let actionState = $state({
	edit: '',
	showFilters: false,
	showBoardSwitcher: false,

	tBoard() {
		const translate = get(t) as TranslationFunction;
		return translate('board.board');
	},
	tBoards() {
		const translate = get(t) as TranslationFunction;
		return translate('board.boards');
	},
	tList() {
		const translate = get(t) as TranslationFunction;
		return translate('board.list');
	},
	tLists() {
		const translate = get(t) as TranslationFunction;
		return translate('board.lists');
	}
});

export let editingTodo = $state({
	id: null as string | null,
	hasUnsavedChanges: false,

	start(newId: string) {
		this.id = newId;
		this.hasUnsavedChanges = false;
	},
	stop() {
		this.id = null;
		this.hasUnsavedChanges = false;
	},
	setUnsaved(status: boolean) {
		if (this.id) {
			this.hasUnsavedChanges = status;
		}
	}
});
