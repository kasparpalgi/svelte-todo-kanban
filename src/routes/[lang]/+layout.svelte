<!-- @file src/routes/[[lang]]/+layout.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { initTranslations } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';

	let { data, children } = $props();

	let redirectHandled = $state(false);

	$effect(() => {
		userStore.initializeUser(data.session.user);
	});

	$effect(() => {
		if (userStore.user) {
			initTranslations(userStore.user.locale);
		}
	});

	onMount(async () => {
		if (!data?.session || redirectHandled) return;

		const currentPath = page.url.pathname;
		const params = page.params;
		const lang = params.lang || 'en';
		const needsRedirect = !params.username || !params.board;

		if (needsRedirect) {
			await listsStore.loadBoards();

			const defaultBoard = listsStore.boards
				.filter((board) => board.user?.username && board.alias)
				.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))[0];

			if (defaultBoard && defaultBoard.user?.username && defaultBoard.alias) {
				redirectHandled = true;
				const newPath = `/${lang}/${defaultBoard.user.username}/${defaultBoard.alias}`;

				if (currentPath !== newPath) {
					await goto(newPath, { replaceState: true });
				}
			}
		}
	});

	$effect(() => {
		const needsRedirect = !page.params.username || !page.params.board;
		if (needsRedirect) {
			redirectHandled = false;
		}
	});

	const currentLang = $derived(page.params.lang || 'en');

	const logoUrl = $derived(() => {
		const params = page.params;
		const lang = params.lang || 'en';

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
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
