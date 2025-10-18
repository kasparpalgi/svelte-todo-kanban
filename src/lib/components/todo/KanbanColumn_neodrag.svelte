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
		onDelete
	}: {
		list: { id: string; name: string };
		todos: TodoFieldsFragment[];
		draggedTodo: TodoFieldsFragment | null;
		dropTarget: {
			listId: string;
			index: number;
			position: 'above' | 'below';
		} | null;
		onDragStart: (todo: TodoFieldsFragment) => void;
		onDragEnd: () => void;
		onDelete: (todoId: string) => void;
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
		{#each todos as todo, idx (todo.id)}
			{@const isDropTargetInThisList = dropTarget?.listId === list.id}
			{@const sourceListId = draggedTodo?.list?.id || 'inbox'}
			{@const isSameList = isDropTargetInThisList && sourceListId === list.id}
			{@const isDraggedCard = draggedTodo?.id === todo.id}

			<!-- For same list: dropTarget.index is in "filtered" space (excluding dragged card) -->
			<!-- For different list: dropTarget.index is in "full" space -->
			{@const targetIndex = dropTarget?.index ?? -1}

			<!-- Calculate which index this card is at in the filtered list (for same-list) -->
			{@const filteredIndex = isSameList && draggedTodo
				? todos.filter((t) => t.id !== draggedTodo.id).findIndex((t) => t.id === todo.id)
				: idx}

			{@const showAbove = isDropTargetInThisList &&
				targetIndex === filteredIndex &&
				dropTarget?.position === 'above'}

			{@const showBelow = isDropTargetInThisList &&
				targetIndex === filteredIndex &&
				dropTarget?.position === 'below'}

			<TodoItemNeodrag
				{todo}
				{draggedTodo}
				isDragging={isDraggedCard}
				showDropAbove={showAbove}
				showDropBelow={showBelow}
				listId={list.id}
				{onDragStart}
				{onDragEnd}
				{onDelete}
			/>
		{/each}

		<!-- Show drop indicator at the end of the list -->
		{#if dropTarget?.listId === list.id}
			{@const sourceListId = draggedTodo?.list?.id || 'inbox'}
			{@const isSameList = sourceListId === list.id}
			{@const filteredLength = isSameList && draggedTodo
				? todos.filter((t) => t.id !== draggedTodo.id).length
				: todos.length}

			{#if dropTarget.index >= filteredLength}
				<div class="h-1 rounded bg-primary shadow-lg shadow-primary/50"></div>
			{/if}
		{/if}
	</CardContent>
</Card>