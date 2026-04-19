/** @file src/lib/stores/urlShortcuts.svelte.ts */
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import {
	GET_URL_SHORTCUTS,
	CREATE_URL_SHORTCUT,
	UPDATE_URL_SHORTCUT,
	DELETE_URL_SHORTCUT
} from '$lib/graphql/documents';

export interface UrlShortcut {
	id: string;
	user_id: string;
	alias: string;
	target_url: string;
	visit_count: number;
	created_at: string;
	updated_at: string;
}

interface GetUrlShortcutsQuery {
	url_shortcuts: UrlShortcut[];
}

interface CreateUrlShortcutMutation {
	insert_url_shortcuts_one: UrlShortcut | null;
}

interface UpdateUrlShortcutMutation {
	update_url_shortcuts_by_pk: UrlShortcut | null;
}

interface DeleteUrlShortcutMutation {
	delete_url_shortcuts_by_pk: { id: string } | null;
}

export type StoreResult<T = unknown> = {
	success: boolean;
	message: string;
	data?: T;
};

interface UrlShortcutsState {
	items: UrlShortcut[];
	loading: boolean;
	error: string | null;
}

function createUrlShortcutsStore() {
	const state = $state<UrlShortcutsState>({
		items: [],
		loading: false,
		error: null
	});

	async function loadShortcuts(): Promise<void> {
		if (!browser) return;
		state.loading = true;
		state.error = null;
		try {
			const data = await request<GetUrlShortcutsQuery>(GET_URL_SHORTCUTS, {});
			state.items = data.url_shortcuts ?? [];
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load shortcuts';
			console.error('[urlShortcutsStore.loadShortcuts] Error:', e);
		} finally {
			state.loading = false;
		}
	}

	async function createShortcut(
		alias: string,
		targetUrl: string
	): Promise<StoreResult<UrlShortcut>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		try {
			const data = await request<CreateUrlShortcutMutation>(CREATE_URL_SHORTCUT, {
				object: { alias, target_url: targetUrl }
			});
			const created = data.insert_url_shortcuts_one;
			if (!created) {
				return { success: false, message: 'Failed to create shortcut' };
			}
			state.items = [created, ...state.items];
			return { success: true, message: 'Shortcut created', data: created };
		} catch (e) {
			const raw = e instanceof Error ? e.message : 'Failed to create shortcut';
			const message = raw.toLowerCase().includes('unique')
				? 'Alias is already taken'
				: raw;
			console.error('[urlShortcutsStore.createShortcut] Error:', e);
			return { success: false, message };
		}
	}

	async function updateShortcut(
		id: string,
		updates: Partial<Pick<UrlShortcut, 'alias' | 'target_url'>>
	): Promise<StoreResult<UrlShortcut>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		const idx = state.items.findIndex((i) => i.id === id);
		const original = idx >= 0 ? { ...state.items[idx] } : null;
		if (idx >= 0 && original) {
			state.items[idx] = { ...original, ...updates };
		}
		try {
			const data = await request<UpdateUrlShortcutMutation>(UPDATE_URL_SHORTCUT, {
				id,
				_set: updates
			});
			const updated = data.update_url_shortcuts_by_pk;
			if (!updated) throw new Error('Update returned no row');
			if (idx >= 0) state.items[idx] = updated;
			return { success: true, message: 'Shortcut updated', data: updated };
		} catch (e) {
			if (idx >= 0 && original) state.items[idx] = original;
			const raw = e instanceof Error ? e.message : 'Failed to update shortcut';
			const message = raw.toLowerCase().includes('unique')
				? 'Alias is already taken'
				: raw;
			console.error('[urlShortcutsStore.updateShortcut] Error:', e);
			return { success: false, message };
		}
	}

	async function deleteShortcut(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		const idx = state.items.findIndex((i) => i.id === id);
		if (idx === -1) return { success: false, message: 'Shortcut not found' };
		const original = state.items[idx];
		state.items = state.items.filter((i) => i.id !== id);
		try {
			const data = await request<DeleteUrlShortcutMutation>(DELETE_URL_SHORTCUT, { id });
			if (!data.delete_url_shortcuts_by_pk) throw new Error('Delete returned no row');
			return { success: true, message: 'Shortcut deleted' };
		} catch (e) {
			state.items = [...state.items];
			state.items.splice(idx, 0, original);
			const message = e instanceof Error ? e.message : 'Failed to delete shortcut';
			console.error('[urlShortcutsStore.deleteShortcut] Error:', e);
			return { success: false, message };
		}
	}

	function setItems(items: UrlShortcut[]) {
		state.items = items;
	}

	return {
		get items() {
			return state.items;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadShortcuts,
		createShortcut,
		updateShortcut,
		deleteShortcut,
		setItems
	};
}

export const urlShortcutsStore = createUrlShortcutsStore();
