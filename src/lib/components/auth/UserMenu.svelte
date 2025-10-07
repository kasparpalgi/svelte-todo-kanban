<!-- @file src/lib/components/auth/UserMenu.svelte -->
<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { Button } from '$lib/components/ui/button';
	import { LogOut, Settings } from 'lucide-svelte';
	import { getUserInitials } from '$lib/utils/getUserInitials';
	import { clearAppStorage } from '$lib/utils/localStorage';
	import BoardSwitcher from '$lib/components/listBoard/BoardSwitcher.svelte';

	function navigateToSettings() {
		const currentLang = page.params.lang || '';
		const settingsPath = currentLang ? `/${currentLang}/settings` : '/settings';
		goto(settingsPath);
	}

	async function handleLogout() {
		console.log('[Logout] Starting logout process...');

		try {
			clearAppStorage();

			listsStore.reset();
			userStore.reset();

			console.log('[Logout] Stores reset complete');

			await new Promise((resolve) => setTimeout(resolve, 10));
			await signOut({ callbackUrl: '/' });
		} catch (error) {
			await signOut({ callbackUrl: '/' });
		}
	}
</script>

{#if userStore.user}
	<div class="flex items-center">
		<BoardSwitcher />
		<button
			onclick={navigateToSettings}
			class="ml-2 cursor-pointer flex items-center gap-3 transition-opacity hover:opacity-80"
		>
			<div class="relative h-8 w-8 overflow-hidden rounded-full">
				{#if userStore.user.image}
					<img
						src={userStore.user.image}
						alt={userStore.user.name || userStore.user.email || $t('auth.user')}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
						{getUserInitials(userStore.user.name, userStore.user.email)}
					</div>
				{/if}
			</div>
		</button>

		<Button onclick={navigateToSettings} variant="ghost" size="sm" class="hidden md:flex">
			<Settings class="mr-2 h-4 w-4" />
		</Button>

		<Button onclick={handleLogout} variant="outline" size="sm">
			<LogOut class="mr-2 h-4 w-4" />
		</Button>
	</div>
{/if}
