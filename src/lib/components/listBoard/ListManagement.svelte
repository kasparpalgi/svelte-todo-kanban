<!-- @file src/lib/components/listBoard/ListManagement.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
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
		SquarePen,
		GripVertical,
		FolderKanban,
		MoreHorizontal // TODO: No new?
	} from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import type { ListFieldsFragment } from '$lib/graphql/generated/graphql';

	let showListDialog = $state(false);
	let editingList = $state<{ id: string; name: string } | null>(null);
	let editingListName = $state('');
	let newListName = $state('');

	$effect(() => {
		if (!listsStore.initialized) {
			listsStore.loadLists();
		}
	});

	// TODO: move the filtering to the store?
	let filteredLists = $derived(
		listsStore.selectedBoard?.id
			? listsStore.sortedLists.filter((l) => l.board_id === listsStore.selectedBoard?.id)
			: listsStore.sortedLists
	);

	const todoCountByList = $derived(() => {
		const counts = new Map<string, number>();
		for (const todo of todosStore.todos) {
			const listId = todo.list?.id || 'inbox';
			counts.set(listId, (counts.get(listId) || 0) + 1);
		}
		return counts;
	});

	async function handleCreateList() {
		if (!newListName.trim()) return;

		const result = await listsStore.createList(
			newListName.trim(),
			listsStore.selectedBoard?.id || undefined
		);

		if (result.success) {
			displayMessage($t('list.create_success'), 1500, true);
			newListName = '';
			showListDialog = false;
		} else {
			displayMessage(result.message);
		}
	}

	async function handleUpdateList(id: string, name: string) {
		if (!name.trim()) return;

		const result = await listsStore.updateList(id, { name: name.trim() });

		if (result.success) {
			displayMessage($t('list.update_success'), 1500, true);
			editingList = null;
			editingListName = '';
		} else {
			displayMessage(result.message);
		}
	}

	async function handleDeleteList(id: string, listName: string) {
		const confirmMessage = $t('list.delete_confirm');

		if (!confirm(confirmMessage)) return;

		const result = await listsStore.deleteList(id);

		if (result.success) {
			displayMessage($t('list.delete_success'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	function startEditList(list: ListFieldsFragment) {
		editingList = { id: list.id, name: list.name };
		editingListName = list.name;
	}

	function cancelEdit() {
		editingList = null;
		editingListName = '';
	}

	function handleListKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleUpdateList(id, editingListName);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function closeModal() {
		actionState.edit = '';
	}

	function handleBackdropClick() {
		closeModal();
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#if actionState.edit === 'showListManagement'}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleModalKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg"
			onclick={(e) => e.stopPropagation()}
			role="button"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
			}}
			tabindex="0"
			aria-label="Upload images by dragg'n'drop or click to browse"
		>
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold">
						{$t('common.manage')}
						{actionState.tLists()}
					</h3>
					<p class="text-sm text-muted-foreground">
						{actionState.tLists()} ({listsStore.selectedBoard?.name})
					</p>
				</div>
				<Button variant="ghost" onclick={closeModal}>✕</Button>
			</div>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
					<div class="flex items-center gap-2">
						<FolderKanban class="h-5 w-5" />
						<CardTitle class="text-lg">{$t('board.lists')}</CardTitle>
						<Badge variant="secondary">{filteredLists.length}</Badge>
					</div>
					<Dialog bind:open={showListDialog}>
						<DialogTrigger>
							<Button size="sm" class="h-8">
								<Plus class="mr-1 h-3 w-3" />
								{$t('todo.newList')}
							</Button>
						</DialogTrigger>
						<DialogContent class="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>{$t('todo.createNewList')}</DialogTitle>
								<DialogDescription>{$t('todo.organizeTasks')}</DialogDescription>
							</DialogHeader>
							<div class="grid gap-4 py-4">
								<div class="grid gap-2">
									<label for="list-name" class="text-sm font-medium">{$t('todo.listName')}</label>
									<Input
										id="list-name"
										bind:value={newListName}
										placeholder={$t('list.enter_name_placeholder')}
										onkeydown={(e) => e.key === 'Enter' && handleCreateList()}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onclick={() => (showListDialog = false)}
									>{$t('common.cancel')}</Button
								>
								<Button onclick={handleCreateList} disabled={!newListName.trim()}>
									{$t('todo.create_list')}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if filteredLists.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							<FolderKanban class="mx-auto h-12 w-12 opacity-20" />
							<p class="mt-2 text-sm">{$t('todo.noLists')}</p>
							<p class="text-xs">{$t('todo.createListPrompt')}</p>
						</div>
					{:else}
						{#each filteredLists as list (list.id)}
							<div class="flex items-center gap-2 rounded border p-2">
								<GripVertical class="h-4 w-4 text-muted-foreground" />

								{#if editingList?.id === list.id}
									<Input
										bind:value={editingListName}
										class="h-8 flex-1"
										onkeydown={(e) => handleListKeydown(e, list.id)}
										onblur={() => handleUpdateList(list.id, editingListName)}
									/>
								{:else}
									<div class="flex-1">
										<span class="font-medium">{list.name}</span>
									</div>
								{/if}

								<Badge variant="outline" class="text-xs">
									{todoCountByList().get(list.id) || 0}
									{$t('todo.tasks')}
								</Badge>

								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
											<MoreHorizontal class="h-3 w-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onclick={() => startEditList(list)}>
											<SquarePen class="mr-2 h-3 w-3" />
											{$t('common.edit')}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onclick={() => handleDeleteList(list.id, list.name)}
											class="text-red-600"
										>
											<Trash2 class="mr-2 h-3 w-3" />
											{$t('common.delete')}
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
