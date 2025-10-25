<!-- @file src/routes/[[lang]]/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { initTranslations } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import UnifiedNotificationBell from '$lib/components/notifications/UnifiedNotificationBell.svelte';

	let { data, children } = $props();

	$effect(() => {
		if (data.session?.user) {
			userStore.initializeUser(data.session.user);
		} else if (!data.session && userStore.user) {
			userStore.reset();
			listsStore.reset();
		}
	});

	$effect(() => {
		if (userStore.user) {
			initTranslations(userStore.user.locale);
		}
	});

	const logoUrl = $derived(() => {
		const params = page.params;
		const lang = params.lang || 'et';

		if (params.username && params.board) {
			return `/${lang}/${params.username}/${params.board}`;
		}

		if (listsStore.selectedBoard?.user?.username && listsStore.selectedBoard?.alias) {
			return `/${lang}/${listsStore.selectedBoard.user.username}/${listsStore.selectedBoard.alias}`;
		}

		return `/${lang}`;
	});

	function handleLogoClick() {
		goto(logoUrl());
	}
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-slate-400/10 backdrop-blur dark:bg-slate-500/10"
>
	<div class="w-full px-4 py-4">
		<nav class="flex items-center justify-between">
			<button
				onclick={handleLogoClick}
				class="flex cursor-pointer items-center space-x-2 transition-opacity hover:opacity-80"
			>
				<div class="h-6 w-6 text-foreground">
					<Logo />
				</div>
				<h1 class="text-xl font-bold">ToDzz</h1>
			</button>

			<div class="flex items-center gap-2">
				{#if data?.session}
					<UnifiedNotificationBell />
					<UserMenu />
				{/if}
			</div>
		</nav>
	</div>
</header>

<main class="w-full px-4">
	{@render children?.()}
</main>
