<!-- @file src/routes/[lang]/[username]/[board]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
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
	import { Plus, X, List, LayoutGrid, Settings, Funnel, ArrowRight, GithubIcon } from 'lucide-svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';
	import TodoKanban from '$lib/components/todo/TodoKanban.svelte';
	import BoardManagement from '$lib/components/listBoard/BoardManagement.svelte';
	import ListManagement from '$lib/components/listBoard/ListManagement.svelte';
	import TodoFiltersSidebar from '$lib/components/todo/TodoFiltersSidebar.svelte';
	import ImportIssuesDialog from '$lib/components/github/ImportIssuesDialog.svelte';

	let { data } = $props();

	let newTodoTitle = $state('');
	let viewMode = $state<'list' | 'kanban'>('kanban');
	let boardNotFound = $state(false);
	let loading = $state(true);
	let showImportDialog = $state(false);
	let createGithubIssue = $state(false);
	const username = $derived(page.params.username);
	const boardAlias = $derived(page.params.board);
	const lang = $derived(page.params.lang || 'en');

	onMount(async () => {
		if (data?.session) {
			await listsStore.loadBoards();
			const board = listsStore.boards.find((b) => b.alias === boardAlias);

			if (board) {
				listsStore.setSelectedBoard(board);
				todosStore.loadTodos();
				boardNotFound = false;
			} else {
				boardNotFound = true;
			}

			loading = false;
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

		const result = await todosStore.addTodo(newTodoTitle.trim(), undefined, listId, true, createGithubIssue);
		if (result.success) {
			newTodoTitle = '';
			createGithubIssue = false; // Reset checkbox after todo creation
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleAddTodo();
		}
	}

	function handleImportComplete() {
		// Reload todos after import
		todosStore.loadTodos();
	}
</script>

<svelte:head>
	<title>{listsStore.selectedBoard?.name} | ToDzz</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
		></div>
		<span class="ml-3 text-muted-foreground">Loading board...</span>
	</div>
{:else if boardNotFound}
	<div class="py-12 text-center">
		<h1 class="mb-4 text-2xl font-bold text-muted-foreground">Board not found</h1>
		<p class="mb-4 text-muted-foreground">
			The board "{boardAlias}" by user "{username}" could not be found.
		</p>
		<Button onclick={() => goto(`/${lang}`)}>Go back to boards</Button>
	</div>
{:else}
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
					{#if listsStore.selectedBoard?.github}
						<Button
							variant="outline"
							size="sm"
							onclick={() => (showImportDialog = true)}
							title="Import GitHub Issues"
						>
							<GithubIcon class="mr-2 h-4 w-4" />
							<span class="hidden md:block">Import Issues</span>
						</Button>
					{/if}
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
							<div class="space-y-3">
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
							{#if listsStore.selectedBoard?.github}
								<label class="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="checkbox"
										bind:checked={createGithubIssue}
										class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
									/>
									<GithubIcon class="h-3.5 w-3.5" />
									<span>Create GitHub issue</span>
								</label>
							{/if}
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

			{#if !todosStore.loading}
				<Button
					onclick={() => goto(`/${lang}/${username}/${boardAlias}/mobile-add`)}
					variant="link"
					class="mt-4">Mobile quick add (for adding to homescreen)<ArrowRight /></Button
				>
			{/if}
		</div>

		{#if actionState.showFilters}
			<TodoFiltersSidebar />
		{/if}
	</div>

	<BoardManagement />
	<ListManagement />

	{#if listsStore.selectedBoard?.github && showImportDialog}
		<ImportIssuesDialog
			bind:open={showImportDialog}
			boardId={listsStore.selectedBoard.id}
			boardName={listsStore.selectedBoard.name}
			lists={listsStore.lists.filter((l) => l.board_id === listsStore.selectedBoard?.id)}
			onImportComplete={handleImportComplete}
		/>
	{/if}
{/if}
