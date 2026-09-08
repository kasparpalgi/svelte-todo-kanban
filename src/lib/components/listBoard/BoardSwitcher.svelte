<!-- @file src/lib/components/listBoard/BoardSwitcher.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Layers, ChevronDown, Settings, Users, Globe, Archive, RotateCcw } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let showSwitcher = $state(false);
	let activeTab = $state<'active' | 'archived'>('active');

	$effect(() => {
		if (!listsStore.initialized) listsStore.loadBoards();
	});

	function openSwitcher() {
		activeTab = 'active';
		showSwitcher = true;
	}

	function closeSwitcher() {
		showSwitcher = false;
	}

	function selectTab(tab: 'active' | 'archived') {
		activeTab = tab;
		if (tab === 'archived') listsStore.loadArchivedBoards();
	}

	function selectBoard(board: (typeof listsStore.boards)[0]) {
		const lang = getEffectiveLocale(page.params.lang, userStore.user?.locale);

		if (board && board.user?.username && board.alias) {
			goto(`/${lang}/${board.user.username}/${board.alias}`);
		}

		listsStore.setSelectedBoard(board);
		closeSwitcher();
	}

	async function handleRestore(board: (typeof listsStore.archivedBoards)[0]) {
		const result = await listsStore.restoreBoard(board.id);
		if (result.success) {
			displayMessage($t('board.board_restored'), 1500, true);
		} else {
			displayMessage(result.message || $t('board.failed_restore'));
		}
	}

	function openBoardManagement() {
		showSwitcher = false;
		actionState.edit = 'showBoardManagement';
	}

	const currentBoardName = $derived(() => listsStore.selectedBoard?.name || '');

	function isOwner(board: any) {
		const currentUser = userStore.user;
		if (!currentUser) return false;
		return board.user?.id === currentUser.id;
	}

	function isMember(board: any) {
		const currentUser = userStore.user;
		if (!currentUser) return false;
		return board.board_members?.some((m: any) => m.user_id === currentUser.id);
	}

	function canSeeBoard(board: any) {
		return isOwner(board) || isMember(board);
	}

	function getMemberCount(board: any) {
		if (!board.board_members) return 0;
		return board.board_members.filter((m: any) => m.role !== 'owner').length;
	}

	const filteredBoards = $derived(listsStore.sortedBoards.filter(canSeeBoard));
	const filteredArchivedBoards = $derived(listsStore.sortedArchivedBoards.filter(canSeeBoard));
</script>

<div class="flex items-center gap-2">
	<Button variant="outline" size="sm" class="h-8" onclick={openSwitcher}>
		<Layers class="mr-2 h-4 w-4" />
		{currentBoardName()}
		<ChevronDown class="ml-2 h-4 w-4" />
	</Button>
</div>

{#if showSwitcher}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={closeSwitcher}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && closeSwitcher()}
	>
		<div
			class="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-background shadow-lg"
			onclick={(e) => e.stopPropagation()}
			tabindex="0"
			role="button"
			aria-label={$t('board.switch_board')}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b p-4">
				<div class="flex items-center gap-1 rounded-md bg-muted p-1">
					<button
						type="button"
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'active'
							? 'bg-background shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => selectTab('active')}
					>
						{$t('board.active_boards')}
					</button>
					<button
						type="button"
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
						'archived'
							? 'bg-background shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => selectTab('archived')}
					>
						{$t('board.archived_boards')}
					</button>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={openBoardManagement}>
						<Settings class="mr-2 h-4 w-4" />
						{$t('board.manage_boards')}
					</Button>
					<Button variant="ghost" size="sm" onclick={closeSwitcher}>✕</Button>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
				{#if activeTab === 'active'}
					{#each filteredBoards as board (board.id)}
						<button
							type="button"
							onclick={() => selectBoard(board)}
							class="flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent {listsStore
								.selectedBoard?.id === board.id
								? 'border-primary bg-accent'
								: ''}"
						>
							<div class="flex w-full items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="font-medium">{board.name}</span>
									{#if board.is_public}
										<Globe class="h-3 w-3 text-muted-foreground" />
									{/if}
									{#if !isOwner(board)}
										<Badge variant="secondary" class="h-4 px-1 text-xs">Shared</Badge>
									{/if}
								</div>
								{#if listsStore.selectedBoard?.id === board.id}
									<div class="h-2 w-2 rounded-full bg-primary"></div>
								{/if}
							</div>
							<div class="flex items-center justify-between">
								{#if board.user?.username}
									<span class="text-xs text-muted-foreground">@{board.user.username}</span>
								{:else}
									<span></span>
								{/if}
								<Badge variant="outline" class="text-xs">
									<Users class="h-3 w-3" />
									{getMemberCount(board) + 1}
								</Badge>
							</div>
						</button>
					{/each}
					{#if filteredBoards.length === 0}
						<div class="col-span-full py-8 text-center text-muted-foreground">
							<Layers class="mx-auto h-10 w-10 opacity-20" />
							<p class="mt-2 text-sm">{$t('board.no_boards_yet')}</p>
						</div>
					{/if}
				{:else}
					{#each filteredArchivedBoards as board (board.id)}
						<div class="flex items-center justify-between gap-2 rounded-lg border p-3 opacity-80">
							<div class="flex items-center gap-2">
								<Archive class="h-4 w-4 text-muted-foreground" />
								<span class="font-medium">{board.name}</span>
							</div>
							<Button variant="outline" size="sm" onclick={() => handleRestore(board)}>
								<RotateCcw class="mr-1 h-3 w-3" />
								{$t('board.restore_board')}
							</Button>
						</div>
					{/each}
					{#if filteredArchivedBoards.length === 0}
						<div class="col-span-full py-8 text-center text-muted-foreground">
							<Archive class="mx-auto h-10 w-10 opacity-20" />
							<p class="mt-2 text-sm">{$t('board.no_archived_boards')}</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
