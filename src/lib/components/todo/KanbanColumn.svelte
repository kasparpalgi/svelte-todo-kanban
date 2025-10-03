<!-- @file src/lib/components/todo/KanbanColumn.svelte -->
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
	import { SortableContext, verticalListSortingStrategy } from '@dnd-kit-svelte/sortable';
	import { useDroppable } from '@dnd-kit-svelte/core';
	import { Trash2, Plus, Ellipsis, SquarePen } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import QuickAddInput from './QuickAddInput.svelte';
	import type { CanbanColumnProps } from '$lib/types/todo';

	let {
		list,
		todos,
		isHighlighted = false,
		dropPosition = null
	}: CanbanColumnProps & {
		dropPosition?: {
			listId: string;
			todoId: string;
			position: 'above' | 'below';
			targetIndex: number;
		} | null;
	} = $props();

	let droppable = useDroppable({
		id: `column-${list.id}`
	});
	let { setNodeRef } = droppable;
	let columnElement: HTMLElement;
	let isEditing = $state(false);
	let editName = $state(list.name);
	let newTaskTitle = $state('');
	let showQuickAdd = $state(false);

	$effect(() => {
		if (columnElement && setNodeRef) {
			setNodeRef(columnElement);
		}
	});

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
			taskCount > 0
				? `Delete "${list.name}" and move ${taskCount} task(s) to inbox?`
				: `Delete "${list.name}"?`;

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
			displayMessage('List renamed successfully', 1500, true);
			isEditing = false;
		} else {
			displayMessage(result.message);
			editName = list.name;
			isEditing = false;
		}
	}

	async function handleQuickAddTask() {
		if (!newTaskTitle.trim()) return;

		const listIdForTask = list.id === 'inbox' ? undefined : list.id;
		const result = await todosStore.addTodo(newTaskTitle.trim(), undefined, listIdForTask);

		if (result.success) {
			newTaskTitle = '';
			showQuickAdd = false;
			displayMessage('Task added successfully', 1500, true);
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

	function handleQuickAddKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleQuickAddTask();
		} else if (event.key === 'Escape') {
			showQuickAdd = false;
			newTaskTitle = '';
		}
	}
</script>

<div bind:this={columnElement} class="h-full">
	<Card
		class="h-fit transition-all duration-200 {isHighlighted
			? 'bg-primary/5 ring-2 ring-primary/50 dark:bg-primary/10 dark:ring-primary/30'
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
								Rename List
							</DropdownMenuItem>
							<DropdownMenuItem onclick={() => (showQuickAdd = !showQuickAdd)}>
								<Plus class="mr-2 h-3 w-3" />
								Add Task
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onclick={handleDeleteList} class="text-red-600 focus:text-red-600">
								<Trash2 class="mr-2 h-3 w-3" />
								Delete List
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
		<CardContent class="group min-h-24 space-y-2 pb-3">
			{#if showQuickAdd}
				<div class="mt-2">
					<QuickAddInput
						bind:value={newTaskTitle}
						autofocus={true}
						id={`quickadd-${list.id}`}
						onSubmit={(val: string) => {
							if (val) {
								newTaskTitle = val;
								handleQuickAddTask();
							}
						}}
						onCancel={() => {
							showQuickAdd = false;
							newTaskTitle = '';
						}}
					/>
				</div>
			{/if}
			{#if todos.length > 0}
				<SortableContext
					items={todos.map((todo) => todo.id)}
					strategy={verticalListSortingStrategy}
				>
					{#each todos as todo, index (todo.id)}
						{#if dropPosition?.listId === list.id && dropPosition?.todoId === todo.id && dropPosition?.position === 'above'}
							<div
								class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
							></div>
						{/if}

						{#if index === 0 && dropPosition?.listId === list.id && dropPosition?.todoId === 'column' && dropPosition?.position === 'above'}
							<div
								class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
							></div>
						{/if}

						<TodoItem {todo} />

						{#if dropPosition?.listId === list.id && dropPosition?.todoId === todo.id && dropPosition?.position === 'below'}
							<div
								class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
							></div>
						{/if}
					{/each}
				</SortableContext>
				<div class="mt-3"></div>

				<QuickAddInput
					bind:value={newTaskTitle}
					autofocus={false}
					id={`quickaddBottom-${list.id}`}
					onSubmit={(val: string) => {
						if (val) {
							newTaskTitle = val;
							handleQuickAddTask();
						}
					}}
					onCancel={() => {
						showQuickAdd = false;
						newTaskTitle = '';
					}}
				/>
			{:else}
				{#if dropPosition?.listId === list.id && dropPosition?.todoId === 'column'}
					<div
						class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
					></div>
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
								Add task
							</Button>
						{/if}
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>
