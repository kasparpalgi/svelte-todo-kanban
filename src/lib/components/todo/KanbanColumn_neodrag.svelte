<!-- @file src/lib/components/todo/KanbanColumn_neodrag.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Trash2, Plus, Ellipsis, SquarePen } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import TodoItemNeodrag from '$lib/components/todo/TodoItem_neodrag.svelte';
	import QuickAddInput from './QuickAddInput.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let {
		list,
		todos,
		draggedTodo,
		dropTarget,
		onDragStart,
		onDragEnd,
		onDragOver
	}: {
		list: any;
		todos: TodoFieldsFragment[];
		draggedTodo: TodoFieldsFragment | null;
		dropTarget: { listId: string; index: number; position: 'above' | 'below' } | null;
		onDragStart: (todo: TodoFieldsFragment) => void;
		onDragEnd: () => void;
		onDragOver: (listId: string, index: number, position: 'above' | 'below') => void;
	} = $props();

	let isEditing = $state(false);
	let editName = $state(list.name);
	let newTaskTitleTop = $state('');
	let newTaskTitleBottom = $state('');
	let showQuickAdd = $state(false);
	let showDropAtEnd = $state(false);

	$effect(() => {
		editName = list.name;
	});

	async function handleDeleteTodo(todoId: string) {
		if (confirm($t('todo.confirm_delete') || 'Are you sure?')) {
			const result = await todosStore.deleteTodo(todoId);
			if (!result.success) {
				displayMessage(result.message);
			}
		}
	}

	async function handleDeleteList() {
		const taskCount = todos.length;
		const confirmMessage =
			taskCount > 0 ? $t('todo.delete_list_confirm') : $t('todo.delete_list_confirm_empty');

		if (confirm(confirmMessage)) {
			const result = await listsStore.deleteList(list.id);
			if (!result.success) {
				displayMessage(result.message);
			}
		}
	}

	async function handleRenameList() {
		if (!editName.trim() || editName === list.name) {
			isEditing = false;
			editName = list.name;
			return;
		}

		const result = await listsStore.updateList(list.id, { name: editName.trim() });
		if (result.success) {
			displayMessage($t('todo.list_renamed'), 1500, true);
			isEditing = false;
		} else {
			displayMessage(result.message);
			editName = list.name;
			isEditing = false;
		}
	}

	async function handleQuickAddTask(
		title: string,
		addToTop: boolean = true,
		skipGithub: boolean = false
	) {
		if (!title.trim()) return;

		const listIdForTask = list.id === 'inbox' ? undefined : list.id;

		const boardGithub = list.board?.github;
		const createGithubIssue = !!(boardGithub && !skipGithub);

		const result = await todosStore.addTodo(
			title.trim(),
			undefined,
			listIdForTask,
			addToTop,
			createGithubIssue
		);

		if (result.success) {
			if (addToTop) {
				newTaskTitleTop = '';
			} else {
				newTaskTitleBottom = '';
			}
			showQuickAdd = false;
			displayMessage($t('todo.task_added'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	function startEdit() {
		isEditing = true;
		editName = list.name;
	}

	function cancelEdit() {
		isEditing = false;
		editName = list.name;
	}

	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleRenameList();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function handleColumnDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!draggedTodo) return;

		// If dragging over empty area, show drop at end
		showDropAtEnd = todos.length === 0 || e.target === e.currentTarget;
		if (todos.length === 0) {
			onDragOver(list.id, 0, 'above');
		}
	}

	function handleColumnDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleColumnDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		showDropAtEnd = false;
		// Drop is now handled by parent on dragEnd
	}

	function handleColumnDragLeave(e: DragEvent) {
		// Only hide if leaving the column entirely
		if (e.currentTarget === e.target) {
			showDropAtEnd = false;
		}
	}
</script>

<div class="h-full">
	<Card
		class="h-fit transition-all duration-200 {dropTarget?.listId === list.id
			? 'ring-2 ring-primary/30'
			: ''}"
	>
		<CardHeader class="pb-2">
			<div class="flex items-center justify-between">
				<div class="min-w-0 flex-1">
					{#if isEditing}
						<Input
							bind:value={editName}
							class="h-auto border-none bg-transparent px-0 text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
							onkeydown={handleEditKeydown}
							onblur={handleRenameList}
						/>
					{:else}
						<CardTitle class="truncate text-sm">{list.name}</CardTitle>
					{/if}
				</div>

				<div class="flex items-center gap-1">
					{#if todos.length > 0 && list.id !== 'inbox'}
						<Button
							variant="ghost"
							size="sm"
							class="h-6 w-6 p-0 opacity-60 transition-opacity hover:opacity-100"
							onclick={() => (showQuickAdd = !showQuickAdd)}
						>
							<Plus class="h-3 w-3" />
						</Button>
					{/if}

					<DropdownMenu>
						<DropdownMenuTrigger>
							<Button
								variant="ghost"
								size="sm"
								class="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Ellipsis class="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" class="w-48">
							<DropdownMenuItem onclick={startEdit}>
								<SquarePen class="mr-2 h-3 w-3" />
								{$t('todo.rename_list')}
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => (showQuickAdd = !showQuickAdd)}>
								<Plus class="mr-2 h-3 w-3" />
								{$t('todo.add_task')}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onclick={handleDeleteList} class="text-red-600 focus:text-red-600">
								<Trash2 class="mr-2 h-3 w-3" />
								{$t('todo.delete_list')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<CardDescription class="text-xs">
				{todos.length}
				{todos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
			</CardDescription>
		</CardHeader>
		<CardContent
			class="group min-h-24 space-y-0 pb-3"
			data-list-id={list.id}
			ondragenter={handleColumnDragEnter}
			ondragover={handleColumnDragOver}
			ondrop={handleColumnDrop}
			ondragleave={handleColumnDragLeave}
		>
			<div class="min-h-[180px]">
				{#if showQuickAdd}
					<div class="mt-2">
						<QuickAddInput
							bind:value={newTaskTitleTop}
							autofocus={true}
							id={`quickadd-${list.id}`}
							showGithubCheckbox={!!list.board?.github}
							onSubmit={(val: string, skipGithub: boolean) => {
								if (val) {
									handleQuickAddTask(val, true, skipGithub);
								}
							}}
							onCancel={() => {
								showQuickAdd = false;
								newTaskTitleTop = '';
							}}
						/>
					</div>
				{/if}

				{#if todos.length > 0}
					{#each todos as todo, index (todo.id)}
						<TodoItemNeodrag
							{todo}
							{draggedTodo}
							isDragging={draggedTodo?.id === todo.id}
							showDropAbove={dropTarget?.listId === list.id &&
								dropTarget?.index === index &&
								dropTarget?.position === 'above'}
							showDropBelow={dropTarget?.listId === list.id &&
								dropTarget?.index === index &&
								dropTarget?.position === 'below'}
							listId={list.id}
							{index}
							{onDragStart}
							{onDragEnd}
							{onDragOver}
							onDelete={handleDeleteTodo}
						/>
					{/each}

					{#if showDropAtEnd || (dropTarget && dropTarget.listId === list.id && dropTarget.index === todos.length)}
						<div class="mt-2 h-0.5 bg-primary shadow-lg shadow-primary/50"></div>
					{/if}

					<div class="mt-3"></div>

					<QuickAddInput
						bind:value={newTaskTitleBottom}
						autofocus={false}
						id={`quickaddBottom-${list.id}`}
						onSubmit={(val: string) => {
							if (val) {
								handleQuickAddTask(val, false);
							}
						}}
						onCancel={() => {
							showQuickAdd = false;
							newTaskTitleBottom = '';
						}}
					/>
				{:else}
					{#if showDropAtEnd || (dropTarget && dropTarget.listId === list.id)}
						<div class="my-4 h-0.5 bg-primary shadow-lg shadow-primary/50"></div>
					{/if}

					{#if !showQuickAdd}
						<div class="py-8 text-center text-xs text-muted-foreground">
							<div class="mb-2">{$t('todo.drop_tasks_here')}</div>
							{#if list.id !== 'inbox'}
								<Button
									size="sm"
									variant="ghost"
									class="h-auto p-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
									onclick={() => (showQuickAdd = true)}
								>
									<Plus class="mr-1 h-3 w-3" />
									{$t('todo.add_task')}
								</Button>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
