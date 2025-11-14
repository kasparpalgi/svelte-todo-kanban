<!-- @file src/routes/+layout.svelte -->
<script>
	// @ts-nocheck
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { pwaInfo } from 'virtual:pwa-info';
	import { initTranslations } from '$lib/i18n';
	import { ModeWatcher } from 'mode-watcher';
	import ErrorSuccess from '$lib/components/ui/ErrorSuccess.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import faviconUrl from '$lib/assets/favicon.svg?url';
	import { DEFAULT_LOCALE } from '$lib/constants/locale';

	let { children, data } = $props();

	$effect(() => {
		// Only initialize translations for routes WITHOUT [lang] param (like /signin)
		// Routes with [lang] are handled by [lang]/+layout.svelte
		if (!page.params.lang) {
			const locale = data?.session?.user?.locale || DEFAULT_LOCALE;
			console.log('[Root Layout] Initializing translations for non-lang route:', locale);
			initTranslations(locale);
		}
	});

	onMount(async () => {
		if (pwaInfo && browser) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					if (r) {
						console.log(`[Root Layout] SW Registered: ${r}`);
					}
				},
				onRegisterError(error) {
					console.log('[Root Layout] SW registration error', error);
				}
			});
		}
	});
</script>

<svelte:head>
	{#if pwaInfo}
		{@html pwaInfo.webManifest.linkTag}
	{/if}
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href={faviconUrl} type="image/svg+xml" />
	<link rel="icon" type="image/png" sizes="64x64" href="/pwa-64x64.png" />
	<link rel="apple-touch-icon" sizes="192x192" href="/pwa-192x192.png" />
</svelte:head>

<ModeWatcher />

<ErrorBoundary>
	<div class="min-h-screen w-full bg-background">
		{@render children?.()}
	</div>
</ErrorBoundary>

<ErrorSuccess />
