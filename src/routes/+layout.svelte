<!-- @file src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { initTranslations } from '$lib/i18n';
	import { ModeWatcher } from 'mode-watcher';
	import ErrorSuccess from '$lib/components/ui/ErrorSuccess.svelte';
	import faviconUrl from '$lib/assets/favicon.svg?url';
	import DevMode from '$lib/components/DevMode.svelte';

	let { data, children } = $props();

	$effect(() => {
		if (data?.locale) {
			initTranslations(data.locale);
		}
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href={faviconUrl} />
</svelte:head>

<ModeWatcher />

<div class="min-h-screen w-full bg-background">
	{#if data.env.app !== 'production' || data.env.api !== 'production'}
		<DevMode app={data.env.app} api={data.env.api} />
	{/if}

	{@render children?.()}
</div>

<ErrorSuccess />
