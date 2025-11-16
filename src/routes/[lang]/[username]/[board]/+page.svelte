<!-- @file src/routes/[lang]/[username]/[board]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import { actionState } from '$lib/stores/states.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte.js';
	import { userStore } from '$lib/stores/user.svelte';
	import { invitationsStore } from '$lib/stores/invitations.svelte';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Plus,
		X,
		List,
		LayoutGrid,
		Settings,
		Funnel,
		ArrowRight,
		Github,
		Bell
	} from 'lucide-svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';
	import TodoKanban from '$lib/components/todo/TodoKanban.svelte';
	import BoardManagement from '$lib/components/listBoard/BoardManagement.svelte';
	import ListManagement from '$lib/components/listBoard/ListManagement.svelte';
	import TodoFiltersSidebar from '$lib/components/todo/TodoFiltersSidebar.svelte';
	import ImportIssuesDialog from '$lib/components/github/ImportIssuesDialog.svelte';
	import CardModal from './CardModal.svelte';
	import NotesButton from '$lib/components/notes/NotesButton.svelte';
	import NotesView from '$lib/components/notes/NotesView.svelte';
	import BoardActivityButton from '$lib/components/activity/BoardActivityButton.svelte';
	import BoardActivityView from '$lib/components/activity/BoardActivityView.svelte';

	let { data } = $props();

	const openCardId = $derived(page.url.searchParams.get('card'));
	let newTodoTitle: string = $state('');
	let viewMode: 'list' | 'kanban' = $state('kanban');
	let boardNotFound: boolean = $state(false);
	let loading: boolean = $state(false);
	let showImportDialog: boolean = $state(false);
	let skipGithubIssue: boolean = $state(false);
	let showNotesDialog: boolean = $state(false);
	let showActivityDialog: boolean = $state(false);

	const username: string = $derived(page.params.username || '');
	const boardAlias: string = $derived(page.params.board || '');
	const lang: string = $derived(getEffectiveLocale(page.params.lang, userStore.user?.locale));
	const isNotMember: boolean = $derived.by(() => {
		const board = listsStore.selectedBoard;
		const currentUser = userStore.user;

		if (!board || !currentUser) return false;

		const isMember = board.board_members?.some((m: any) => m.user_id === currentUser.id);
		const isOwner = board.user?.id === currentUser.id;

		return !isMember && !isOwner;
	});

	const hasPendingInvitation: boolean = $derived.by(() => {
		const board = listsStore.selectedBoard;
		if (!isNotMember || !board) return false;
		return invitationsStore.myInvitations.some((inv: any) => inv.board_id === board.id);
	});

	// Function to load board and its todos
	async function loadBoardData(alias: string) {
		loading = true;

		if (data?.session) {
			// Ensure boards are loaded
			if (listsStore.boards.length === 0) {
				await listsStore.loadBoards();
			}

			const board = listsStore.boards.find((b: any) => b.alias === alias);

			if (board) {
				// Set selected board if different
				if (listsStore.selectedBoard?.id !== board.id) {
					listsStore.setSelectedBoard(board);
				}

				const currentUser = userStore.user;
				const isMember = board.board_members?.some((m: any) => m.user_id === currentUser?.id);
				const isOwner = board.user?.id === currentUser?.id;
				const notMember = !isMember && !isOwner;

				// Check if we need to load todos (first load or board changed)
				const needsToLoadTodos = !notMember && (!todosStore.initialized || todosStore.currentBoardId !== board.id);

				if (needsToLoadTodos) {
					// Load initial todos (top 50 with minimal data)
					await todosStore.loadTodosInitial(board.id);

					// Load remaining todos in the background (non-blocking)
					setTimeout(() => {
						todosStore.loadTodosRemaining(board.id);
					}, 100);
				}

				boardNotFound = false;
			} else {
				boardNotFound = true;
			}

			loading = false;
		}
	}

	onMount(async () => {
		// Load view mode preference
		const saved = localStorage.getItem('todo-view-mode');
		if (saved === 'list' || saved === 'kanban') {
			viewMode = saved;
		}

		// Load initial board
		await loadBoardData(boardAlias);
	});

	// React to board alias changes (when switching boards)
	$effect(() => {
		// Only load if we have a session and boards are already loaded (not first mount)
		if (data?.session && listsStore.boards.length > 0) {
			loadBoardData(boardAlias);
		}
	});

	$effect(() => {
		if (isNotMember) {
			invitationsStore.loadMyInvitations();
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
				(l: any) => l.board_id === listsStore.selectedBoard?.id
			);

			if (boardLists.length > 0) {
				listId = boardLists.sort(
					(a: any, b: any) => (a.sort_order || 999) - (b.sort_order || 999)
				)[0].id;
			}
		}

		const createGithubIssue = !!(listsStore.selectedBoard?.github && !skipGithubIssue);

		const result = await todosStore.addTodo(
			newTodoTitle.trim(),
			undefined,
			listId,
			true,
			createGithubIssue
		);
		if (result.success) {
			newTodoTitle = '';
			skipGithubIssue = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleAddTodo();
		}
	}

	function handleImportComplete() {
		todosStore.loadTodos();
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		// Only handle if not typing in an input field
		const target = event.target as HTMLElement;
		const isInputField =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable;

		if (isInputField) return;

		// Toggle filters sidebar with 'F' key
		if (event.key === 'f' || event.key === 'F') {
			event.preventDefault();
			actionState.showFilters = !actionState.showFilters;
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<title
		>{openCardId
			? todosStore.todos.find((t) => t.id === openCardId)?.title +
				' @ ' +
				listsStore.selectedBoard?.name
			: listsStore.selectedBoard?.name} | ToDzz</title
	>
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
{:else if isNotMember}
	<div class="py-12 text-center">
		<Card class="mx-auto max-w-md">
			<CardHeader>
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
				>
					<Bell class="h-6 w-6 text-primary" />
				</div>
				<CardTitle>{$t('common.invited')}</CardTitle>
				<CardDescription>
					{$t('common.invited_you')} "{listsStore.selectedBoard?.name}"
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if hasPendingInvitation}
					<p class="text-sm text-muted-foreground">
						<Bell class="inline h-4 w-4" />
						{$t('common.to_view')}
					</p>
				{:else}
					<p class="text-sm text-muted-foreground">
						{$t('common.no_board_or_permissions')}
					</p>
					<Button onclick={() => goto(`/${lang}`)} class="w-full">{$t('common.try_this')}</Button>
				{/if}
			</CardContent>
		</Card>
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
					<NotesButton onclick={() => (showNotesDialog = true)} />
					<BoardActivityButton onclick={() => (showActivityDialog = true)} />
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
									<label class="flex cursor-pointer items-center gap-2 text-sm">
										<input
											type="checkbox"
											bind:checked={skipGithubIssue}
											class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
										/>
										<Github class="h-3.5 w-3.5" />
										<span>{$t('todo.do_not_create_github_issue')}</span>
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

			{#if listsStore.selectedBoard?.github}
				<Button
					variant="outline"
					size="sm"
					onclick={() => (showImportDialog = true)}
					title="Import GitHub Issues"
				>
					<Github class="mr-2 h-4 w-4" />
					<span class="hidden md:block">Import</span>
				</Button>
			{/if}
			{#if !todosStore.loading}
				<Button
					onclick={() => goto(`/${lang}/${username}/${boardAlias}/mobile-add`)}
					variant="link"
					class="mt-4"
				>
					{$t('board.mobile_add')}<ArrowRight />
				</Button>
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
			lists={listsStore.lists.filter((l: any) => l.board_id === listsStore.selectedBoard?.id)}
			onImportComplete={handleImportComplete}
		/>
	{/if}

	{#if openCardId}
		<CardModal
			cardId={openCardId}
			{lang}
			onClose={() => goto(`/${lang}/${username}/${boardAlias}`)}
		/>
	{/if}

	{#if showNotesDialog && listsStore.selectedBoard}
		<NotesView bind:open={showNotesDialog} boardId={listsStore.selectedBoard.id} />
	{/if}

	{#if showActivityDialog && listsStore.selectedBoard}
		<BoardActivityView
			bind:open={showActivityDialog}
			boardId={listsStore.selectedBoard.id}
			boardName={listsStore.selectedBoard.name}
		/>
	{/if}
{/if}
