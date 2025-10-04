/** @file src/lib/utils/localStorage.ts */
import { browser } from '$app/environment';

const APP_STORAGE_KEYS = [
	'selectedBoardId',
	'todo-filtering-preferences',
	'todo-view-mode'
] as const;

export function clearAppStorage(): void {
	if (!browser) return;

	console.log('Clearing app localStorage...');

	APP_STORAGE_KEYS.forEach((key) => {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.warn(`Failed to remove localStorage key: ${key}`, error);
		}
	});

	console.log('✓ App localStorage cleared');
}
