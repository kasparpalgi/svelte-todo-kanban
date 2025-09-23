<!-- @file src/lib/components/ListBoardManager.svelte -->
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
	import {
		Plus,
		Trash2,
		Edit2,
		GripVertical,
		FolderKanban,
		Layers3,
		MoreHorizontal
	} from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { actionState, displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { t } from '$lib/i18n';

	let showListDialog = $state(false);
	let showBoardDialog = $state(false);
	let editingList = $state<{ id: string; name: string } | null>(null);
	let editingBoard = $state<{ id: string; name: string } | null>(null);
	let newListName = $state('');
	let newBoardName = $state('');
	let selectedBoardId = $state<string>('');

	$effect(() => {
		if (!listsStore.initialized) {
			listsStore.loadLists();
		}
		listsStore.loadBoards();
	});

	const todoCountByList = $derived(() => {
		const counts = new Map<string, number>();
		for (const todo of todosStore.todos) {
			const listId = todo.list?.id || 'unassigned';
			counts.set(listId, (counts.get(listId) || 0) + 1);
		}
		return counts;
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

	async function handleCreateList() {
		if (!newListName.trim()) return;

		const result = await listsStore.createList(newListName.trim(), selectedBoardId || undefined);

		if (result.success) {
			displayMessage('List created successfully', 1500, true);
			newListName = '';
			selectedBoardId = '';
			showListDialog = false;
		} else {
			displayMessage(result.message);
		}
	}

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

	async function handleUpdateList(id: string, name: string) {
		if (!name.trim()) return;

		const result = await listsStore.updateList(id, { name: name.trim() });

		if (result.success) {
			displayMessage('List updated successfully', 1500, true);
			editingList = null;
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

	async function handleDeleteList(id: string, listName: string) {
		const todoCount = todoCountByList().get(id) || 0;
		const confirmMessage =
			todoCount > 0
				? `Delete "${listName}" and its ${todoCount} todo(s)?`
				: `Delete "${listName}"?`;

		if (!confirm(confirmMessage)) return;

		const result = await listsStore.deleteList(id);

		if (result.success) {
			displayMessage('List deleted successfully', 1500, true);
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

	function startEditList(list: { id: string; name: string }) {
		editingList = { ...list };
	}

	function startEditBoard(board: { id: string; name: string }) {
		editingBoard = { ...board };
	}

	function cancelEdit() {
		editingList = null;
		editingBoard = null;
	}

	function handleListKeydown(event: KeyboardEvent, id: string, name: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleUpdateList(id, name);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function handleBoardKeydown(event: KeyboardEvent, id: string, name: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleUpdateBoard(id, name);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function handleModalKeydown(event: KeyboardEvent, closeModal: () => void) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#if actionState.value === 'showManagementDialog'}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && (actionState.value = '')}
	>
		<button
			type="button"
			class="absolute inset-0 h-full w-full bg-black/90 blur-2xl"
			aria-label="Close dialog"
			onclick={() => (actionState.value = '')}
		></button>

		<!-- Modal content -->
		<div
			class="relative max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg"
			onclick={(e) => e.stopPropagation()}
			role="button"
			tabindex="0"
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (actionState.value = '')}
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Manage Lists & Boards</h3>
				<Button variant="ghost" onclick={() => (actionState.value = '')}>✕</Button>
			</div>

			<div class="space-y-6">
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
									<Button variant="outline" onclick={() => (showBoardDialog = false)}>Cancel</Button
									>
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
												<Edit2 class="mr-2 h-3 w-3" />
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

				<!-- Lists Section -->
				<Card>
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
						<div class="flex items-center gap-2">
							<FolderKanban class="h-5 w-5" />
							<CardTitle class="text-lg">Lists</CardTitle>
							<Badge variant="secondary">{listsStore.lists.length}</Badge>
						</div>
						<Dialog bind:open={showListDialog}>
							<DialogTrigger>
								<Button size="sm" class="h-8">
									<Plus class="mr-1 h-3 w-3" />
									New List
								</Button>
							</DialogTrigger>
							<DialogContent class="sm:max-w-[425px]">
								<DialogHeader>
									<DialogTitle>Create New List</DialogTitle>
									<DialogDescription>
										Lists are columns in your Kanban board where you organize your tasks.
									</DialogDescription>
								</DialogHeader>
								<div class="grid gap-4 py-4">
									<div class="grid gap-2">
										<label for="list-name" class="text-sm font-medium">List Name</label>
										<Input
											id="list-name"
											bind:value={newListName}
											placeholder="Enter list name..."
											onkeydown={(e) => e.key === 'Enter' && handleCreateList()}
										/>
									</div>
									{#if listsStore.boards.length > 0}
										<div class="grid gap-2">
											<label for="board-select" class="text-sm font-medium">Board (Optional)</label>
											<select
												id="board-select"
												bind:value={selectedBoardId}
												class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
											>
												<option value="">No Board</option>
												{#each listsStore.sortedBoards as board}
													<option value={board.id}>{board.name}</option>
												{/each}
											</select>
										</div>
									{/if}
								</div>
								<DialogFooter>
									<Button variant="outline" onclick={() => (showListDialog = false)}>Cancel</Button>
									<Button onclick={handleCreateList} disabled={!newListName.trim()}
										>Create List</Button
									>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</CardHeader>
					<CardContent class="space-y-2">
						{#if listsStore.lists.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								<FolderKanban class="mx-auto h-12 w-12 opacity-20" />
								<p class="mt-2 text-sm">No lists yet</p>
								<p class="text-xs">Create a list to organize your tasks</p>
							</div>
						{:else}
							{#each listsStore.sortedLists as list (list.id)}
								<div class="flex items-center gap-2 rounded border p-2">
									<GripVertical class="h-4 w-4 text-muted-foreground" />

									{#if editingList?.id === list.id}
										<Input
											bind:value={editingList.name}
											class="h-8 flex-1"
											onkeydown={(e) => handleListKeydown(e, list.id, editingList?.name || '')}
											onblur={() => handleUpdateList(list.id, editingList?.name || '')}
										/>
									{:else}
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<span class="font-medium">{list.name}</span>
												{#if list.board}
													<Badge variant="outline" class="text-xs">
														{list.board.name}
													</Badge>
												{/if}
											</div>
										</div>
									{/if}

									<Badge variant="outline" class="text-xs">
										{todoCountByList().get(list.id) || 0} tasks
									</Badge>

									<DropdownMenu>
										<DropdownMenuTrigger>
											<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
												<MoreHorizontal class="h-3 w-3" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onclick={() => startEditList(list)}>
												<Edit2 class="mr-2 h-3 w-3" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onclick={() => handleDeleteList(list.id, list.name)}
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
	</div>
{/if}
