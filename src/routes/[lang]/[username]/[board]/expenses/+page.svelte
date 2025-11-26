<script lang="ts">
	/** @file src/routes/[lang]/[username]/[board]/expenses/+page.svelte */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Plus, Wallet } from 'lucide-svelte';
	import { expensesStore } from '$lib/stores/expenses.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import ExpenseCard from '$lib/components/expenses/ExpenseCard.svelte';
	import BalanceSummary from '$lib/components/expenses/BalanceSummary.svelte';
	import AddExpenseDialog from '$lib/components/expenses/AddExpenseDialog.svelte';
	import SettleUpDialog from '$lib/components/expenses/SettleUpDialog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const board = data.board;
	const boardMembers = data.boardMembers;
	const currentUserId = data.session?.user?.id || '';

	let addExpenseOpen = $state(false);
	let settleUpOpen = $state(false);
	let settleFromUser = $state<string | undefined>(undefined);
	let settleToUser = $state<string | undefined>(undefined);
	let settleAmount = $state<number | undefined>(undefined);

	// Load expenses on mount
	onMount(() => {
		if (board.id) {
			expensesStore.loadBoardExpenses(board.id);
		}
	});

	// Computed balances
	const balances = $derived(
		currentUserId ? expensesStore.getBalances(currentUserId) : { owesMe: [], iOwe: [], myBalance: 0 }
	);

	function handleBack() {
		goto(`/${$page.params.lang}/${$page.params.username}/${$page.params.board}`);
	}

	function handleAddExpense() {
		addExpenseOpen = true;
	}

	function handleSettleUp(userId: string, amount: number, direction: 'owe' | 'owed') {
		if (direction === 'owe') {
			// I owe someone
			settleFromUser = currentUserId;
			settleToUser = userId;
			settleAmount = amount;
		} else {
			// Someone owes me
			settleFromUser = userId;
			settleToUser = currentUserId;
			settleAmount = amount;
		}
		settleUpOpen = true;
	}

	async function handleDeleteExpense(expenseId: string) {
		const result = await expensesStore.deleteExpense(expenseId);
		if (result.success) {
			displayMessage('Expense deleted', 1500, true);
		} else {
			displayMessage(result.message);
		}
	}
</script>

<svelte:head>
	<title>{board.name} - Expenses | ToDzz</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-background border-b">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<Button variant="ghost" size="icon" onclick={handleBack}>
						<ArrowLeft class="h-5 w-5" />
					</Button>
					<div class="flex-1 min-w-0">
						<h1 class="text-xl font-bold truncate">{board.name}</h1>
						<p class="text-sm text-muted-foreground">Expenses</p>
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" onclick={() => (settleUpOpen = true)}>
						<Wallet class="h-4 w-4 mr-2" />
						<span class="hidden sm:inline">Settle Up</span>
					</Button>
					<Button size="sm" onclick={handleAddExpense}>
						<Plus class="h-4 w-4 mr-2" />
						<span class="hidden sm:inline">Add Expense</span>
					</Button>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="container mx-auto px-4 py-6 max-w-4xl">
		<div class="space-y-6">
			<!-- Balance Summary -->
			<BalanceSummary
				owesMe={balances.owesMe}
				iOwe={balances.iOwe}
				myBalance={balances.myBalance}
				onSettleUp={handleSettleUp}
			/>

			<!-- Expenses List -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">All Expenses</h2>
					<p class="text-sm text-muted-foreground">
						{expensesStore.expenses.length}
						{expensesStore.expenses.length === 1 ? 'expense' : 'expenses'}
					</p>
				</div>

				{#if expensesStore.loading}
					<div class="text-center py-12">
						<p class="text-muted-foreground">Loading expenses...</p>
					</div>
				{:else if expensesStore.error}
					<div class="text-center py-12">
						<p class="text-destructive">{expensesStore.error}</p>
					</div>
				{:else if expensesStore.expenses.length === 0}
					<div class="text-center py-12 space-y-3">
						<Wallet class="h-12 w-12 mx-auto text-muted-foreground" />
						<div>
							<p class="text-lg font-medium">No expenses yet</p>
							<p class="text-sm text-muted-foreground">Add your first expense to get started</p>
						</div>
						<Button onclick={handleAddExpense}>
							<Plus class="h-4 w-4 mr-2" />
							Add Expense
						</Button>
					</div>
				{:else}
					<div class="space-y-3">
						{#each expensesStore.expenses as expense (expense.id)}
							<ExpenseCard
								{expense}
								{currentUserId}
								onDelete={handleDeleteExpense}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</main>

	<!-- Dialogs -->
	<AddExpenseDialog
		bind:open={addExpenseOpen}
		boardId={board.id}
		{boardMembers}
		{currentUserId}
		onOpenChange={(open) => (addExpenseOpen = open)}
	/>

	<SettleUpDialog
		bind:open={settleUpOpen}
		boardId={board.id}
		{boardMembers}
		{currentUserId}
		onOpenChange={(open) => {
			settleUpOpen = open;
			if (!open) {
				// Reset settle up state
				settleFromUser = undefined;
				settleToUser = undefined;
				settleAmount = undefined;
			}
		}}
		defaultFromUser={settleFromUser}
		defaultToUser={settleToUser}
		defaultAmount={settleAmount}
	/>
</div>
