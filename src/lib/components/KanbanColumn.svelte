<!-- @file src/lib/components/KanbanColumn.svelte-->
<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { SortableContext, verticalListSortingStrategy } from '@dnd-kit-svelte/sortable';
	import { useDroppable } from '@dnd-kit-svelte/core';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import type { CanbanColumnProps } from '$lib/types/todo';

	let { list, todos, isHighlighted = false }: CanbanColumnProps = $props();

	let droppable = useDroppable({
		id: `column-${list.id}`
	});
	let { setNodeRef } = droppable;
	let columnElement: HTMLElement;

	$effect(() => {
		if (columnElement && setNodeRef) {
			setNodeRef(columnElement);
		}
	});
</script>

<div bind:this={columnElement} class="h-full">
	<Card
		class="h-fit transition-all duration-200 {isHighlighted
			? 'bg-blue-50 ring-2 ring-blue-500'
			: ''}"
	>
		<CardHeader>
			<CardTitle class="text-sm">{list.name}</CardTitle>
			<CardDescription class="text-xs">
				{todos.length} task{todos.length !== 1 ? 's' : ''}
			</CardDescription>
		</CardHeader>
		<CardContent class="min-h-24 space-y-2">
			{#if todos.length > 0}
				<SortableContext
					items={todos.map((todo) => todo.id)}
					strategy={verticalListSortingStrategy}
				>
					{#each todos as todo (todo.id)}
						<TodoItem {todo} />
					{/each}
				</SortableContext>
			{:else}
				<div class="py-8 text-center text-xs text-muted-foreground">Drop tasks here</div>
			{/if}
		</CardContent>
	</Card>
</div>
