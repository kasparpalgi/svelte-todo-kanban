/** @file src/lib/utils/localStorage.ts */
import { browser } from '$app/environment';

const APP_STORAGE_KEYS = [
	'selectedBoardId',
	'todo-filtering-preferences',
	'todo-view-mode',
	'mode-watcher-mode',
	'mode-watcher-theme'
] as const;

export function clearAppStorage(): void {
	if (!browser) return;

	APP_STORAGE_KEYS.forEach((key) => {
		try {
			localStorage.removeItem(key);
		} catch (error) {
			console.warn(`Failed to remove localStorage key: ${key}`, error);
		}
	});
}

export async function clearAllStorage(): Promise<void> {
	if (!browser) return;

	try {
		if ('serviceWorker' in navigator) {
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (const registration of registrations) {
				await registration.unregister();
			}
		}
	} catch (error) {
		console.warn('[Logout] Failed to unregister service workers:', error);
	}

	try {
		if ('caches' in window) {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map((name) => caches.delete(name)));
		}
	} catch (error) {
		console.warn('[Logout] Failed to clear caches:', error);
	}

	try {
		if ('indexedDB' in window) {
			const databases = await indexedDB.databases();
			for (const db of databases) {
				if (db.name) {
					indexedDB.deleteDatabase(db.name);
				}
			}
		}
	} catch (error) {
		console.warn('[Logout] Failed to clear IndexedDB:', error);
	}

	try {
		localStorage.clear();
	} catch (error) {
		console.warn('[Logout] Failed to clear localStorage:', error);
	}

	try {
		sessionStorage.clear();
	} catch (error) {
		console.warn('[Logout] Failed to clear sessionStorage:', error);
	}
}
