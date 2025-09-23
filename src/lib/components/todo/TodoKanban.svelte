<!-- @file src/lib/components/TodoKanban.svelte -->
<script lang="ts">
	import { scale } from 'svelte/transition';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { t } from '$lib/i18n';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		DndContext,
		DragOverlay,
		closestCorners,
		KeyboardSensor,
		PointerSensor,
		useSensor,
		type DragEndEvent,
		type DragStartEvent,
		type DragMoveEvent
	} from '@dnd-kit-svelte/core';
	import { sortableKeyboardCoordinates } from '@dnd-kit-svelte/sortable';
	import { Plus } from 'lucide-svelte';
	import KanbanColumn from '$lib/components/todo/KanbanColumn.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import { actionState } from '$lib/stores/errorSuccess.svelte';

	let activeId = $state<string | null>(null);
	let activeTodo = $state<TodoFieldsFragment | null>(null);
	let hoveredListId = $state<string | null>(null);
	let dropPosition = $state<{
		listId: string;
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

	$effect(() => {
		if (!listsStore.initialized) {
			listsStore.loadLists();
			listsStore.loadBoards();
		}
	});

	let kanbanLists = $derived(() => {
		const todosByListId = new Map<string, TodoFieldsFragment[]>();

		for (const todo of todosStore.todos.filter((t: TodoFieldsFragment) => !t.completed_at)) {
			const listId = todo.list?.id || 'unassigned';
			if (!todosByListId.has(listId)) {
				todosByListId.set(listId, []);
			}
			todosByListId.get(listId)!.push(todo);
		}

		for (const todos of todosByListId.values()) {
			todos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
		}

		const result = listsStore.sortedLists.map((list) => ({
			list: {
				id: list.id,
				name: list.name,
				sort_order: list.sort_order || 999
			},
			todos: todosByListId.get(list.id) || []
		}));

		// TODO: rename 'inbox'
		const unassignedTodos = todosByListId.get('unassigned');
		if (unassignedTodos && unassignedTodos.length > 0) {
			result.push({
				list: {
					id: 'unassigned',
					name: $t('todo.unassigned'),
					sort_order: 999
				},
				todos: unassignedTodos
			});
		}

		return result;
	});

	function cleanup() {
		activeId = null;
		activeTodo = null;
		dropPosition = null;
		hoveredListId = null;
	}

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo = todosStore.todos.find((todo: TodoFieldsFragment) => todo.id === activeId) || null;
	}

	function handleDragMove(event: DragMoveEvent) {
		const { active, over } = event;
		if (!over || !active.id) return;

		const overId = over.id as string;
		const isOverAColumn = overId.startsWith('column-');
		const overTodo = !isOverAColumn ? todosStore.todos.find((t) => t.id === overId) : undefined;

		if (overTodo) {
			const targetListId = overTodo.list?.id || 'unassigned';
			hoveredListId = targetListId;
			const listGroup = kanbanLists().find((g) => g.list.id === targetListId);
			if (!listGroup) return;

			const todoIndex = listGroup.todos.findIndex((t) => t.id === overId);
			if (todoIndex === -1) return;

			const draggingRect = active.rect.translated;
			const overRect = over.rect;
			if (!draggingRect || !overRect) return;

			const overMiddleY = overRect.top + overRect.height / 2;
			const cursorY = draggingRect.top + draggingRect.height / 2;
			const position = cursorY < overMiddleY ? 'above' : 'below';
			dropPosition = { listId: targetListId, todoId: overId, position, targetIndex: todoIndex };
		} else if (isOverAColumn) {
			const targetListId = overId.replace('column-', '');
			const listGroup = kanbanLists().find((g) => g.list.id === targetListId);
			if (!listGroup) return;

			hoveredListId = targetListId;
			if (listGroup.todos.length === 0) {
				dropPosition = {
					listId: targetListId,
					todoId: 'column',
					position: 'above',
					targetIndex: 0
				};
			} else {
				const draggingRect = active.rect.translated;
				const columnRect = over.rect;
				if (!draggingRect || !columnRect) return;

				const cursorY = draggingRect.top + draggingRect.height / 2;
				const columnTop = columnRect.top;
				const columnBottom = columnRect.top + columnRect.height;

				if (Math.abs(cursorY - columnTop) < Math.abs(cursorY - columnBottom)) {
					const firstTodo = listGroup.todos[0];
					dropPosition = {
						listId: targetListId,
						todoId: firstTodo.id,
						position: 'above',
						targetIndex: 0
					};
				} else {
					const lastTodo = listGroup.todos[listGroup.todos.length - 1];
					dropPosition = {
						listId: targetListId,
						todoId: lastTodo.id,
						position: 'below',
						targetIndex: listGroup.todos.length - 1
					};
				}
			}
		}
	}

	function handleDragCancel() {
		cleanup();
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const finalDropPosition = dropPosition;

		if (over && finalDropPosition && active.id !== over.id) {
			const draggedId = active.id as string;
			const draggedTodo = todosStore.todos.find((t) => t.id === draggedId);
			if (!draggedTodo) {
				setTimeout(cleanup, 0);
				return;
			}

			const sourceListId = draggedTodo.list?.id || 'unassigned';
			const { listId: targetListId, position, targetIndex } = finalDropPosition;
			const sourceListGroup = kanbanLists().find((g) => g.list.id === sourceListId);
			const targetListGroup = kanbanLists().find((g) => g.list.id === targetListId);

			if (sourceListGroup && targetListGroup) {
				let updatePromise: Promise<any> | null = null;
				if (sourceListId === targetListId) {
					// Reordering within same list
					const reorderedList = [...sourceListGroup.todos];
					const activeIndex = reorderedList.findIndex((t) => t.id === draggedId);
					let insertIndex = position === 'above' ? targetIndex : targetIndex + 1;
					if (activeIndex !== insertIndex) {
						const [movedItem] = reorderedList.splice(activeIndex, 1);
						if (activeIndex < insertIndex) insertIndex--;
						reorderedList.splice(insertIndex, 0, movedItem);
						updatePromise = Promise.all(
							reorderedList.map((todo, index) =>
								todosStore.updateTodo(todo.id, { sort_order: index + 1 })
							)
						);
					}
				} else {
					// Moving between lists
					const sourceList = [...sourceListGroup.todos];
					const targetList = [...targetListGroup.todos];
					const listIdToUpdate = targetListId === 'unassigned' ? null : targetListId;
					const activeIndex = sourceList.findIndex((t) => t.id === draggedId);
					const [movedItem] = sourceList.splice(activeIndex, 1);
					let insertIndex = position === 'above' ? targetIndex : targetIndex + 1;
					if (finalDropPosition.todoId === 'column') insertIndex = 0;
					targetList.splice(insertIndex, 0, movedItem);

					const sourceUpdates = sourceList.map((todo, index) =>
						todosStore.updateTodo(todo.id, { sort_order: index + 1 })
					);
					const targetUpdates = targetList.map((todo, index) => {
						const updates: { sort_order: number; list_id?: string | null } = {
							sort_order: index + 1
						};
						if (todo.id === draggedId) updates.list_id = listIdToUpdate;
						return todosStore.updateTodo(todo.id, updates);
					});
					updatePromise = Promise.all([...sourceUpdates, ...targetUpdates]);
				}

				if (updatePromise) {
					updatePromise.catch((err) => console.error('Failed to update store:', err));
				}
			}
		}

		setTimeout(cleanup, 0);
	}
