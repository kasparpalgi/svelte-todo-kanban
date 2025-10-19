<!-- @file src/lib/components/todo/TodoList.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Check, Trash2 } from 'lucide-svelte';
	import TodoItem from './TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let draggedTodo = $state<TodoFieldsFragment | null>(null);
	let dropTarget = $state<{
		index: number;
		position: 'above' | 'below';
	} | null>(null);

	let activeTodosArray = $derived(() => {
		const selectedBoardId = listsStore.selectedBoard?.id;

		return todosStore.todos
			.filter((t) => {
				if (t.completed_at) return false;
				if (selectedBoardId && t.list?.board?.id !== selectedBoardId) {
					return false;
				}
				return true;
			})
			.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
	});

	let completedTodosArray = $derived(() => {
		const selectedBoardId = listsStore.selectedBoard?.id;

		return todosStore.completedTodos().filter((t: TodoFieldsFragment) => {
			if (selectedBoardId && t.list?.board?.id !== selectedBoardId) {
				return false;
			}
			return true;
		});
	});

	function handleDragStart(todo: TodoFieldsFragment) {
		draggedTodo = todo;
	}

	function handleDragOver(index: number, position: 'above' | 'below') {
		if (!draggedTodo) return;
		dropTarget = { index, position };
	}

	async function handleDragEnd() {
		if (!draggedTodo || !dropTarget) {
			draggedTodo = null;
			dropTarget = null;
			return;
		}

		const reorderedTodos = [...activeTodosArray()];
		const draggedIndex = reorderedTodos.findIndex((t) => t.id === draggedTodo!.id);

		if (draggedIndex === -1) {
			draggedTodo = null;
			dropTarget = null;
			return;
		}

		let insertionIndex = dropTarget.index;
		if (dropTarget.position === 'below') {
			insertionIndex++;
		}

		if (insertionIndex === draggedIndex) {
			draggedTodo = null;
			dropTarget = null;
			return;
		}

		const [movedItem] = reorderedTodos.splice(draggedIndex, 1);
		reorderedTodos.splice(insertionIndex, 0, movedItem);

		try {
			await Promise.all(
				reorderedTodos.map((todo: TodoFieldsFragment, index: number) =>
					todosStore.updateTodo(todo.id, { sort_order: index + 1 })
				)
			);
		} catch (error) {
			console.error('Failed to update todo order:', error);
			await todosStore.loadTodos();
		}

		draggedTodo = null;
		dropTarget = null;
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (!draggedTodo) return;

		const elements = document.elementsFromPoint(e.clientX, e.clientY);

		for (const el of elements) {
			const cardEl = el.closest('[data-todo-id]');
			if (!cardEl) continue;

			const todoId = cardEl.getAttribute('data-todo-id');
			if (todoId === draggedTodo!.id) continue;

			const listEl = cardEl.closest('[data-list-container]');
			if (listEl) {
				const rect = cardEl.getBoundingClientRect();
				const mouseY = e.clientY;
				const position = mouseY < rect.top + rect.height / 2 ? 'above' : 'below';

				const allCards = Array.from(listEl.querySelectorAll('[data-todo-id]'));
				const filteredCards = allCards.filter(
					(c) => c.getAttribute('data-todo-id') !== draggedTodo!.id
				);
				const index = filteredCards.findIndex((c) => c.getAttribute('data-todo-id') === todoId);

				if (index >= 0) {
					handleDragOver(index, position);
				}
				break;
			}
		}
	}

	async function handleDeleteTodo(todoId: string) {
		if (confirm($t('todo.confirm_delete') || 'Are you sure?')) {
			const result = await todosStore.deleteTodo(todoId);
			if (result.success) {
				displayMessage($t('todo.task_deleted'), 1500, true);
			} else {
				displayMessage(result.message || $t('todo.delete_failed'));
			}
		}
	}

	async function handleDelete(todoId: string) {
		const result = await todosStore.deleteTodo(todoId);
		if (result.success) {
			displayMessage($t('todo.task_deleted'), 1500, true);
		} else {
			displayMessage(result.message || $t('todo.delete_failed'));
		}
	}
</script>

<svelte:window onmousemove={handleGlobalMouseMove} />

