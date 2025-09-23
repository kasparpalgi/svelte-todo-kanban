<!-- @file src/lib/components/listBoard/BoardManagement.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Plus, Trash2, SquarePen, GripVertical, Layers3, MoreHorizontal } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { actionState } from '$lib/stores/states.svelte';

	let showBoardDialog = $state(false);
	let editingBoard = $state<{ id: string; name: string } | null>(null);
	let newBoardName = $state('');

	$effect(() => {
		listsStore.loadBoards();
	});

	const todoCountByBoard = $derived(() => {
		const counts = new Map<string, number>();
		for (const todo of todosStore.todos) {
			const boardId = todo.list?.board?.id;
			if (boardId) {
				counts.set(boardId, (counts.get(boardId) || 0) + 1);
			}
		}
		return counts;
	});

	async function handleCreateBoard() {
		if (!newBoardName.trim()) return;

		const result = await listsStore.createBoard(newBoardName.trim());

		if (result.success) {
			displayMessage('Board created successfully', 1500, true);
			newBoardName = '';
			showBoardDialog = false;
		} else {
			displayMessage(result.message);
		}
	}

	async function handleUpdateBoard(id: string, name: string) {
		if (!name.trim()) return;

		const result = await listsStore.updateBoard(id, { name: name.trim() });

		if (result.success) {
			displayMessage('Board updated successfully', 1500, true);
			editingBoard = null;
		} else {
			displayMessage(result.message);
		}
	}

	async function handleDeleteBoard(id: string, boardName: string) {
		const todoCount = todoCountByBoard().get(id) || 0;
		const listsInBoard = listsStore.lists.filter((l) => l.board_id === id);

		let confirmMessage = `Delete "${boardName}"?`;
		if (listsInBoard.length > 0 || todoCount > 0) {
			confirmMessage = `Delete "${boardName}" with ${listsInBoard.length} list(s) and ${todoCount} todo(s)?`;
		}

		if (!confirm(confirmMessage)) return;

		const result = await listsStore.deleteBoard(id);

		if (result.success) {
			displayMessage('Board deleted successfully', 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	function startEditBoard(board: { id: string; name: string }) {
		editingBoard = { ...board };
	}

	function handleBoardKeydown(event: KeyboardEvent, id: string, name: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleUpdateBoard(id, name);
		} else if (event.key === 'Escape') {
			editingBoard = null;
		}
	}
</script>

{#if actionState.edit === 'showBoardManagement'}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
		onclick={() => (actionState.edit = '')}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (actionState.edit = '')}
	>
		<div
			class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg"
			onclick={(e) => e.stopPropagation()}
			tabindex="0"
			role="button"
			aria-label="Upload images by dragg'n'drop or click to browse"
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Manage Boards</h3>
				<Button variant="ghost" onclick={() => (actionState.edit = '')}>✕</Button>
			</div>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
					<div class="flex items-center gap-2">
						<Layers3 class="h-5 w-5" />
						<CardTitle class="text-lg">Boards</CardTitle>
						<Badge variant="secondary">{listsStore.boards.length}</Badge>
					</div>
					<Dialog bind:open={showBoardDialog}>
						<DialogTrigger>
							<Button size="sm" class="h-8">
								<Plus class="mr-1 h-3 w-3" />
								New Board
							</Button>
						</DialogTrigger>
						<DialogContent class="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Create New Board</DialogTitle>
								<DialogDescription>
									Boards help organize your lists into different projects or categories.
								</DialogDescription>
							</DialogHeader>
							<div class="grid gap-4 py-4">
								<div class="grid gap-2">
									<label for="board-name" class="text-sm font-medium">Board Name</label>
									<Input
										id="board-name"
										bind:value={newBoardName}
										placeholder="Enter board name..."
										onkeydown={(e) => e.key === 'Enter' && handleCreateBoard()}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onclick={() => (showBoardDialog = false)}>Cancel</Button>
								<Button onclick={handleCreateBoard} disabled={!newBoardName.trim()}>
									Create Board
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if listsStore.boards.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							<Layers3 class="mx-auto h-12 w-12 opacity-20" />
							<p class="mt-2 text-sm">No boards yet</p>
							<p class="text-xs">Create a board to organize your lists</p>
						</div>
					{:else}
						{#each listsStore.sortedBoards as board (board.id)}
							<div class="flex items-center gap-2 rounded border p-2">
								<GripVertical class="h-4 w-4 text-muted-foreground" />

								{#if editingBoard?.id === board.id}
									<Input
										bind:value={editingBoard.name}
										class="h-8 flex-1"
										onkeydown={(e) => handleBoardKeydown(e, board.id, editingBoard?.name || '')}
										onblur={() => handleUpdateBoard(board.id, editingBoard?.name || '')}
									/>
								{:else}
									<span class="flex-1 font-medium">{board.name}</span>
								{/if}

								<Badge variant="outline" class="text-xs">
									{todoCountByBoard().get(board.id) || 0} tasks
								</Badge>

								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
											<MoreHorizontal class="h-3 w-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onclick={() => startEditBoard(board)}>
											<SquarePen class="mr-2 h-3 w-3" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onclick={() => handleDeleteBoard(board.id, board.name)}
											class="text-red-600"
										>
											<Trash2 class="mr-2 h-3 w-3" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						{/each}
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
{/if}
