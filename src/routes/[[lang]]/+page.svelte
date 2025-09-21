<!-- @file src/routes/[[lang]]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Plus, Check, X } from 'lucide-svelte';

	let { data } = $props();

	let newTodoTitle = $state('');

	onMount(() => {
		if (data?.session) {
			todosStore.loadTodos();
		}
	});

	$effect(() => {
		if (data?.session && !todosStore.initialized && !todosStore.loading) {
			todosStore.loadTodos();
		}
	});

	async function handleAddTodo() {
		if (!newTodoTitle.trim()) return;

		const result = await todosStore.addTodo(newTodoTitle.trim());
		if (result.success) {
			newTodoTitle = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleAddTodo();
		}
	}
</script>

<svelte:head>
	<title>{$t('todo.today') || 'Today'}</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">{$t('todo.today') || 'Today'}</h1>
	</div>

	{#if todosStore.error}
		<Card class="border-destructive/50 bg-destructive/5">
			<CardContent class="flex items-center justify-between pt-6">
				<p class="text-destructive">{todosStore.error}</p>
				<Button
					onclick={() => todosStore.clearError()}
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
				>
					<X class="h-4 w-4" />
				</Button>
			</CardContent>
		</Card>
	{/if}

	<!-- Quick add -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Add New Task</CardTitle>
			<CardDescription>What would you like to accomplish today?</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex gap-3">
				<Input
					type="text"
					placeholder="Enter task title..."
					bind:value={newTodoTitle}
					onkeydown={handleKeydown}
					class="flex-1"
				/>
				<Button onclick={handleAddTodo} disabled={!newTodoTitle.trim()} class="px-6">
					<Plus class="mr-2 h-4 w-4" />
					Add
				</Button>
			</div>
		</CardContent>
	</Card>

	<div class="grid gap-6">
		<!-- List -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>Active Tasks</CardTitle>
						<CardDescription>
							{todosStore.activeTodos.length} task{todosStore.activeTodos.length !== 1 ? 's' : ''} remaining
						</CardDescription>
					</div>
					{#if !todosStore.initialized && !todosStore.loading}
						<Button onclick={() => todosStore.loadTodos()} variant="outline">Load Todos</Button>
					{/if}
				</div>
			</CardHeader>
			<CardContent class="space-y-3">
				{#if todosStore.loading}
					<div class="flex items-center justify-center py-8">
						<div
							class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
						></div>
						<span class="ml-3 text-sm text-muted-foreground">Loading your todos...</span>
					</div>
				{:else if todosStore.activeTodos.length > 0}
					{#each todosStore.activeTodos as todo (todo.id)}
						<div
							class="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
						>
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
								class="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 hover:text-destructive"
							>
								<X class="h-4 w-4" />
								<span class="sr-only">Delete todo</span>
							</Button>
						</div>
					{/each}
				{:else if todosStore.initialized}
					<div class="py-8 text-center text-muted-foreground">
						<p class="text-lg">No active tasks</p>
						<p class="text-sm">Add a new task above to get started!</p>
					</div>
				{:else}
					<div class="py-8 text-center text-muted-foreground">
						<p>Ready to load your todos</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Completed -->
		{#if todosStore.completedTodos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Check class="h-5 w-5 text-green-600" />
						Completed Tasks
					</CardTitle>
					<CardDescription>
						{todosStore.completedTodos.length} completed task{todosStore.completedTodos.length !== 1
							? 's'
							: ''}
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2">
					{#each todosStore.completedTodos as todo (todo.id)}
						<div
							class="flex items-center gap-3 rounded-lg border p-3 opacity-75 transition-opacity hover:opacity-100"
						>
							<Button
								onclick={() => todosStore.toggleTodo(todo.id)}
								variant="ghost"
								size="sm"
								class="h-6 w-6 rounded-full border-2 border-green-600 bg-green-100 p-0 hover:bg-green-200"
							>
								<Check class="h-3 w-3 text-green-700" />
								<span class="sr-only">Mark as incomplete</span>
							</Button>

							<div class="min-w-0 flex-1">
								<h3 class="leading-none font-medium text-muted-foreground line-through">
									{todo.title}
								</h3>
								{#if todo.content}
									<p class="mt-1 text-sm text-muted-foreground line-through">{todo.content}</p>
								{/if}
								<p class="mt-1 text-xs text-muted-foreground">
									Completed: {new Date(todo.completed_at || '').toLocaleDateString()}
								</p>
							</div>
						</div>
					{/each}
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