<div class="grid gap-3">
	<Card class="border-0 shadow-sm">
		<CardHeader class="px-4 pt-4 pb-2">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-medium">{$t('todo.active_tasks')}</CardTitle>
					<CardDescription class="mt-0.5 text-xs">
						{activeTodosArray().length}
						{activeTodosArray().length === 1 ? $t('todo.task') : $t('todo.tasks')}
						{$t('todo.remaining')}
						{#if listsStore.selectedBoard}
							{$t('todo.in')} {actionState.tBoard()}: {listsStore.selectedBoard.name}
						{/if}
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="px-4 pt-0 pb-4">
			{#if activeTodosArray().length > 0}
				<div class="space-y-1" data-list-container>
					{#each activeTodosArray() as todo, idx (todo.id)}
						{@const isDraggedCard = draggedTodo?.id === todo.id}
						{@const filteredIndex = draggedTodo
							? activeTodosArray()
									.filter((t) => t.id !== draggedTodo?.id)
									.findIndex((t) => t.id === todo.id)
							: idx}

						{@const isTargetedDirectlyAbove =
							dropTarget && dropTarget.index === filteredIndex && dropTarget.position === 'above'}

						{@const isTargetedBelowPrevious =
							dropTarget &&
							dropTarget.index === filteredIndex - 1 &&
							dropTarget.position === 'below'}

						{@const showAbove = isTargetedDirectlyAbove || isTargetedBelowPrevious}

						<TodoItem
							{todo}
							{draggedTodo}
							isDragging={isDraggedCard}
							showDropAbove={showAbove || undefined}
							listId="active-list"
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							onDelete={handleDelete}
						/>
					{/each}

					{#if dropTarget}
						{@const filteredLength = draggedTodo
							? activeTodosArray().filter((t) => t.id !== draggedTodo?.id).length
							: activeTodosArray().length}

						{@const isTargetingBelowLastItem =
							dropTarget.index === filteredLength - 1 && dropTarget.position === 'below'}
						{@const isTargetingEmptyListSpace = dropTarget.index >= filteredLength}

						{#if isTargetingBelowLastItem || isTargetingEmptyListSpace}
							<div
								class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
							></div>
						{/if}
					{/if}
				</div>
			{:else}
				<div class="py-4 text-center text-muted-foreground">
					<p class="text-sm">{$t('todo.no_active_tasks')}</p>
					{#if listsStore.selectedBoard}
						<p class="mt-1 text-xs">
							{$t('todo.no_tasks_in')}
							{actionState.tBoard().toLowerCase()}: {listsStore.selectedBoard.name}
						</p>
					{:else}
						<p class="mt-1 text-xs">{$t('todo.select_project_to_view_tasks')}</p>
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>

	{#if completedTodosArray().length > 0}
		<Card class="border-0 shadow-sm">
			<CardHeader class="px-4 pt-4 pb-2">
				<CardTitle class="flex items-center gap-2 text-base font-medium">
					<Check class="h-4 w-4 text-green-600" />
					{$t('todo.completed_tasks')}
				</CardTitle>
				<CardDescription class="mt-0.5 text-xs">
					{completedTodosArray().length}
					{$t('todo.completed')}
					{completedTodosArray().length === 1 ? $t('todo.task') : $t('todo.tasks')}
					{#if listsStore.selectedBoard}
						{$t('todo.in')} {actionState.tBoard()}: {listsStore.selectedBoard.name}
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent class="px-4 pt-0 pb-4">
				<div class="space-y-1">
					{#each completedTodosArray() as todo (todo.id)}
						<div
							class="group relative flex items-center gap-2 rounded-md border p-2 opacity-75 transition-opacity hover:opacity-100"
						>
							<Button
								onclick={() => todosStore.toggleTodo(todo.id)}
								variant="ghost"
								size="sm"
								class="h-5 w-5 shrink-0 rounded-full border-2 border-green-600 bg-green-100 p-0 hover:bg-green-200"
							>
								<Check class="h-2.5 w-2.5 text-green-700" />
								<span class="sr-only">{$t('todo.mark_incomplete')}</span>
							</Button>

							<div class="min-w-0 flex-1 pr-6">
								<h3 class="text-xs leading-tight font-medium text-muted-foreground line-through">
									{todo.title}
								</h3>
								{#if todo.content}
									<p class="mt-0.5 text-xs text-muted-foreground line-through">{todo.content}</p>
								{/if}
								<div class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<span>
										{$t('todo.completed_at')}
										{new Date(todo.completed_at || '').toLocaleDateString()}
									</span>
									{#if todo.list}
										<span>
											{actionState.tList()}: {todo.list.name}
										</span>
									{/if}
								</div>
							</div>

							<div
								class="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Button
									onclick={() => handleDeleteTodo(todo.id)}
									variant="ghost"
									size="sm"
									class="h-5 w-5 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
								>
									<Trash2 class="h-2.5 w-2.5" />
									<span class="sr-only">{$t('common.delete')}</span>
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
