<!-- @file src/lib/components/listBoard/BoardSwitcher.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { Layers, ChevronDown, Settings } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';

	$effect(() => {
		if (!listsStore.initialized) listsStore.loadBoards();
	});

	function selectBoard(board: (typeof listsStore.boards)[0] | null) {
		const lang = page.params.lang || 'en';

		if (board && board.user?.username && board.alias) {
			goto(`/${lang}/${board.user.username}/${board.alias}`);
		} else {
			goto(`/${lang}`);
		}

		listsStore.setSelectedBoard(board);
	}

	function openBoardManagement() {
		actionState.edit = 'showBoardManagement';
	}

	const currentBoardName = $derived(
		() => listsStore.selectedBoard?.name || `${$t('common.all')} ${$t('board.projects')}`
	);

	const isAllBoardsSelected = $derived(() => listsStore.selectedBoard === null);

	const listLabel = $derived(() => {
		if (actionState.viewMode === 'list') {
			return listsStore.selectedBoard?.id ? $t('board.categories') : $t('board.categories');
		}
		return listsStore.selectedBoard?.id ? $t('board.lists') : $t('board.lists');
	});

	const allBoardsLabel = $derived(() => `${$t('common.all')} ${$t('board.projects')}`);
	const manageBoardsLabel = $derived(() => `${$t('common.manage')} ${$t('board.projects')}`);
</script>

<div class="flex items-center gap-2">
	<DropdownMenu>
		<DropdownMenuTrigger>
			<Button variant="outline" size="sm" class="h-8">
				<Layers class="mr-2 h-4 w-4" />
				{currentBoardName()}
				<ChevronDown class="ml-2 h-4 w-4" />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start" class="w-64">
			<DropdownMenuItem
				onclick={() => selectBoard(null)}
				class={isAllBoardsSelected() ? 'bg-accent' : ''}
			>
				<div class="flex w-full items-center justify-between">
					<span>{allBoardsLabel()}</span>
					<div class="flex items-center gap-2">
						<Badge variant="outline" class="text-xs">
							{listsStore.boards.length}
							{$t('board.projects')}
						</Badge>
						{#if isAllBoardsSelected()}
							<div class="h-2 w-2 rounded-full bg-primary"></div>
						{/if}
					</div>
				</div>
			</DropdownMenuItem>

			<DropdownMenuSeparator />

			{#each listsStore.sortedBoards as board (board.id)}
				<DropdownMenuItem
					onclick={() => selectBoard(board)}
					class={listsStore.selectedBoard?.id === board.id ? 'bg-accent' : ''}
				>
					<div class="flex w-full items-center justify-between">
						<div class="flex flex-col items-start">
							<span>{board.name}</span>
							{#if board.user?.username}
								<span class="text-xs text-muted-foreground">@{board.user.username}</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<Badge variant="outline" class="text-xs">
								{listsStore.lists.filter((l) => l.board_id === board.id).length}
								{listLabel()}
							</Badge>
							{#if listsStore.selectedBoard?.id === board.id}
								<div class="h-2 w-2 rounded-full bg-primary"></div>
							{/if}
						</div>
					</div>
				</DropdownMenuItem>
			{/each}

			<DropdownMenuSeparator />

			<DropdownMenuItem onclick={openBoardManagement}>
				<Settings class="mr-2 h-4 w-4" />
				{manageBoardsLabel()}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</div>
