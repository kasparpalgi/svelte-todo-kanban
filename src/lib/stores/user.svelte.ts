/** @file src/lib/stores/user.svelte.ts */
import { page } from '$app/stores';
import { derived } from 'svelte/store';

export const userSession = derived(page, ($page) => $page.data?.session || null);
