<!-- @file src/routes/[[lang]]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import { actionState } from '$lib/stores/states.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Plus, X, List, LayoutGrid, Settings, Funnel } from 'lucide-svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';
	import TodoKanban from '$lib/components/todo/TodoKanban.svelte';
	import BoardManagement from '$lib/components/listBoard/BoardManagement.svelte';
	import ListManagement from '$lib/components/listBoard/ListManagement.svelte';
	import TodoFiltersSidebar from '$lib/components/todo/TodoFiltersSidebar.svelte';

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
		localStorage.setItem('todo-view-mode', viewMode);
	});

	async function handleAddTodo() {
		if (!newTodoTitle.trim()) return;

		let listId: string | undefined;

		if (listsStore.selectedBoard) {
			const boardLists = listsStore.lists.filter(
				(l) => l.board_id === listsStore.selectedBoard?.id
			);

			if (boardLists.length > 0) {
				listId = boardLists.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))[0].id;
			} else {
				listId = undefined;
			}
		}

		const result = await todosStore.addTodo(newTodoTitle.trim(), undefined, listId);
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
	<title>{listsStore.selectedBoard?.name} | ToDzz</title>
</svelte:head>

<div class="relative w-full">
	<div class="px-4 py-6">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="hidden text-3xl font-bold tracking-tight md:block">
				{listsStore.selectedBoard?.name}
			</h1>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 rounded-lg border p-1">
					<Button
						variant={viewMode === 'list' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (viewMode = 'list')}
						class="h-8"
					>
						<List class="mr-2 h-4 w-4" />
						<span class="hidden md:block">{$t('todo.list')}</span>
					</Button>
					<Button
						variant={viewMode === 'kanban' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (viewMode = 'kanban')}
						class="h-8"
					>
						<LayoutGrid class="mr-2 h-4 w-4" />
						<span class="hidden md:block">{$t('todo.kanban')}</span>
					</Button>
				</div>
				<Button
					variant="outline"
					size="sm"
					onclick={() => (actionState.edit = 'showListManagement')}
				>
					<Settings class="mr-2 h-4 w-4" />
					<span class="hidden md:block">{viewMode === 'kanban' ? 'Lists' : 'Categories'}</span>
				</Button>
				<Button
					variant={actionState.showFilters ? 'default' : 'outline'}
					size="sm"
					onclick={() => (actionState.showFilters = !actionState.showFilters)}
				>
					<Funnel class="mr-2 h-4 w-4" />
					<span class="hidden md:block">Filter</span>
				</Button>
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

	<div class="transition-all duration-300 {actionState.showFilters ? 'pr-80' : ''}">
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

	{#if actionState.showFilters}
		<TodoFiltersSidebar />
	{/if}
</div>

<BoardManagement />
<ListManagement />
