<!-- @file src/routes/[lang]/backlog/+page.svelte -->
<!-- Every open card of every board in one list (#241), in the order already set on the
     kanban: boards as the switcher sorts them, then lists, then cards. -->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import { getBoardCustomization } from '$lib/constants/boardCustomization';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { backlogStore } from '$lib/stores/backlog.svelte';
	import { rankBacklog } from '$lib/utils/backlog';
	import { formatDateWithFuture } from '$lib/utils/dateTime.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar } from 'lucide-svelte';
	import type { BoardFieldsFragment } from '$lib/graphql/generated/graphql';

	const lang = $derived(getEffectiveLocale(page.params.lang, userStore.user?.locale));
	const userId = $derived(userStore.user?.id);

	// Boards the user owns or belongs to: an invited-only board has no cards to read yet.
	const boards = $derived(
		listsStore.sortedBoards.filter(
			(b) => b.user?.id === userId || b.board_members?.some((m) => m.user_id === userId)
		)
	);
	// A string, so the load below re-runs only when the set of boards changes.
	const boardIds = $derived(boards.map((b) => b.id).join(','));
	const sections = $derived(rankBacklog(boards, backlogStore.cards));

	$effect(() => {
		if (!listsStore.boardsInitialized) listsStore.loadBoards();
	});

	$effect(() => {
		if (boardIds) backlogStore.load(boardIds.split(','));
	});

	const boardParams = (board: BoardFieldsFragment) => ({
		lang,
		username: board.user?.username ?? '',
		board: board.alias ?? ''
	});
</script>

<svelte:head>
	<title>{$t('backlog.title')} | ToDzz</title>
</svelte:head>

<div class="mx-auto max-w-4xl py-6">
	<h1 class="text-2xl font-bold tracking-tight">{$t('backlog.title')}</h1>
	<p class="mt-1 text-sm text-muted-foreground">{$t('backlog.order_hint')}</p>

	{#if backlogStore.failed > 0}
		<p class="mt-4 text-sm text-destructive" role="alert">
			{$t('backlog.boards_failed', { count: backlogStore.failed })}
		</p>
	{/if}

	{#if sections.length === 0}
		<p class="py-12 text-center text-muted-foreground" aria-live="polite">
			{backlogStore.loading || !listsStore.boardsInitialized
				? $t('backlog.loading')
				: $t('backlog.empty')}
		</p>
	{/if}

	{#each sections as { board, cards } (board.id)}
		{@const custom = getBoardCustomization(board)}
		<section class="mt-6" aria-labelledby="backlog-{board.id}">
			<h2 id="backlog-{board.id}" class="mb-2 flex items-baseline gap-2 text-lg font-semibold">
				{#if custom.icon}<span aria-hidden="true">{custom.icon}</span>{/if}
				<a
					href={resolve('/[lang]/[username]/[board]', boardParams(board))}
					class="hover:underline"
					style={custom.color ? `color: ${custom.color};` : ''}>{board.name}</a
				>
				<span class="text-sm font-normal text-muted-foreground">{cards.length}</span>
			</h2>
			<ol class="divide-y rounded-lg border bg-card">
				{#each cards as { todo, rank } (todo.id)}
					<li>
						<a
							href="{resolve('/[lang]/[username]/[board]', boardParams(board))}?card={todo.alias}"
							class="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
						>
							<span class="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground"
								>{rank}</span
							>
							<span class="min-w-0 flex-1 truncate">{todo.title}</span>
							{#if todo.priority === 'high'}
								<span
									class="h-2 w-2 shrink-0 rounded-full bg-red-500"
									role="img"
									aria-label={$t('card.priority_high')}
									title={$t('card.priority_high')}
								></span>
							{/if}
							{#if todo.due_on}
								<Badge
									variant={new Date(todo.due_on) < new Date() ? 'destructive' : 'secondary'}
									class="h-auto shrink-0 gap-1 px-1 py-0 text-xs"
								>
									<Calendar class="h-2.5 w-2.5" />
									{formatDateWithFuture(todo.due_on, todo.has_time ?? false)}
								</Badge>
							{/if}
							<span class="hidden w-28 shrink-0 truncate text-xs text-muted-foreground sm:inline"
								>{todo.list?.name}</span
							>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</div>
