<!-- @file src/lib/components/pwa/OfflineIndicator.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { isOnline } from '$lib/utils/pwa';
	import { WifiOff, Wifi } from 'lucide-svelte';

	// State
	let online = $state(true);
	let showReconnectedMessage = $state(false);

	onMount(() => {
		if (!browser) return;

		// Initialize online status
		online = isOnline();

		// Listen for online/offline events
		const handleOnline = () => {
			console.log('[PWA] Connection restored');
			online = true;
			showReconnectedMessage = true;

			// Auto-hide reconnected message after 3 seconds
			setTimeout(() => {
				showReconnectedMessage = false;
			}, 3000);
		};

		const handleOffline = () => {
			console.log('[PWA] Connection lost');
			online = false;
			showReconnectedMessage = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

<!-- Offline Indicator (persistent banner) -->
{#if !online}
	<div
		class="fixed left-0 right-0 top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900 dark:bg-amber-950"
		role="alert"
		aria-live="assertive"
	>
		<div class="mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm">
			<WifiOff class="size-4 text-amber-600 dark:text-amber-400" />
			<span class="font-medium text-amber-900 dark:text-amber-100">
				You're offline
			</span>
			<span class="text-amber-700 dark:text-amber-300">
				— Changes will sync when you're back online
			</span>
		</div>
	</div>
{/if}

<!-- Reconnected Message (temporary notification) -->
{#if showReconnectedMessage}
	<div
		class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 sm:left-auto"
		role="status"
		aria-live="polite"
	>
		<div
			class="flex items-center gap-3 rounded-lg border border-green-200 bg-white p-4 shadow-lg dark:border-green-800 dark:bg-gray-800"
		>
			<Wifi class="size-5 flex-shrink-0 text-green-600 dark:text-green-400" />
			<div class="flex-1">
				<p class="font-semibold text-gray-900 dark:text-white">Back online</p>
				<p class="text-sm text-gray-600 dark:text-gray-300">Connection restored</p>
			</div>
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
