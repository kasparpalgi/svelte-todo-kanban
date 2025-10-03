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
	import { Layers, ChevronDown, Settings, Users, Globe } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	$effect(() => {
		if (!listsStore.initialized) listsStore.loadBoards();
	});

	function selectBoard(board: (typeof listsStore.boards)[0]) {
		const lang = page.params.lang || 'en';

		if (board && board.user?.username && board.alias) {
			goto(`/${lang}/${board.user.username}/${board.alias}`);
		}

		listsStore.setSelectedBoard(board);
	}

	function openBoardManagement() {
		actionState.edit = 'showBoardManagement';
	}

	const currentBoardName = $derived(() => listsStore.selectedBoard?.name || '');

	const listLabel = $derived(() => {
		if (actionState.viewMode === 'list') {
			return $t('board.categories');
		}
		return $t('board.lists');
	});

	const manageBoardsLabel = $derived(() => `${$t('common.manage')} ${$t('board.projects')}`);

	// Helper to check if current user is owner of a board
	function isOwner(board: any) {
		const currentUser = userStore.user;
		if (!currentUser) return false;
		return board.user?.id === currentUser.id;
	}

	// Helper to get member count (excluding owner)
	function getMemberCount(board: any) {
		if (!board.board_members) return 0;
		return board.board_members.filter((m: any) => m.role !== 'owner').length;
	}
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
					onclick={() => selectBoard(board)}
					class={listsStore.selectedBoard?.id === board.id ? 'bg-accent' : ''}
				>
					<div class="flex w-full items-center justify-between">
						<div class="flex flex-col items-start">
							<div class="flex items-center gap-2">
								<span>{board.name}</span>
								{#if board.is_public}
									<Globe class="h-3 w-3 text-muted-foreground" />
								{/if}
								{#if !isOwner(board)}
									<Badge variant="secondary" class="text-xs h-4 px-1">Shared</Badge>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								{#if board.user?.username}
									<span class="text-xs text-muted-foreground">@{board.user.username}</span>
								{/if}
								{#if getMemberCount(board) > 0}
									<span class="text-xs text-muted-foreground flex items-center gap-1">
										<Users class="h-3 w-3" />
										{getMemberCount(board)}
									</span>
								{/if}
							</div>
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
