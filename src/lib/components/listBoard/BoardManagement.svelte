<!-- @file src/lib/components/listBoard/BoardManagement.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Plus,
		Trash2,
		SquarePen,
		Layers,
		Ellipsis,
		Users,
		Globe,
		ChevronUp,
		ChevronDown,
		FileText
	} from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import GithubRepoSelector from './GithubRepoSelector.svelte';
	import BoardMembers from './BoardMembers.svelte';
	import BoardVisibilitySettings from './BoardVisibilitySettings.svelte';
	import BoardCustomerInvoiceDetails from './BoardCustomerInvoiceDetails.svelte';
	import githubLogo from '$lib/assets/github.svg';

	let showBoardDialog = $state(false);
	let editingBoard = $state<{ id: string; name: string; github?: string | null } | null>(null);
	let newBoardName = $state('');
	let showGithubDialog = $state(false);
	let selectedBoardForGithub = $state<{ id: string; name: string; github?: string | null } | null>(
		null
	);
	let showMembersDialog = $state(false);
	let selectedBoardForMembers = $state<any>(null);
	let showVisibilityDialog = $state(false);
	let selectedBoardForVisibility = $state<any>(null);
	let showInvoiceDialog = $state(false);
	let selectedBoardForInvoice = $state<any>(null);

	const hasGithubConnected = $derived(userStore.hasGithubConnected);
	const currentUser = $derived(userStore.user);

	const ownedBoards = $derived(() => {
		return listsStore.sortedBoards.filter((board) => board.user?.id === currentUser?.id);
	});

	const sharedBoards = $derived(() => {
		return listsStore.sortedBoards.filter((board) => board.user?.id !== currentUser?.id);
	});

	function formatGithubRepo(github: any): string | null {
		if (!github) return null;

		try {
			const githubData = typeof github === 'string' ? JSON.parse(github) : github;
			if (githubData.owner && githubData.repo) {
				return `${githubData.owner}/${githubData.repo}`;
			}
		} catch (e) {
			console.error('Error parsing GitHub data:', e);
		}

		return null;
	}

	$effect(() => {
		listsStore.loadBoards();
	});

	const todoCountByBoard = $derived(() => {
		const counts = new Map<string, number>();
		for (const todo of todosStore.todos) {
			const boardId = todo.list?.board?.id;
			if (boardId) {
				counts.set(boardId, (counts.get(boardId) || 0) + 1);
			}
		}
		return counts;
	});

	async function handleCreateBoard() {
		if (!newBoardName.trim()) return;

		const result = await listsStore.createBoard(newBoardName.trim());

		if (result.success) {
			displayMessage($t('board.board_created'), 1500, true);
			newBoardName = '';
			showBoardDialog = false;
		} else {
			displayMessage(result.message);
		}
	}

	async function handleUpdateBoard(id: string, name: string) {
		if (!name.trim()) return;

		const result = await listsStore.updateBoard(id, { name: name.trim() });

		if (result.success) {
			displayMessage($t('board.board_updated'), 1500, true);
			editingBoard = null;
		} else {
			displayMessage(result.message);
		}
	}

	async function handleDeleteBoard(id: string, boardName: string) {
		const todoCount = todoCountByBoard().get(id) || 0;
		const listsInBoard = listsStore.lists.filter((l) => l.board_id === id);

		let confirmMessage = `${$t('common.delete')} "${boardName}"`;
		if (listsInBoard.length > 0 || todoCount > 0) {
			confirmMessage = `${$t('board.delete_board_with_items')} ${todoCount}`;
		}

		if (!confirm(confirmMessage)) return;

		const result = await listsStore.deleteBoard(id);

		if (result.success) {
			displayMessage($t('board.board_deleted'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	function startEditBoard(board: { id: string; name: string; github?: string | null }) {
		editingBoard = { ...board };
	}

	function openGithubSelector(board: { id: string; name: string; github?: string | null }) {
		selectedBoardForGithub = board;
		showGithubDialog = true;
	}

	async function handleGithubRepoSelected(repo: string | null) {
		if (!selectedBoardForGithub) return;

		let githubData: string | null = null;
		if (repo) {
			const [owner, repoName] = repo.split('/');
			githubData = JSON.stringify({ owner, repo: repoName, full_name: repo });
		}

		const result = await listsStore.updateBoard(selectedBoardForGithub.id, {
			github: githubData
		});

		if (result.success) {
			displayMessage(
				repo ? $t('github.repo_connected') : $t('github.repo_disconnected'),
				1500,
				true
			);
			showGithubDialog = false;
			selectedBoardForGithub = null;
		} else {
			displayMessage(result.message);
		}
	}

	function handleBoardKeydown(event: KeyboardEvent, id: string, name: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleUpdateBoard(id, name);
		} else if (event.key === 'Escape') {
			editingBoard = null;
		}
	}

	function openMembersDialog(board: any) {
		selectedBoardForMembers = board;
		showMembersDialog = true;
	}

	function openVisibilityDialog(board: any) {
		selectedBoardForVisibility = board;
		showVisibilityDialog = true;
	}

	function openInvoiceDialog(board: any) {
		selectedBoardForInvoice = board;
		showInvoiceDialog = true;
	}

	async function moveBoardUp(boardId: string) {
		const boards = ownedBoards();
		const currentIndex = boards.findIndex((b) => b.id === boardId);

		if (currentIndex <= 0) return;

		const temp = boards[currentIndex];
		boards[currentIndex] = boards[currentIndex - 1];
		boards[currentIndex - 1] = temp;

		try {
			await Promise.all([
				listsStore.updateBoard(boards[currentIndex].id, { sort_order: currentIndex + 1 }),
				listsStore.updateBoard(boards[currentIndex - 1].id, { sort_order: currentIndex })
			]);
			await listsStore.loadBoards();
		} catch (error) {
			console.error('Failed to move board up:', error);
			displayMessage($t('board.failed_reorder'));
		}
	}

	async function moveBoardDown(boardId: string) {
		const boards = ownedBoards();
		const currentIndex = boards.findIndex((b) => b.id === boardId);

		if (currentIndex === -1 || currentIndex >= boards.length - 1) return;

		const temp = boards[currentIndex];
		boards[currentIndex] = boards[currentIndex + 1];
		boards[currentIndex + 1] = temp;

		try {
			await Promise.all([
				listsStore.updateBoard(boards[currentIndex].id, { sort_order: currentIndex + 1 }),
				listsStore.updateBoard(boards[currentIndex + 1].id, { sort_order: currentIndex + 2 })
			]);
			await listsStore.loadBoards();
		} catch (error) {
			console.error('Failed to move board down:', error);
			displayMessage($t('board.failed_reorder'));
		}
	}

	async function handleUpdateBoardSettings(boardId: string, enable: boolean) {
		const board = listsStore.boards.find((b) => b.id === boardId);
		if (!board) return;

		const newSettings = { ...board.settings, enable_hour_tracking: enable };

		const result = await listsStore.updateBoard(boardId, {
			settings: newSettings
		});

		if (result.success) {
			displayMessage($t('board.settings_updated'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}
</script>

{#if actionState.edit === 'showBoardManagement'}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
		onclick={() => (actionState.edit = '')}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (actionState.edit = '')}
	>
		<div
			class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg"
			onclick={(e) => e.stopPropagation()}
			tabindex="0"
			role="button"
			aria-label="Manage boards"
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-semibold">{$t('board.manage_boards')}</h3>
				<Button variant="ghost" onclick={() => (actionState.edit = '')}>✕</Button>
			</div>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
					<div class="flex items-center gap-2">
						<Layers class="h-5 w-5" />
						<CardTitle class="text-lg">{$t('board.boards')}</CardTitle>
						<Badge variant="secondary">{listsStore.boards.length}</Badge>
					</div>
					<Dialog bind:open={showBoardDialog}>
						<DialogTrigger>
							<Button size="sm" class="h-8">
								<Plus class="mr-1 h-3 w-3" />
								{$t('board.new_board')}
							</Button>
						</DialogTrigger>
						<DialogContent class="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>{$t('board.create_new_board')}</DialogTitle>
								<DialogDescription>
									{$t('board.board_help_text')}
								</DialogDescription>
							</DialogHeader>
							<div class="grid gap-4 py-4">
								<div class="grid gap-2">
									<label for="board-name" class="text-sm font-medium"
										>{$t('board.board_name_label')}</label
									>
									<Input
										id="board-name"
										bind:value={newBoardName}
										placeholder={$t('board.board_name_placeholder')}
										onkeydown={(e) => e.key === 'Enter' && handleCreateBoard()}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onclick={() => (showBoardDialog = false)}
									>{$t('common.cancel')}</Button
								>
								<Button onclick={handleCreateBoard} disabled={!newBoardName.trim()}>
									{$t('board.create_board')}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if listsStore.boards.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							<Layers class="mx-auto h-12 w-12 opacity-20" />
							<p class="mt-2 text-sm">{$t('board.no_boards_yet')}</p>
							<p class="text-xs">{$t('board.create_board_prompt')}</p>
						</div>
					{:else}
						{#if ownedBoards().length > 0}
							<div class="space-y-2">
								{#each ownedBoards() as board, index (board.id)}
									<div class="flex items-center gap-2 rounded border p-2">
										<div class="flex flex-col gap-0.5">
											<Button
												variant="ghost"
												size="sm"
												class="h-5 w-5 p-0"
												disabled={index === 0}
												onclick={() => moveBoardUp(board.id)}
											>
												<ChevronUp class="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												class="h-5 w-5 p-0"
												disabled={index === ownedBoards().length - 1}
												onclick={() => moveBoardDown(board.id)}
											>
												<ChevronDown class="h-3 w-3" />
											</Button>
										</div>

										{#if editingBoard?.id === board.id}
											<Input
												bind:value={editingBoard.name}
												class="h-8 flex-1"
												onkeydown={(e) => handleBoardKeydown(e, board.id, editingBoard?.name || '')}
												onblur={() => handleUpdateBoard(board.id, editingBoard?.name || '')}
											/>
										{:else}
											<div class="flex flex-1 flex-col gap-1">
												<span class="font-medium">{board.name}</span>
												{#if formatGithubRepo(board.github)}
													<span class="flex items-center gap-1 text-xs text-muted-foreground">
														<img src={githubLogo} alt="GitHub" class="h-4 w-4" />
														{formatGithubRepo(board.github)}
													</span>
												{/if}
											</div>
										{/if}

										<Badge variant="outline" class="text-xs">
											{todoCountByBoard().get(board.id) || 0}
											{$t('board.tasks_count')}
										</Badge>

										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
													<Ellipsis class="h-3 w-3" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onclick={() => startEditBoard(board)}>
													<SquarePen class="mr-2 h-3 w-3" />
													{$t('board.edit_name')}
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => openMembersDialog(board)}>
													<Users class="mr-2 h-3 w-3" />
													{$t('board.manage_members')}
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => openVisibilityDialog(board)}>
													<Globe class="mr-2 h-3 w-3" />
													{$t('board.sharing_visibility')}
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => openInvoiceDialog(board)}>
													<FileText class="mr-2 h-3 w-3" />
													Customer Invoice Details
												</DropdownMenuItem>
												{#if hasGithubConnected}
													<DropdownMenuItem onclick={() => openGithubSelector(board)}>
														<img src={githubLogo} alt="GitHub" class="mr-2 h-3 w-3" />
														{board.github
															? $t('board.change_github_repo')
															: $t('board.connect_github_repo')}
													</DropdownMenuItem>
												{/if}
												<DropdownMenuSeparator />
												<div class="px-2 py-1.5 text-sm">
													<Label
														for="hour-tracking-switch-{board.id}"
														class="flex cursor-pointer items-center gap-2"
													>
														<Switch
															id="hour-tracking-switch-{board.id}"
															checked={board.settings?.enable_hour_tracking ?? false}
															onCheckedChange={() =>
																handleUpdateBoardSettings(
																	board.id,
																	!board.settings?.enable_hour_tracking
																)}
														/>
														<span>{$t('board.enable_hour_tracking')}</span>
													</Label>
												</div>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onclick={() => handleDeleteBoard(board.id, board.name)}
													class="text-red-600"
												>
													<Trash2 class="mr-2 h-3 w-3" />
													{$t('common.delete')}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								{/each}
							</div>
						{/if}

						{#if sharedBoards().length > 0}
							{#if ownedBoards().length > 0}
								<div class="my-4 flex items-center gap-2 text-sm text-muted-foreground">
									<div class="h-px flex-1 bg-border"></div>
									s<span>{$t('board.shared_with_me')}</span>
									<div class="h-px flex-1 bg-border"></div>
								</div>
							{/if}
							<div class="space-y-2">
								{#each sharedBoards() as board (board.id)}
									<div class="flex items-center gap-2 rounded border p-2 opacity-80">
										{#if editingBoard?.id === board.id}
											<Input
												bind:value={editingBoard.name}
												class="h-8 flex-1"
												onkeydown={(e) => handleBoardKeydown(e, board.id, editingBoard?.name || '')}
												onblur={() => handleUpdateBoard(board.id, editingBoard?.name || '')}
											/>
										{:else}
											<div class="flex flex-1 flex-col gap-1">
												<span class="font-medium">{board.name}</span>
												{#if board.user?.username}
													<span class="text-xs text-muted-foreground"
														>{$t('board.by_user')} @{board.user.username}</span
													>
												{/if}
												{#if formatGithubRepo(board.github)}
													<span class="flex items-center gap-1 text-xs text-muted-foreground">
														<img src={githubLogo} alt="GitHub" class="h-4 w-4" />
														{formatGithubRepo(board.github)}
													</span>
												{/if}
											</div>
										{/if}

										<Badge variant="outline" class="text-xs">
											{todoCountByBoard().get(board.id) || 0}
											{$t('board.tasks_count')}
										</Badge>

										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
													<Ellipsis class="h-3 w-3" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onclick={() => openMembersDialog(board)}>
													<Users class="mr-2 h-3 w-3" />
													{$t('board.view_members')}
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => openVisibilityDialog(board)}>
													<Globe class="mr-2 h-3 w-3" />
													{$t('board.view_visibility')}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
{/if}

{#if showGithubDialog && selectedBoardForGithub}
	<GithubRepoSelector
		bind:open={showGithubDialog}
		currentRepo={selectedBoardForGithub.github}
		boardId={selectedBoardForGithub.id}
		onSelect={handleGithubRepoSelected}
	/>
{/if}

{#if showMembersDialog && selectedBoardForMembers}
	<BoardMembers
		board={selectedBoardForMembers}
		bind:open={showMembersDialog}
		onClose={() => {
			showMembersDialog = false;
			selectedBoardForMembers = null;
		}}
	/>
{/if}

{#if showVisibilityDialog && selectedBoardForVisibility}
	<BoardVisibilitySettings
		board={selectedBoardForVisibility}
		bind:open={showVisibilityDialog}
		onClose={() => {
			showVisibilityDialog = false;
			selectedBoardForVisibility = null;
		}}
	/>
{/if}

{#if showInvoiceDialog && selectedBoardForInvoice}
	<Dialog bind:open={showInvoiceDialog}>
		<DialogContent class="max-w-2xl">
			<BoardCustomerInvoiceDetails boardId={selectedBoardForInvoice.id} />
		</DialogContent>
	</Dialog>
{/if}
