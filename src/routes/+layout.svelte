<!-- @file src/routes/+layout.svelte -->
<script>
// @ts-nocheck
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import ErrorSuccess from '$lib/components/ui/ErrorSuccess.svelte';
	import faviconUrl from '$lib/assets/favicon.svg?url';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					if (r) {
						console.log(`SW Registered: ${r}`);
					}
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
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
	<link rel="icon" href={faviconUrl} />
</svelte:head>

<ModeWatcher />

<div class="min-h-screen w-full bg-background">
	{@render children?.()}
</div>

<ErrorSuccess />
