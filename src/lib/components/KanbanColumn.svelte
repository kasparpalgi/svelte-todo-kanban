<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	interface Props {
		list: { id: string; name: string; sort_order: number };
		todos: TodoFieldsFragment[];
	}

	let { list, todos }: Props = $props();
</script>

<Card class="h-fit">
	<CardHeader>
		<CardTitle class="text-sm">{list.name}</CardTitle>
		<CardDescription class="text-xs">
			{todos.length} task{todos.length !== 1 ? 's' : ''}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2">
		{#if todos.length > 0}
			{#each todos as todo (todo.id)}
				<TodoItem {todo} />
			{/each}
		{:else}
			<div class="py-4 text-center text-xs text-muted-foreground">Drop tasks here</div>
		{/if}
	</CardContent>
</Card>
