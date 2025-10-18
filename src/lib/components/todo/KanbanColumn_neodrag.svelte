<!-- @file src/lib/components/todo/KanbanColumn_neodrag.svelte -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import TodoItemNeodrag from './TodoItem_neodrag.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import { t } from '$lib/i18n';

	let {
		list,
		todos,
		draggedTodo,
		dropTarget,
		onDragStart,
		onDragEnd,
		onDelete,
		onDragMove // Add this
	}: {
		list: { id: string; name: string };
		todos: TodoFieldsFragment[];
		draggedTodo: TodoFieldsFragment | null;
		dropTarget: {
			listId: string;
			hoveredTodoId: string | null;
			position: 'above' | 'below';
		} | null;
		onDragStart: (todo: TodoFieldsFragment) => void;
		onDragEnd: () => void;
		onDelete: (todoId: string) => void;
		onDragMove: (e: MouseEvent) => void; // Add this
	} = $props();
</script>

<Card data-list-id={list.id} class="flex flex-col">
	<CardHeader>
		<CardTitle class="text-sm font-medium">{list.name}</CardTitle>
		<CardDescription class="text-xs">
			{todos.length} {todos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
		</CardDescription>
	</CardHeader>
	<CardContent class="flex-grow space-y-2">
		<!-- Show a drop zone if the list is empty or if dragging over the empty space at the bottom -->
		{#if (todos.length === 0 && dropTarget?.listId === list.id) || (dropTarget?.listId === list.id && dropTarget.hoveredTodoId === null)}
			<div class="h-20 rounded-md border-2 border-dashed border-primary/50 bg-primary/10"></div>
		{/if}

		{#each todos as todo (todo.id)}
			{@const isDropTargetInThisList = dropTarget?.listId === list.id}
			{@const isHoveredCard = isDropTargetInThisList && dropTarget?.hoveredTodoId === todo.id}

			<TodoItemNeodrag
				{todo}
				{draggedTodo}
				isDragging={draggedTodo?.id === todo.id}
				showDropAbove={isHoveredCard && dropTarget?.position === 'above'}
				showDropBelow={isHoveredCard && dropTarget?.position === 'below'}
				listId={list.id}
				{onDragStart}
				{onDragEnd}
				{onDelete}
				{onDragMove}
			/>
		{/each}
	</CardContent>
</Card>