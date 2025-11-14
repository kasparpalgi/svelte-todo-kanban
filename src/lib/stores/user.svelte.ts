/** @file src/lib/stores/user.svelte.ts */
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { GET_USERS, UPDATE_USER } from '$lib/graphql/documents';
import { displayMessage } from './errorSuccess.svelte';
import { loggingStore } from './logging.svelte';

function createUserStore() {
	const state = $state({
		initialized: false,
		loading: true,
		error: null as string | null,
		cachedUser: null as any,
		isLoggingOut: false
	});

	const user = $derived(() => state.cachedUser);
	const viewMode = $derived(() => user()?.settings?.viewMode || 'kanban');
	const isDarkMode = $derived(() => user()?.dark_mode || false);
	const userLocale = $derived(() => user()?.locale || DEFAULT_LOCALE);

	async function initializeUser(sessionUser: any | null) {
		if (!browser || state.initialized || state.isLoggingOut) return;

		if (!sessionUser?.id) {
			state.loading = false;
			state.initialized = true;
			return;
		}

		state.loading = true;

		try {
			const data = (await request(GET_USERS, {
				where: { id: { _eq: sessionUser.id } },
				limit: 1
			})) as any;

			const dbUser = data.users?.[0];

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
			state.error = error.message || 'Failed to load user profile.';
			displayMessage(error);
			loggingStore.error('UserStore', 'Failed to hydrate user from DB', { error });
		} finally {
			state.loading = false;
			state.initialized = true;
		}
	}

	async function initializeAppState(dbUser: any) {
		const { actionState } = await import('$lib/stores/states.svelte');

		if (dbUser.settings?.viewMode) {
			actionState.viewMode = dbUser.settings.viewMode;
		}

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

			const data = (await request(UPDATE_USER, {
				where: { id: { _eq: userId } },
				_set: updates
			})) as any;

			const updatedUser = data.update_users?.returning?.[0];

			if (!updatedUser) {
				state.cachedUser = originalUser;
				if ('dark_mode' in updates && browser) {
					document.documentElement.classList.toggle('dark', originalUser.dark_mode);
				}

				const message = `Failed to update user settings - No user returned. UserId: ${userId}`;
				const detailedMessage = `${message}, Updates: ${JSON.stringify(Object.keys(updates))}`;
				state.error = detailedMessage;
				console.error('[UserStore]', detailedMessage, { fullData: data });

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

			loggingStore.error('UserStore', 'Failed to update user', {
				userId,
				updates,
				error: message
			});

			return { success: false, message };
		} finally {
			state.loading = false;
		}
	}

	async function updateViewPreference(userId: string, viewMode: 'kanban' | 'list') {
		const { actionState } = await import('$lib/stores/states.svelte');
		const currentUser = user();
		const currentSettings = currentUser?.settings || {};
		const newSettings = { ...currentSettings, viewMode };
		const originalViewMode = actionState.viewMode;
		actionState.viewMode = viewMode;

		const result = await updateUser(userId, { settings: newSettings });

		if (!result.success) {
			actionState.viewMode = originalViewMode;
		}

		return result;
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
		get viewMode() {
			return viewMode();
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
		updateUser,
		updateViewPreference,
		toggleDarkMode,
		reset,
		clearLogoutFlag
	};
}

export const userStore = createUserStore();
