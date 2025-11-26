<script lang="ts">
	/** @file src/lib/components/expenses/ExpenseCard.svelte */
	import type { GetBoardExpensesQuery } from '$lib/graphql/generated/graphql';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Trash2 } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils/expenseCalculations';
	import { page } from '$app/stores';

	type Expense = GetBoardExpensesQuery['expenses'][number];

	interface Props {
		expense: Expense;
		currentUserId: string;
		onDelete?: (expenseId: string) => void;
	}

	let { expense, currentUserId, onDelete }: Props = $props();

	const canDelete = $derived(expense.created_by === currentUserId);
	const isSettlement = $derived(
		expense.expense_splits.length === 1 &&
		expense.expense_splits[0].user_id !== expense.created_by
	);

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

	function handleDelete() {
		if (onDelete && canDelete) {
			onDelete(expense.id);
		}
	}
</script>

<Card.Root class="p-4 hover:bg-muted/30 transition-colors">
	<div class="flex items-start justify-between gap-4">
		<!-- Left: Expense info -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-3 mb-2">
				<Avatar.Root class="h-8 w-8 flex-shrink-0">
					<Avatar.Image src={expense.created?.image || ''} alt={expense.created?.name || 'User'} />
					<Avatar.Fallback>
						{expense.created?.name?.substring(0, 2).toUpperCase() || 'U'}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium truncate">
						{#if isSettlement}
							<span class="text-green-600 dark:text-green-400">Settlement:</span>
							{expense.created?.name} paid {expense.expense_splits[0].user?.name}
						{:else}
							<span>{expense.created?.name}</span> paid
						{/if}
					</p>
					<p class="text-xs text-muted-foreground">
						{formatDate(expense.created_at)}
					</p>
				</div>
			</div>

			<!-- Split details -->
			{#if !isSettlement}
				<div class="ml-11 text-xs text-muted-foreground">
					Split between {expense.expense_splits.length} {expense.expense_splits.length === 1
						? 'person'
						: 'people'}:
					<span class="text-foreground">
						{expense.expense_splits.map((s) => s.user?.name).join(', ')}
					</span>
				</div>
			{/if}
		</div>

		<!-- Right: Amount and actions -->
		<div class="flex items-center gap-2">
			<div class="text-right">
				<p class="text-lg font-semibold">
					{formatCurrency(Number(expense.amount))}
				</p>
				{#if !isSettlement && expense.expense_splits.length > 1}
					<p class="text-xs text-muted-foreground">
						{formatCurrency(Number(expense.amount) / expense.expense_splits.length)} each
					</p>
				{/if}
			</div>

			{#if canDelete}
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-destructive hover:bg-destructive/10"
					onclick={handleDelete}
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>
</Card.Root>
