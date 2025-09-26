<!-- @file src/lib/components/todo/TodoList.svelte -->
<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Check, Trash2 } from 'lucide-svelte';
	import {
		DndContext,
		DragOverlay,
		closestCenter,
		KeyboardSensor,
		PointerSensor,
		useSensor,
		type DragEndEvent,
		type DragStartEvent,
		type DragMoveEvent
	} from '@dnd-kit-svelte/core';
	import {
		SortableContext,
		sortableKeyboardCoordinates,
		verticalListSortingStrategy
	} from '@dnd-kit-svelte/sortable';
	import TodoItem from './TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let mounted = $state(false);
	let activeId = $state<string | null>(null);

	onMount(() => {
		mounted = true;
	});
	let activeTodo = $state<TodoFieldsFragment | null>(null);
	let isDragging = $state(false);
	let dropPosition = $state<{
		todoId: string;
		position: 'above' | 'below';
		targetIndex: number;
	} | null>(null);

	let pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 8
		}
	});
	let keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates
	});
	let sensors = [pointerSensor, keyboardSensor];

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

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo =
			activeTodosArray().find((todo: TodoFieldsFragment) => todo.id === activeId) || null;
		isDragging = true;
	}

	function handleDragMove(event: DragMoveEvent) {
		const { active, over } = event;
		if (!over || !active.id) {
			dropPosition = null;
			return;
		}

		const overId = over.id as string;
		const overTodo = activeTodosArray().find((t) => t.id === overId);

		if (overTodo) {
			const todoIndex = activeTodosArray().findIndex((t) => t.id === overId);
			if (todoIndex === -1) return;

			const draggingRect = active.rect.translated;
			const overRect = over.rect;
			if (!draggingRect || !overRect) return;

			const overMiddleY = overRect.top + overRect.height / 2;
			const cursorY = draggingRect.top + draggingRect.height / 2;
			const position = cursorY < overMiddleY ? 'above' : 'below';

			dropPosition = { todoId: overId, position, targetIndex: todoIndex };
		}
	}

	function handleDragCancel() {
		cleanup();
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active } = event;
		const finalDropPosition = dropPosition;

		if (!finalDropPosition || active.id === finalDropPosition.todoId) {
			cleanup();
			return;
		}

		const reorderedTodos = [...activeTodosArray()];
		const activeIndex = reorderedTodos.findIndex((t) => t.id === active.id);

		if (activeIndex === -1) {
			cleanup();
			return;
		}

		const { targetIndex, position } = finalDropPosition;
		let insertIndex = position === 'above' ? targetIndex : targetIndex + 1;

		if (activeIndex < insertIndex) {
			insertIndex--;
		}

		if (activeIndex === insertIndex) {
			cleanup();
			return;
		}

		const [movedItem] = reorderedTodos.splice(activeIndex, 1);
		reorderedTodos.splice(insertIndex, 0, movedItem);

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

		cleanup();
	}

	function cleanup() {
		activeId = null;
		activeTodo = null;
		isDragging = false;
		dropPosition = null;
	}

	async function handleDeleteTodo(todoId: string) {
		if (confirm($t('todo.confirm_delete') || 'Are you sure?')) {
			const result = await todosStore.deleteTodo(todoId);
			if (!result.success) {
				alert(result.message);
			}
		}
	}
</script>

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
				<DndContext
					{sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragMove={handleDragMove}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}
				>
					<SortableContext
						items={activeTodosArray().map((todo: TodoFieldsFragment) => todo.id)}
						strategy={verticalListSortingStrategy}
					>
						<div class="space-y-1">
							{#each activeTodosArray() as todo, index (todo.id)}
								{@const isDropTarget = dropPosition?.todoId === todo.id}
								{@const showDropIndicatorAbove = isDropTarget && dropPosition?.position === 'above'}
								{@const showDropIndicatorBelow = isDropTarget && dropPosition?.position === 'below'}

								{#if showDropIndicatorAbove}
									<div
										class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
									></div>
								{/if}

								<TodoItem {todo} />

								{#if showDropIndicatorBelow}
									<div
										class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
									></div>
								{/if}
							{/each}
						</div>
					</SortableContext>

					<DragOverlay>
						{#if activeTodo}
							<TodoItem todo={activeTodo} isDragging={true} />
						{/if}
					</DragOverlay>
				</DndContext>
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
