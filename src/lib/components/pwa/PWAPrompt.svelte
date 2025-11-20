<!-- @file src/lib/components/pwa/PWAPrompt.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { isServiceWorkerSupported } from '$lib/utils/pwa';
	import { X, RefreshCw, CheckCircle } from 'lucide-svelte';

	// State for update and offline notifications
	let showUpdatePrompt = $state(false);
	let showOfflineReady = $state(false);
	let isUpdating = $state(false);

	onMount(async () => {
		if (!browser || !isServiceWorkerSupported()) return;

		try {
			// Dynamically import PWA register module to avoid type errors during build
			const { useRegisterSW } = await import('virtual:pwa-register/svelte');

			// Register service worker
			const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
				immediate: true,
				onNeedRefresh() {
					console.log('[PWA] New version available');
					showUpdatePrompt = true;
				},
				onOfflineReady() {
					console.log('[PWA] App ready to work offline');
					showOfflineReady = true;
					// Auto-hide offline ready notification after 5 seconds
					setTimeout(() => {
						showOfflineReady = false;
					}, 5000);
				},
				onRegistered(registration: ServiceWorkerRegistration | undefined) {
					console.log('[PWA] Service worker registered', registration);
				},
				onRegisterError(error: Error) {
					console.error('[PWA] Service worker registration failed', error);
				}
			});

			// Store the update function for use in component
			updateSW = updateServiceWorker;
		} catch (error) {
			console.error('[PWA] Failed to load PWA register module', error);
		}
	});

	let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

	async function handleUpdate() {
		if (!updateSW) return;

		isUpdating = true;
		try {
			await updateSW(true); // Reload page after update
		} catch (error) {
			console.error('[PWA] Update failed', error);
			isUpdating = false;
		}
	}

	function dismissUpdate() {
		showUpdatePrompt = false;
	}

	function dismissOfflineReady() {
		showOfflineReady = false;
	}
</script>

<!-- Update Available Notification -->
{#if showUpdatePrompt}
	<div
		class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 sm:left-auto"
		role="alert"
		aria-live="assertive"
	>
		<div
			class="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-gray-800"
		>
			<RefreshCw class="mt-0.5 size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
			<div class="flex-1">
				<h3 class="font-semibold text-gray-900 dark:text-white">Update Available</h3>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
					A new version of the app is available. Reload to get the latest features and improvements.
				</p>
				<div class="mt-3 flex gap-2">
					<button
						onclick={handleUpdate}
						disabled={isUpdating}
						class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						{#if isUpdating}
							<RefreshCw class="size-4 animate-spin" />
							Updating...
						{:else}
							<RefreshCw class="size-4" />
							Reload Now
						{/if}
					</button>
					<button
						onclick={dismissUpdate}
						disabled={isUpdating}
						class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						Later
					</button>
				</div>
			</div>
			<button
				onclick={dismissUpdate}
				disabled={isUpdating}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
				aria-label="Dismiss"
			>
				<X class="size-5" />
			</button>
		</div>
	</div>
{/if}

<!-- Offline Ready Notification -->
{#if showOfflineReady}
	<div
		class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 sm:left-auto"
		role="status"
		aria-live="polite"
	>
		<div
			class="flex items-start gap-3 rounded-lg border border-green-200 bg-white p-4 shadow-lg dark:border-green-800 dark:bg-gray-800"
		>
			<CheckCircle class="mt-0.5 size-5 flex-shrink-0 text-green-600 dark:text-green-400" />
			<div class="flex-1">
				<h3 class="font-semibold text-gray-900 dark:text-white">Ready to work offline</h3>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
					The app is cached and ready to use without an internet connection.
				</p>
			</div>
			<button
				onclick={dismissOfflineReady}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-gray-500 dark:hover:text-gray-300"
				aria-label="Dismiss"
			>
				<X class="size-5" />
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-in-from-bottom-5 {
		from {
			transform: translateY(1.25rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-in {
		animation: slide-in-from-bottom-5 0.3s ease-out;
	}

	.slide-in-from-bottom-5 {
		animation-name: slide-in-from-bottom-5;
	}
</style>
