<!-- @file src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import ErrorSuccess from '$lib/components/ui/ErrorSuccess.svelte';
	import faviconUrl from '$lib/assets/favicon.svg?url';

	let { data, children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href={faviconUrl} />
</svelte:head>

<ModeWatcher />

<div class="min-h-screen w-full bg-background">
	{@render children?.()}
</div>

<ErrorSuccess />
