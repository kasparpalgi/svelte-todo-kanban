<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
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
		useSensors,
		type DragEndEvent,
		type DragStartEvent,
		type DragOverEvent
	} from '@dnd-kit-svelte/core';
	import {
		SortableContext,
		sortableKeyboardCoordinates,
		verticalListSortingStrategy
	} from '@dnd-kit-svelte/sortable';
	import KanbanColumn from '$lib/components/KanbanColumn.svelte';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let activeId = $state<string | null>(null);
	let activeTodo = $state<TodoFieldsFragment | null>(null);

	let sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8
			}
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	// Group todos by list
	let kanbanLists = $derived(() => {
		const groups = new Map<string, { list: any; todos: TodoFieldsFragment[] }>();

		for (const todo of todosStore.todos.filter((t: TodoFieldsFragment) => !t.completed_at)) {
			const listId = todo.list?.id || 'unassigned';
			const listName = todo.list?.name || 'Unassigned';

			if (!groups.has(listId)) {
				groups.set(listId, {
					list: { id: listId, name: listName, sort_order: todo.list?.sort_order || 999 },
					todos: []
				});
			}
			groups.get(listId)!.todos.push(todo);
		}

		// Sort in lists by sort_order
		for (const group of groups.values()) {
			group.todos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
		}

		// Convert to array and sort by list sort_order
		return Array.from(groups.values()).sort(
			(a, b) => (a.list.sort_order || 999) - (b.list.sort_order || 999)
		);
	});

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo = todosStore.todos.find((todo: TodoFieldsFragment) => todo.id === activeId) || null;
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event;
		if (!over) return;

		const draggedId = active.id as string;
		const overId = over.id as string;

		if (overId.startsWith('column-')) {
			const newListId = overId.replace('column-', '');
			const todo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === draggedId);

			if (todo && todo.list?.id !== newListId) {
				console.log('Would move todo to list:', newListId);
			}
		}
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			activeId = null;
			activeTodo = null;
			return;
		}

		const draggedId = active.id as string;
		const overId = over.id as string;

		const draggedTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === draggedId);
		const overTodo = todosStore.todos.find((t: TodoFieldsFragment) => t.id === overId);

		if (!draggedTodo) {
			activeId = null;
			activeTodo = null;
			return;
		}

		if (overTodo && draggedTodo.list?.id === overTodo.list?.id) {
			const listGroup = kanbanLists().find((group: any) => group.list.id === draggedTodo.list?.id);

			if (listGroup) {
				const listTodos = listGroup.todos;
				const activeIndex = listTodos.findIndex((t: TodoFieldsFragment) => t.id === draggedId);
				const overIndex = listTodos.findIndex((t: TodoFieldsFragment) => t.id === overId);

				if (activeIndex !== overIndex) {
					const newTodos = [...listTodos];
					const [removed] = newTodos.splice(activeIndex, 1);
					newTodos.splice(overIndex, 0, removed);

					const updates = newTodos.map((todo, index) => ({
						id: todo.id,
						sort_order: index + 1
					}));

					for (const update of updates) {
						await todosStore.updateTodo(update.id, { sort_order: update.sort_order });
					}
				}
			}
		}

		activeId = null;
		activeTodo = null;
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	<DndContext
		{sensors}
		collisionDetection={closestCorners}
		onDragStart={handleDragStart}
		onDragOver={handleDragOver}
		onDragEnd={handleDragEnd}
	>
		{#each kanbanLists() as { list, todos } (list.id)}
			<KanbanColumn {list} {todos} />
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
				<CardTitle class="text-sm text-green-600">✓ Completed</CardTitle>
				<CardDescription class="text-xs">
					{todosStore.completedTodos.length} task{todosStore.completedTodos.length !== 1 ? 's' : ''}
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
						+{todosStore.completedTodos.length - 5} more completed
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
