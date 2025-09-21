<!-- @file src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { initTranslations } from '$lib/i18n';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	$effect(() => {
		if (data?.locale) {
			initTranslations(data.locale);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen bg-background">
	{@render children?.()}
</div>
