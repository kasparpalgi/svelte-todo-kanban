<!-- @file src/routes/[[lang]]/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';

	let { data, children } = $props();

	// Dynamic kanban icon that changes color based on theme
	const kanbanIcon = `
		<svg width="24" height="24" viewBox="0 0 16 16" class="fill-current">
			<path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2h-11zm5 2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-5 1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3zm9-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
		</svg>
	`;
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
				<div class="h-6 w-6 text-foreground">
					{@html kanbanIcon}
				</div>
				<h1 class="text-xl font-bold">ToDzz</h1>
			</button>

			<div class="flex items-center gap-4">
				<Logo />
				<LanguageSwitcher />
				{#if data?.session}
					<UserMenu />
				{/if}
			</div>
		</nav>
	</div>
</header>

<main class="container mx-auto px-4 py-8">
	{@render children?.()}
</main>
