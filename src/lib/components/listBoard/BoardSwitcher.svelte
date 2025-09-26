<script lang="ts">
	import { t } from '$lib/i18n';
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

	function selectBoard(boardId: string | null) {
		const board = boardId ? listsStore.boards.find((b) => b.id === boardId) : null;
		listsStore.setSelectedBoard(board || null);
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
			{#each listsStore.sortedBoards as board (board.id)}
				<DropdownMenuItem
					onclick={() => selectBoard(board.id)}
					class={listsStore.selectedBoard?.id === board.id ? 'bg-accent' : ''}
				>
					<div class="flex w-full items-center justify-between">
						<span>{board.name}</span>
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
