/** @file src/lib/stores/user.svelte.ts */
import { browser } from '$app/environment';
import { call } from '$lib/api/call';
import { DEFAULT_LOCALE } from '$lib/constants/locale';
import { displayMessage } from './errorSuccess.svelte';
import { loggingStore } from './logging.svelte';
import { isNetworkError } from '$lib/utils/networkError';

function createUserStore() {
	const state = $state({
		initialized: false,
		loading: true,
		error: null as string | null,
		cachedUser: null as any,
		isLoggingOut: false
	});

	// Resolves once initializeUser() has settled (DB user hydrated, or failed).
	// Board/list loaders scope their queries by the current user and run from
	// child onMount, which fires before the layout's initializeUser() request
	// returns; without waiting they saw `user === null` and loaded nothing (#206).
	let resolveReady: () => void = () => {};
	let ready = new Promise<void>((resolve) => (resolveReady = resolve));

	const user = $derived(() => state.cachedUser);
	const isDarkMode = $derived(() => user()?.dark_mode || false);
	const userLocale = $derived(() => user()?.locale || DEFAULT_LOCALE);

	async function initializeUser(sessionUser: any | null) {
		if (!browser) return;

		if (state.initialized || state.isLoggingOut) return;

		if (!sessionUser?.id) {
			state.loading = false;
			state.initialized = true;
			resolveReady();
			return;
		}

		state.loading = true;

		try {
			const dbUser: any = await call('getMe', {});

			if (dbUser) {
				state.cachedUser = {
					id: sessionUser.id,
					...dbUser
				};

				await initializeAppState(state.cachedUser);
			} else {
				state.cachedUser = sessionUser;
				console.warn('[UserStore] DB user not found, using session data');
			}

			loggingStore.setUserId(sessionUser.id);

			loggingStore.info('UserStore', 'User initialized and hydrated from DB', {
				userId: sessionUser.id
			});
		} catch (error: any) {
			// Fall back to the session identity so board/list scoping still works
			// when the profile request fails (e.g. a flaky network on wake-up).
			state.cachedUser = sessionUser;
			state.error = error.message || 'Failed to load user profile.';
			displayMessage(error);
			const log = isNetworkError(error) ? loggingStore.warn : loggingStore.error;
			log('UserStore', 'Failed to hydrate user from DB', { error });
		} finally {
			state.loading = false;
			state.initialized = true;
			resolveReady();
		}
	}

	/**
	 * Wait until the signed-in user is known, then return it (null when signed
	 * out). Bounded by `timeoutMs` so a caller can never hang if initializeUser()
	 * is never called (e.g. no session).
	 */
	async function whenReady(timeoutMs = 10000) {
		if (!state.initialized) {
			let timer: ReturnType<typeof setTimeout> | undefined;
			await Promise.race([
				ready,
				new Promise<void>((resolve) => (timer = setTimeout(resolve, timeoutMs)))
			]);
			clearTimeout(timer);
		}
		return user();
	}

	async function initializeAppState(dbUser: any) {
		const { actionState } = await import('$lib/stores/states.svelte');

		if (browser) {
			const isDark = dbUser.dark_mode || false;
			document.documentElement.classList.toggle('dark', isDark);

			loggingStore.debug('UserStore', 'Applied dark mode to document', {
				isDark,
				classList: Array.from(document.documentElement.classList)
			});
		}
	}

	async function updateUser(userId: string, updates: any, silent: boolean = false) {
		if (!browser) return { success: false, message: 'Not available on server' };

		const originalUser = { ...state.cachedUser };

		if (state.cachedUser) {
			state.cachedUser = { ...state.cachedUser, ...updates };

			if ('dark_mode' in updates && browser) {
				document.documentElement.classList.toggle('dark', updates.dark_mode);
				loggingStore.info('UserStore', 'Applied dark mode optimistically', {
					darkMode: updates.dark_mode
				});
			}
		}

		state.loading = true;
		state.error = null;

		try {
			loggingStore.info('UserStore', 'Updating user', { userId, updates, silent });

			const updatedUser: any = await call('updateMe', { set: updates });

			if (!updatedUser) {
				state.cachedUser = originalUser;
				if ('dark_mode' in updates && browser) {
					document.documentElement.classList.toggle('dark', originalUser.dark_mode);
				}

				const message = `Failed to update user settings - No user returned. UserId: ${userId}`;
				const detailedMessage = `${message}, Updates: ${JSON.stringify(Object.keys(updates))}`;
				state.error = detailedMessage;
				console.error('[UserStore]', detailedMessage);

				displayMessage(message);
				return { success: false, message: detailedMessage };
			}

			state.cachedUser = updatedUser;

			if ('dark_mode' in updates && browser) {
				document.documentElement.classList.toggle('dark', updatedUser.dark_mode);
			}

			if (!silent) {
				displayMessage('Settings updated successfully', 3000, true);
			}

			loggingStore.info('UserStore', 'User updated successfully', {
				userId,
				updatedFields: Object.keys(updates),
				silent,
				newUser: updatedUser
			});

			return { success: true, data: updatedUser };
		} catch (error: any) {
			state.cachedUser = originalUser;
			if ('dark_mode' in updates && browser) {
				document.documentElement.classList.toggle('dark', originalUser.dark_mode);
			}

			const errorMessage = error.message || 'Unknown error';
			const message = `Failed to update settings: ${errorMessage}`;
			const detailedMessage = `${message} (UserId: ${userId}, Updates: ${JSON.stringify(Object.keys(updates))})`;
			state.error = detailedMessage;
			console.error('[UserStore] Update error:', detailedMessage, { error });

			displayMessage(message);

			// A dropped connection is not an app bug (3 such "errors" in Oct 2026, #209).
			const log = isNetworkError(error) ? loggingStore.warn : loggingStore.error;
			log('UserStore', 'Failed to update user', {
				userId,
				updates,
				error: message
			});

			return { success: false, message };
		} finally {
			state.loading = false;
		}
	}

	/** Re-reads the user after a server-side change (saved keys, a new connection). */
	async function refresh() {
		if (!browser || !state.cachedUser?.id) return;
		try {
			state.cachedUser = await call('getMe', {});
		} catch (error: any) {
			loggingStore.warn('UserStore', 'Failed to refresh user', { error: error?.message });
		}
	}

	/** GitHub and Google Calendar tokens are server-managed: removing one is its own op. */
	async function disconnect(name: 'github' | 'google_calendar') {
		if (!browser) return { success: false, message: 'Not available on server' };
		try {
			state.cachedUser = await call('disconnectIntegration', { name });
			return { success: true, message: 'Disconnected' };
		} catch (error: any) {
			loggingStore.error('UserStore', 'Failed to disconnect', { name, error: error?.message });
			return { success: false, message: error?.message || 'Failed to disconnect' };
		}
	}

	async function toggleDarkMode(userId: string) {
		const currentUser = user();
		const newDarkMode = !currentUser?.dark_mode;

		loggingStore.info('UserStore', 'Toggling dark mode', {
			userId,
			currentMode: currentUser?.dark_mode,
			newMode: newDarkMode
		});

		return await updateUser(userId, { dark_mode: newDarkMode });
	}

	function reset() {
		state.isLoggingOut = true;
		state.initialized = false;
		state.loading = true;
		state.error = null;
		state.cachedUser = null;
		ready = new Promise<void>((resolve) => (resolveReady = resolve));
		loggingStore.setUserId(null);
	}

	function clearLogoutFlag() {
		state.isLoggingOut = false;
	}

	return {
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get user() {
			return user();
		},
		get isDarkMode() {
			return isDarkMode();
		},
		get userLocale() {
			return userLocale();
		},
		get hasGithubConnected() {
			return !!user()?.settings?.tokens?.github?.encrypted;
		},
		get githubUsername() {
			return user()?.settings?.tokens?.github?.username || null;
		},
		initializeUser,
		whenReady,
		updateUser,
		disconnect,
		refresh,
		toggleDarkMode,
		reset,
		clearLogoutFlag
	};
}

export const userStore = createUserStore();
