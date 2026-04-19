<!-- @file src/routes/[lang]/splitwise/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { expensesStore } from '$lib/stores/expenses.svelte';
	import BalanceSummary from '$lib/components/expenses/BalanceSummary.svelte';
	import ExpenseCard from '$lib/components/expenses/ExpenseCard.svelte';
	import { Wallet } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const currentUserId = data.session?.user?.id || '';

	onMount(() => {
		expensesStore.loadAllExpenses();
	});

	const balances = $derived(
		currentUserId
			? expensesStore.getBalances(currentUserId)
			: { owesMe: [], iOwe: [], myBalance: 0 }
	);

	const expensesByBoard = $derived.by(() => {
		const groups = new Map<
			string,
			{ boardName: string; boardAlias: string; expenses: typeof expensesStore.expenses }
		>();
		for (const e of expensesStore.expenses) {
			const id = e.board?.id || 'unknown';
			if (!groups.has(id)) {
				groups.set(id, {
					boardName: e.board?.name || $t('splitwise.allBoards'),
					boardAlias: e.board?.alias || '',
					expenses: []
				});
			}
			groups.get(id)!.expenses.push(e);
		}
		return Array.from(groups.values());
	});
</script>

<svelte:head>
	<title>{$t('splitwise.title')} | ToDzz</title>
</svelte:head>

<section class="mx-auto w-full max-w-4xl py-6 space-y-6">
	<header>
		<h1 class="text-2xl font-bold">{$t('splitwise.title')}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{$t('splitwise.description')}</p>
	</header>

	{#if expensesStore.loading && expensesStore.expenses.length === 0}
		<p class="text-center text-sm text-muted-foreground">{$t('splitwise.loading')}</p>
	{:else if expensesStore.error}
		<p class="text-center text-sm text-destructive">{expensesStore.error}</p>
	{:else if expensesStore.expenses.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
			<Wallet class="mx-auto mb-2 h-10 w-10 opacity-50" />
			<p>{$t('splitwise.emptyState')}</p>
		</div>
	{:else}
		<BalanceSummary
			owesMe={balances.owesMe}
			iOwe={balances.iOwe}
			myBalance={balances.myBalance}
		/>

		<div class="space-y-6">
			{#each expensesByBoard as group (group.boardAlias || group.boardName)}
				<div class="space-y-3">
					<h2 class="text-lg font-semibold">{group.boardName}</h2>
					<div class="space-y-3">
						{#each group.expenses as expense (expense.id)}
							<ExpenseCard {expense} {currentUserId} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
