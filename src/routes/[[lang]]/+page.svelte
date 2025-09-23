<!-- @file src/routes/[[lang]]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import { actionState } from '$lib/stores/errorSuccess.svelte.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Plus, X, List, LayoutGrid, Settings } from 'lucide-svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';
	import TodoKanban from '$lib/components/todo/TodoKanban.svelte';
	import ListBoardManager from '$lib/components/listBoard/ListBoardManager.svelte';

	let { data } = $props();

	let newTodoTitle = $state('');
	let viewMode = $state<'list' | 'kanban'>('kanban');

	onMount(() => {
		if (data?.session) {
			todosStore.loadTodos();
		}

		const saved = localStorage.getItem('todo-view-mode');
		if (saved === 'list' || saved === 'kanban') {
			viewMode = saved;
		}
	});

	$effect(() => {
		if (data?.session && !todosStore.initialized && !todosStore.loading) {
			todosStore.loadTodos();
		}
	});

	$effect(() => {
		// TODO: save to DB
		localStorage.setItem('todo-view-mode', viewMode);
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
	<title>{$t('todo.today')}</title>
</svelte:head>

<div class="w-full">
	<div class="px-4 py-6">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold tracking-tight">{$t('todo.today')}</h1>
			<div class="flex items-center gap-4">
				<Button variant="outline" onclick={() => (actionState.value = 'showManagementDialog')}>
					<Settings class="mr-2 h-4 w-4" />
					Manage Lists & Boards
				</Button>

				<div class="flex items-center gap-2 rounded-lg border p-1">
					<Button
						variant={viewMode === 'list' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (viewMode = 'list')}
						class="h-8"
					>
						<List class="mr-2 h-4 w-4" />
						{$t('todo.list')}
					</Button>
					<Button
						variant={viewMode === 'kanban' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (viewMode = 'kanban')}
						class="h-8"
					>
						<LayoutGrid class="mr-2 h-4 w-4" />
						{$t('todo.kanban')}
					</Button>
				</div>
			</div>
		</div>

		{#if todosStore.error}
			<Card class="mx-4 mb-6 border-destructive/50 bg-destructive/5">
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
	</div>

	{#if viewMode === 'list'}
		<div class="mb-3 px-4">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">{$t('todo.add_new_task')}</CardTitle>
					<CardDescription>{$t('todo.what_accomplish')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex gap-3">
						<Input
							type="text"
							placeholder={$t('todo.enter_task_title')}
							bind:value={newTodoTitle}
							onkeydown={handleKeydown}
							class="flex-1"
						/>
						<Button onclick={handleAddTodo} disabled={!newTodoTitle.trim()} class="px-6">
							<Plus class="mr-2 h-4 w-4" />
							{$t('todo.add')}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Loading State -->
	{#if todosStore.loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
			<span class="ml-3 text-muted-foreground">{$t('todo.loading_todos')}</span>
		</div>
	{:else if !todosStore.initialized}
		<div class="py-12 text-center text-muted-foreground">
			<Button onclick={() => todosStore.loadTodos()} variant="outline"
				>{$t('todo.load_todos')}</Button
			>
		</div>
	{:else if viewMode === 'list'}
		<div class="px-4">
			<TodoList />
		</div>
	{:else}
		<TodoKanban />
	{/if}
</div>

<ListBoardManager />
