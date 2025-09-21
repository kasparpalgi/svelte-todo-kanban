<!-- @file src/lib/components/TodoKanban.svelte -->
<script lang="ts">
	import { scale } from 'svelte/transition';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DndContext,
		DragOverlay,
		closestCorners,
		KeyboardSensor,
		PointerSensor,
		useSensor,
		type DragEndEvent,
		type DragStartEvent,
		type DragOverEvent
	} from '@dnd-kit-svelte/core';
	import { sortableKeyboardCoordinates } from '@dnd-kit-svelte/sortable';
	import KanbanColumn from '$lib/components/KanbanColumn.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let activeId = $state<string | null>(null);
	let activeTodo = $state<TodoFieldsFragment | null>(null);
	let hoveredListId = $state<string | null>(null);
	let pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 8
		}
	});
	let keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates
	});
	let sensors = [pointerSensor, keyboardSensor];

	// Group by list
	let kanbanLists = $derived(() => {
		const groups = new Map<string, { list: any; todos: TodoFieldsFragment[] }>();

		for (const todo of todosStore.todos.filter((t: TodoFieldsFragment) => !t.completed_at)) {
			const listId = todo.list?.id || 'unassigned';
			const listName = todo.list?.name || $t('todo.unassigned');

			if (!groups.has(listId)) {
				groups.set(listId, {
					list: { id: listId, name: listName, sort_order: todo.list?.sort_order || 999 },
					todos: []
				});
			}
			groups.get(listId)!.todos.push(todo);
		}

		for (const group of groups.values()) {
			group.todos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
		}

		return Array.from(groups.values()).sort(
			(a, b) => (a.list.sort_order || 999) - (b.list.sort_order || 999)
		);
	});

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo = todosStore.todos.find((todo: TodoFieldsFragment) => todo.id === activeId) || null;
		hoveredListId = null;
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over || !activeId) return;

		const overId = over.id as string;
		const draggedTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === activeId);

		if (!draggedTodo) return;

		const currentListId = draggedTodo.list?.id || 'unassigned';

		// Check if over a column
		if (overId.startsWith('column-')) {
			const newListId = overId.replace('column-', '');
			hoveredListId = newListId !== currentListId ? newListId : null;
		} else {
			// Check if over a todo in a different list
			const overTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === overId);
			if (overTodo) {
				const overListId = overTodo.list?.id || 'unassigned';
				hoveredListId = overListId !== currentListId ? overListId : null;
			}
		}
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		hoveredListId = null;

		if (!over || active.id === over.id) {
			activeId = null;
			activeTodo = null;
			return;
		}

		const draggedId = active.id as string;
		const overId = over.id as string;
		const draggedTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === draggedId);

		if (!draggedTodo) {
			activeId = null;
			activeTodo = null;
			return;
		}

		// Prevent multiple rapid updates
		let updatePromise: Promise<any> | null = null;

		// Check if dropping on a column (cross-list move)
		if (overId.startsWith('column-')) {
			const newListId = overId.replace('column-', '');
			const currentListId = draggedTodo.list?.id || 'unassigned';

			if (currentListId !== newListId) {
				const listIdToUpdate = newListId === 'unassigned' ? null : newListId;
				updatePromise = todosStore.updateTodo(draggedId, {
					list_id: listIdToUpdate,
					sort_order: 1
				});
			}
		} else {
			// Dropping on another todo
			const overTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === overId);

			if (overTodo) {
				const draggedListId = draggedTodo.list?.id || 'unassigned';
				const overListId = overTodo.list?.id || 'unassigned';

				if (draggedListId !== overListId) {
					// Cross-list move when dropping on todo in different list
					const listIdToUpdate = overListId === 'unassigned' ? null : overListId;
					updatePromise = todosStore.updateTodo(draggedId, {
						list_id: listIdToUpdate,
						sort_order: (overTodo.sort_order || 0) + 1
					});
				} else {
					// Same list reordering - batch update
					const listGroup = kanbanLists().find((group) => group.list.id === draggedListId);

					if (listGroup) {
						const listTodos = listGroup.todos;
						const activeIndex = listTodos.findIndex((t: TodoFieldsFragment) => t.id === draggedId);
						const overIndex = listTodos.findIndex((t: TodoFieldsFragment) => t.id === overId);

						if (activeIndex !== overIndex) {
							const newTodos = [...listTodos];
							const [removed] = newTodos.splice(activeIndex, 1);
							newTodos.splice(overIndex, 0, removed);

							// All updates to single promise
							updatePromise = Promise.all(
								newTodos.map((todo, index) =>
									todosStore.updateTodo(todo.id, { sort_order: index + 1 })
								)
							);
						}
					}
				}
			}
		}

		// Clear drag state after update complete
		if (updatePromise) {
			await updatePromise;
		}

		activeId = null;
		activeTodo = null;
	}
</script>

<div in:scale class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	<DndContext
		{sensors}
		collisionDetection={closestCorners}
		onDragStart={handleDragStart}
		onDragOver={handleDragOver}
		onDragEnd={handleDragEnd}
	>
		{#each kanbanLists() as { list, todos } (list.id)}
			<KanbanColumn {list} {todos} isHighlighted={hoveredListId === list.id} />
		{/each}

		<DragOverlay>
			{#if activeTodo}
				<TodoItem todo={activeTodo} isDragging={true} />
			{/if}
		</DragOverlay>
	</DndContext>

	{#if todosStore.completedTodos.length > 0}
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
	{/if}
</div>