</script>

<div class="w-full" in:scale>
	<!-- Horizontal Scrolling Kanban Board -->
	<div class="w-full overflow-x-auto">
		<div class="flex min-w-max gap-6 p-6">
			<DndContext
				{sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragMove={handleDragMove}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
			>
				{#each kanbanLists() as { list, todos } (list.id)}
					<div class="w-80 flex-shrink-0">
						<KanbanColumn {list} {todos} isHighlighted={hoveredListId === list.id} {dropPosition} />
					</div>
				{/each}

				<!-- Completed Tasks Column -->
				{#if todosStore.completedTodos.length > 0}
					<div class="w-80 flex-shrink-0">
						<Card class="opacity-75">
							<CardHeader>
								<CardTitle class="text-sm text-green-600">✓ {$t('todo.completed')}</CardTitle>
								<CardDescription class="text-xs">
									{todosStore.completedTodos.length}
									{todosStore.completedTodos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
								</CardDescription>
							</CardHeader>
							<CardContent class="space-y-2">
								{#each todosStore.completedTodos.slice(0, 5) as todo (todo.id)}
									<div class="rounded border p-2 text-sm line-through opacity-60">
										{todo.title}
									</div>
								{/each}
								{#if todosStore.completedTodos.length > 5}
									<div class="text-xs text-muted-foreground">
										+{todosStore.completedTodos.length - 5}
										{$t('todo.more_completed')}
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				{/if}

				<div class="w-80 flex-shrink-0">
					<Card class="border-2 border-dashed border-muted-foreground/25 bg-muted/10">
						<CardHeader>
							<CardTitle class="text-sm text-muted-foreground">Add New List</CardTitle>
						</CardHeader>
						<CardContent class="flex flex-col gap-2">
							<Button
								variant="ghost"
								class="h-auto flex-col gap-1 p-4 text-muted-foreground hover:text-foreground"
								onclick={() => (actionState.value = 'showManagementDialog')}
							>
								<Plus class="h-8 w-8" />
								<span class="text-xs">Create List</span>
							</Button>
						</CardContent>
					</Card>
				</div>

				<DragOverlay>
					{#if activeTodo}
						<TodoItem todo={activeTodo} isDragging={true} />
					{/if}
				</DragOverlay>
			</DndContext>
		</div>
	</div>
</div>
