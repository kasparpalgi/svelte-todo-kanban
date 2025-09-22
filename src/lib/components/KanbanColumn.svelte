<!-- @file src/lib/components/KanbanColumn.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
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
				{todos.length}
				{todos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
			</CardDescription>
		</CardHeader>
		<CardContent class="min-h-24 space-y-2">
			{#if todos.length > 0}
				<SortableContext
					items={todos.map((todo) => todo.id)}
					strategy={verticalListSortingStrategy}
				>
					{#each todos as todo, index (todo.id)}
						<!-- Show indicator above for specific todo items, not column drops -->
						{#if dropPosition?.listId === list.id && dropPosition?.todoId === todo.id && dropPosition?.position === 'above'}
							<div
								class="h-1 w-full rounded-full bg-blue-500 opacity-80 transition-all duration-200"
								style="box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);"
							></div>
						{/if}

						<!-- Show indicator above first item for column drops -->
						{#if index === 0 && dropPosition?.listId === list.id && dropPosition?.todoId === 'column' && dropPosition?.position === 'above'}
							<div
								class="h-1 w-full rounded-full bg-blue-500 opacity-80 transition-all duration-200"
								style="box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);"
							></div>
						{/if}

						<TodoItem {todo} />

						<!-- Show indicator below -->
						{#if dropPosition?.listId === list.id && dropPosition?.todoId === todo.id && dropPosition?.position === 'below'}
							<div
								class="h-1 w-full rounded-full bg-blue-500 opacity-80 transition-all duration-200"
								style="box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);"
							></div>
						{/if}
					{/each}
				</SortableContext>
			{:else}
				<!-- Empty list indicator -->
				{#if dropPosition?.listId === list.id && dropPosition?.todoId === 'column'}
					<div
						class="h-1 w-full rounded-full bg-blue-500 opacity-80 transition-all duration-200"
						style="box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);"
					></div>
				{/if}
				<div class="py-8 text-center text-xs text-muted-foreground">
					{$t('todo.drop_tasks_here')}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
