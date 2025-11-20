<!-- @file src/lib/components/pwa/InstallPrompt.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		isInstalledPWA,
		isIOS,
		isSafari,
		isInstallPromptSupported,
		hasUserDismissedInstall,
		dismissInstallPrompt
	} from '$lib/utils/pwa';
	import { Download, X, Share, Plus } from 'lucide-svelte';

	// State
	let showPrompt = $state(false);
	let showIOSInstructions = $state(false);
	let deferredPrompt: any = null;
	let isInstalling = $state(false);

	onMount(() => {
		if (!browser) return;

		// Don't show if already installed or user dismissed recently
		if (isInstalledPWA() || hasUserDismissedInstall()) {
			return;
		}

		// For iOS Safari, show iOS-specific instructions
		if (isIOS() && isSafari()) {
			showIOSInstructions = true;
			return;
		}

		// For Chromium browsers, listen for beforeinstallprompt
		if (isInstallPromptSupported()) {
			const handleBeforeInstallPrompt = (e: Event) => {
				// Prevent the mini-infobar from appearing
				e.preventDefault();
				// Store the event for later use
				deferredPrompt = e;
				// Show our custom install prompt
				showPrompt = true;
			};

			window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

			// Track installation
			window.addEventListener('appinstalled', () => {
				console.log('[PWA] App installed');
				showPrompt = false;
				deferredPrompt = null;
			});

			return () => {
				window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			};
		}
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		isInstalling = true;

		try {
			// Show the install prompt
			await deferredPrompt.prompt();

			// Wait for the user's response
			const { outcome } = await deferredPrompt.userChoice;

			console.log('[PWA] Install prompt outcome:', outcome);

			if (outcome === 'accepted') {
				console.log('[PWA] User accepted the install prompt');
			} else {
				console.log('[PWA] User dismissed the install prompt');
			}

			// Clear the deferred prompt
			deferredPrompt = null;
			showPrompt = false;
		} catch (error) {
			console.error('[PWA] Install failed', error);
		} finally {
			isInstalling = false;
		}
	}

	function handleDismiss() {
		dismissInstallPrompt();
		showPrompt = false;
		showIOSInstructions = false;
	}
</script>

<!-- Chrome/Edge Install Prompt -->
{#if showPrompt}
	<div
		class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 sm:left-auto"
		role="dialog"
		aria-labelledby="install-title"
		aria-describedby="install-description"
	>
		<div
			class="flex items-start gap-3 rounded-lg border border-purple-200 bg-white p-4 shadow-lg dark:border-purple-800 dark:bg-gray-800"
		>
			<Download class="mt-0.5 size-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
			<div class="flex-1">
				<h3 id="install-title" class="font-semibold text-gray-900 dark:text-white">
					Install ToDzz
				</h3>
				<p id="install-description" class="mt-1 text-sm text-gray-600 dark:text-gray-300">
					Install this app on your device for quick access and a better experience.
				</p>
				<div class="mt-3 flex gap-2">
					<button
						onclick={handleInstall}
						disabled={isInstalling}
						class="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600"
					>
						<Download class="size-4" />
						{isInstalling ? 'Installing...' : 'Install'}
					</button>
					<button
						onclick={handleDismiss}
						disabled={isInstalling}
						class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						Not Now
					</button>
				</div>
			</div>
			<button
				onclick={handleDismiss}
				disabled={isInstalling}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
				aria-label="Dismiss"
			>
				<X class="size-5" />
			</button>
		</div>
	</div>
{/if}

<!-- iOS Safari Install Instructions -->
{#if showIOSInstructions}
	<div
		class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 sm:left-auto"
		role="dialog"
		aria-labelledby="ios-install-title"
		aria-describedby="ios-install-description"
	>
		<div
			class="flex items-start gap-3 rounded-lg border border-purple-200 bg-white p-4 shadow-lg dark:border-purple-800 dark:bg-gray-800"
		>
			<Download class="mt-0.5 size-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
			<div class="flex-1">
				<h3 id="ios-install-title" class="font-semibold text-gray-900 dark:text-white">
					Install ToDzz
				</h3>
				<p id="ios-install-description" class="mt-1 text-sm text-gray-600 dark:text-gray-300">
					To install this app on your iPhone or iPad:
				</p>
				<ol class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
					<li class="flex items-center gap-2">
						<span class="flex size-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
							1
						</span>
						<span>
							Tap the <Share class="mx-1 inline size-4" /> share button
						</span>
					</li>
					<li class="flex items-center gap-2">
						<span class="flex size-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
							2
						</span>
						<span>
							Scroll and tap <Plus class="mx-1 inline size-4" /> "Add to Home Screen"
						</span>
					</li>
					<li class="flex items-center gap-2">
						<span class="flex size-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-300">
							3
						</span>
						<span>Tap "Add" to confirm</span>
					</li>
				</ol>
				<button
					onclick={handleDismiss}
					class="mt-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Got it
				</button>
			</div>
			<button
				onclick={handleDismiss}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-gray-500 dark:hover:text-gray-300"
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
