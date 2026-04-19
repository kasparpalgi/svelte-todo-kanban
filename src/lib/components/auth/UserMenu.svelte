<!-- @file src/lib/components/auth/UserMenu.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { getUserInitials } from '$lib/utils/getUserInitials';
	import { clearAllStorage } from '$lib/utils/localStorage';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { DEFAULT_LOCALE } from '$lib/constants/locale';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { Link2, LogOut, Menu, Settings, Wallet } from 'lucide-svelte';
	import BoardSwitcher from '$lib/components/listBoard/BoardSwitcher.svelte';

	let mobileOpen = $state(false);

	function currentLang(): string {
		return userStore.user?.locale || DEFAULT_LOCALE;
	}

	function navigate(path: string) {
		mobileOpen = false;
		goto(`/${currentLang()}${path}`);
	}

	async function handleLogout() {
		mobileOpen = false;
		listsStore.reset();
		userStore.reset();

		await clearAllStorage();

		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/logout';
		document.body.appendChild(form);
		form.submit();
	}

	function splitwisePath(): string {
		const board = listsStore.selectedBoard;
		const username = board?.user?.username;
		if (board?.alias && username) {
			return `/${username}/${board.alias}/expenses`;
		}
		return '/splitwise';
	}

	const menuItems = $derived([
		{ label: $t('menu.shortener'), icon: Link2, path: '/shortener' },
		{ label: $t('menu.splitwise'), icon: Wallet, path: splitwisePath() },
		{ label: $t('menu.settings'), icon: Settings, path: '/settings' }
	]);
</script>

{#snippet userHeader()}
	{#if userStore.user}
		<div class="flex items-center gap-3 border-b px-2 pb-3">
			<div class="relative h-10 w-10 overflow-hidden rounded-full">
				{#if userStore.user.image}
					<img
						src={userStore.user.image}
						alt={userStore.user.name || userStore.user.email || $t('auth.user')}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-muted text-sm font-medium">
						{getUserInitials(userStore.user.name, userStore.user.email)}
					</div>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-semibold">
					{userStore.user.name || $t('auth.user')}
				</div>
				{#if userStore.user.email}
					<div class="truncate text-xs text-muted-foreground">{userStore.user.email}</div>
				{/if}
			</div>
		</div>
	{/if}
{/snippet}

{#if userStore.user}
	<div class="flex items-center gap-2">
		<BoardSwitcher />

		<!-- Desktop: dropdown menu -->
		<div class="hidden md:block">
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant="ghost" size="sm" aria-label={$t('menu.open')}>
						<Menu class="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent class="w-64" align="end">
					<div class="pb-2 pt-1">
						{@render userHeader()}
					</div>
					{#each menuItems as item (item.path)}
						<DropdownMenuItem onclick={() => navigate(item.path)}>
							<item.icon class="mr-2 h-4 w-4" />
							<span>{item.label}</span>
						</DropdownMenuItem>
					{/each}
					<DropdownMenuSeparator />
					<DropdownMenuItem onclick={handleLogout} class="text-red-600 focus:text-red-600">
						<LogOut class="mr-2 h-4 w-4" />
						<span>{$t('menu.logout')}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>

		<!-- Mobile: side sheet -->
		<div class="md:hidden">
			<Sheet bind:open={mobileOpen}>
				<SheetTrigger>
					<Button variant="ghost" size="sm" aria-label={$t('menu.open')}>
						<Menu class="h-5 w-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="right">
					{@render userHeader()}
					<nav class="mt-2 flex flex-col gap-1">
						{#each menuItems as item (item.path)}
							<button
								type="button"
								onclick={() => navigate(item.path)}
								class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
							>
								<item.icon class="h-4 w-4 text-muted-foreground" />
								<span>{item.label}</span>
							</button>
						{/each}
						<button
							type="button"
							onclick={handleLogout}
							class="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
						>
							<LogOut class="h-4 w-4" />
							<span>{$t('menu.logout')}</span>
						</button>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	</div>
{/if}
