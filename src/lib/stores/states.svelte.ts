/** @file src/lib/stores/states.svelte.ts */
import { t } from '$lib/i18n';
import { get } from 'svelte/store';
import type { TranslationFunction } from 'sveltekit-i18n';

export let actionState = $state({
	edit: '',
	viewMode: 'kanban',
	showFilters: false,

	tBoard() {
		const translate = get(t) as TranslationFunction;
		return this.viewMode === 'list' ? translate('board.project') : translate('board.board');
	},
	tBoards() {
		const translate = get(t) as TranslationFunction;
		return this.viewMode === 'list' ? translate('board.projects') : translate('board.boards');
	},
	tList() {
		const translate = get(t) as TranslationFunction;
		return this.viewMode === 'list' ? translate('board.category') : translate('board.list');
	},
	tLists() {
		const translate = get(t) as TranslationFunction;
		return this.viewMode === 'list' ? translate('board.categories') : translate('board.lists');
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
