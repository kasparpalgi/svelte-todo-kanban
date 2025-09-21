<!-- @file src/routes/[[lang]]/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { initTranslations } from '$lib/i18n';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	$effect(() => {
		if (data?.locale) {
			initTranslations(data.locale);
		}
	});
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container mx-auto px-4 py-4">
		<nav class="flex items-center justify-between">
			<button
				onclick={() => goto('/')}
				class="flex items-center space-x-2 transition-opacity hover:opacity-80"
			>
				<img src={favicon} class="h-6 w-6" alt="Todzz" />
				<h1 class="text-xl font-bold">ToDzz</h1>
			</button>
			{#if data?.session}
				<UserMenu />
			{/if}
		</nav>
	</div>
</header>

<main class="container mx-auto px-4 py-8">
	{@render children?.()}
</main>
