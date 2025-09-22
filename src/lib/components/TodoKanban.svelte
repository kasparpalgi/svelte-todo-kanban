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
		dropPosition = null;
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over || !activeId) {
			dropPosition = null;
			hoveredListId = null;
			return;
		}

		const overId = over.id as string;
		const draggedTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === activeId);
		if (!draggedTodo) return;

		const currentListId = draggedTodo.list?.id || 'unassigned';

		// Column drop (empty area)
		if (overId.startsWith('column-')) {
			const newListId = overId.replace('column-', '');
			hoveredListId = newListId !== currentListId ? newListId : null;

			dropPosition = {
				listId: newListId,
				todoId: 'column',
				position: 'above',
				targetIndex: 0
			};
			return;
		}

		// Todo item drop
		const overTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === overId);
		if (!overTodo) return;

		const overListId = overTodo.list?.id || 'unassigned';
		hoveredListId = overListId !== currentListId ? overListId : null;

		const listGroup = kanbanLists().find((group) => group.list.id === overListId);
		if (!listGroup) return;

		const todoIndex = listGroup.todos.findIndex((t: TodoFieldsFragment) => t.id === overId);
		if (todoIndex === -1) return;

		// Default to 'below' for all items & 'above' when dragging from higher -> lower index (within same list)
		let position: 'above' | 'below' = 'below';
		let targetIndex = todoIndex;

		if (overListId === currentListId) {
			// Same list = drag direction to determine position
			const draggedIndex = listGroup.todos.findIndex((t: TodoFieldsFragment) => t.id === activeId);
			if (draggedIndex > todoIndex) {
				position = 'above';
			} else {
				position = 'below';
			}
		}
		// Cross-list = always 'below

		dropPosition = {
			listId: overListId,
			todoId: overId,
			position,
			targetIndex
		};
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		const finalDropPosition = dropPosition;
		hoveredListId = null;
		dropPosition = null;

		if (!over || active.id === over.id) {
			activeId = null;
			activeTodo = null;
			return;
		}

		const draggedId = active.id as string;
		const draggedTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === draggedId);

		if (!draggedTodo || !finalDropPosition) {
			activeId = null;
			activeTodo = null;
			return;
		}

		const { listId: targetListId, targetIndex, position } = finalDropPosition;
		const currentListId = draggedTodo.list?.id || 'unassigned';

		let updatePromise: Promise<any> | null = null;

		if (targetListId !== currentListId) {
			// Cross-list move
			const listIdToUpdate = targetListId === 'unassigned' ? null : targetListId;
			const targetListGroup = kanbanLists().find((group) => group.list.id === targetListId);

			if (targetListGroup) {
				const targetTodos = [...targetListGroup.todos];
				let insertIndex = position === 'above' ? targetIndex : targetIndex + 1;

				const newItem = { ...draggedTodo, list: targetListGroup.list };
				targetTodos.splice(insertIndex, 0, newItem);

				const updates = targetTodos.map((todo, index) => {
					if (todo.id === draggedId) {
						return todosStore.updateTodo(draggedId, {
							list_id: listIdToUpdate,
							sort_order: index + 1
						});
					} else {
						return todosStore.updateTodo(todo.id, { sort_order: index + 1 });
					}
				});

				updatePromise = Promise.all(updates);
			}
		} else {
			// Same list reordering
			const listGroup = kanbanLists().find((group) => group.list.id === currentListId);
			if (listGroup) {
				const listTodos = listGroup.todos;
				const activeIndex = listTodos.findIndex((t: TodoFieldsFragment) => t.id === draggedId);
				let newIndex = position === 'above' ? targetIndex : targetIndex + 1;

				// Don't adjust for same-list moves (splice handles)
				if (activeIndex !== newIndex) {
					const newTodos = [...listTodos];
					const [removed] = newTodos.splice(activeIndex, 1);

					// Adjust insertion index if removed item before it
					if (activeIndex < newIndex) {
						newIndex--;
					}

					newTodos.splice(newIndex, 0, removed);

					updatePromise = Promise.all(
						newTodos.map((todo, index) => todosStore.updateTodo(todo.id, { sort_order: index + 1 }))
					);
				}
			}
		}

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
			<KanbanColumn {list} {todos} isHighlighted={hoveredListId === list.id} {dropPosition} />
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
