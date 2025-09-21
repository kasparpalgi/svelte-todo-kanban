<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { Button } from '$lib/components/ui/button';
	import { X, GripVertical } from 'lucide-svelte';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	interface Props {
		todo: TodoFieldsFragment;
		isDragging?: boolean;
	}

	let { todo, isDragging = false }: Props = $props();

	let sortable = useSortable({ id: todo.id });
	let { attributes, listeners, setNodeRef, transform, isDragging: sortableIsDragging } = sortable;

	let style = $derived(transform.current ? CSS.Transform.toString(transform.current) : '');
</script>

<div
	use:setNodeRef
	{style}
	class="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
	class:opacity-50={sortableIsDragging.current || isDragging}
	class:shadow-lg={sortableIsDragging.current || isDragging}
>
	<button
		class="cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground active:cursor-grabbing"
		{...attributes.current}
		{...listeners.current}
	>
		<GripVertical class="h-4 w-4" />
	</button>

	<Button
		onclick={() => todosStore.toggleTodo(todo.id)}
		variant="ghost"
		size="sm"
		class="h-6 w-6 rounded-full border-2 p-0 hover:border-primary"
	>
		<span class="sr-only">Mark as complete</span>
	</Button>

	<div class="min-w-0 flex-1">
		<h3 class="leading-none font-medium">{todo.title}</h3>
		{#if todo.content}
			<p class="mt-1 text-sm text-muted-foreground">{todo.content}</p>
		{/if}
		{#if todo.due_on}
			<p class="mt-1 text-xs text-muted-foreground">
				Due: {new Date(todo.due_on).toLocaleDateString()}
			</p>
		{/if}
	</div>

	<Button
		onclick={() => todosStore.deleteTodo(todo.id)}
		variant="ghost"
		size="sm"
		class="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100"
	>
		<X class="h-4 w-4" />
	</Button>
</div>
