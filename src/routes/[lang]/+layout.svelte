<!-- @file src/routes/[[lang]]/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { initTranslations } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';

	let { data, children } = $props();

	$effect(() => {
		userStore.initializeUser(data.session.user);
	});

	$effect(() => {
		if (userStore.user) {
			initTranslations(userStore.user.locale);
		}
	});
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="w-full px-4 py-4">
		<nav class="flex items-center justify-between">
			<button
				onclick={() => goto(`/${userStore.user.locale}`)}
				class="flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-80"
			>
				<div class="h-6 w-6 text-foreground">
					<Logo />
				</div>
				<h1 class="text-xl font-bold">ToDzz</h1>
			</button>

			<div class="flex items-center gap-4">
				{#if data?.session}
					<UserMenu />
				{/if}
			</div>
		</nav>
	</div>
</header>

<main class="w-full px-4">
	{@render children?.()}
</main>
