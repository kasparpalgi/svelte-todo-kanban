<script lang="ts">
	/** @file src/lib/components/expenses/SettleUpDialog.svelte */
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { expensesStore } from '$lib/stores/expenses.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { formatCurrency } from '$lib/utils/expenseCalculations';
	import type { GetBoardMembersQuery } from '$lib/graphql/generated/graphql';

	type BoardMember = GetBoardMembersQuery['board_members'][number];

	interface Props {
		open: boolean;
		boardId: string;
		boardMembers: BoardMember[];
		currentUserId: string;
		onOpenChange: (open: boolean) => void;
		// Pre-fill settlement details
		defaultFromUser?: string;
		defaultToUser?: string;
		defaultAmount?: number;
	}

	let {
		open = $bindable(),
		boardId,
		boardMembers,
		currentUserId,
		onOpenChange,
		defaultFromUser,
		defaultToUser,
		defaultAmount
	}: Props = $props();

	let fromUserId = $state(defaultFromUser || currentUserId);
	let toUserId = $state(defaultToUser || '');
	let amount = $state(defaultAmount?.toString() || '');
	let submitting = $state(false);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			fromUserId = defaultFromUser || currentUserId;
			toUserId = defaultToUser || '';
			amount = defaultAmount?.toString() || '';
		}
	});

	const fromMember = $derived(boardMembers.find((m) => m.user_id === fromUserId));
	const toMember = $derived(boardMembers.find((m) => m.user_id === toUserId));

	const suggestedSettlements = $derived(expensesStore.getSuggested());
	const relevantSuggestion = $derived(
		suggestedSettlements.find(
			(s) =>
				(s.fromUserId === fromUserId && s.toUserId === toUserId) ||
				(s.fromUserId === toUserId && s.toUserId === fromUserId)
		)
	);

	async function handleSubmit() {
		if (submitting) return;

		// Validation
		if (!amount || parseFloat(amount) <= 0) {
			displayMessage('Please enter a valid amount');
			return;
		}

		if (!toUserId || toUserId === fromUserId) {
			displayMessage('Please select who receives the payment');
			return;
		}

		submitting = true;

		try {
			const result = await expensesStore.settleUp(
				boardId,
				fromUserId,
				toUserId,
				parseFloat(amount)
			);

			if (result.success) {
				displayMessage('Settlement recorded successfully', 1500, true);
				onOpenChange(false);
			} else {
				displayMessage(result.message);
			}
		} catch (error) {
			displayMessage('Failed to record settlement');
			console.error('[SettleUpDialog] Error:', error);
		} finally {
			submitting = false;
		}
	}

	function useSuggestion() {
		if (relevantSuggestion) {
			fromUserId = relevantSuggestion.fromUserId;
			toUserId = relevantSuggestion.toUserId;
			amount = relevantSuggestion.amount.toString();
		}
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="sm:max-w-[450px]">
		<DialogHeader>
			<DialogTitle>Settle Up</DialogTitle>
			<DialogDescription>Record a payment between two people</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<!-- Suggested settlement -->
			{#if relevantSuggestion}
				<div class="p-3 bg-muted rounded-lg">
					<p class="text-sm text-muted-foreground mb-2">Suggested settlement:</p>
					<p class="text-sm font-medium">
						{relevantSuggestion.fromUserName} pays {relevantSuggestion.toUserName}
						{formatCurrency(relevantSuggestion.amount)}
					</p>
					<Button variant="link" size="sm" class="p-0 h-auto" onclick={useSuggestion}>
						Use this suggestion
					</Button>
				</div>
			{/if}

			<!-- From user -->
			<div class="space-y-2">
				<Label for="from-user">From (who is paying)</Label>
				<select
					id="from-user"
					bind:value={fromUserId}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each boardMembers as member}
						<option value={member.user_id}>
							{member.user?.name || member.user?.username || 'Unknown'}
						</option>
					{/each}
				</select>
			</div>

			<!-- To user -->
			<div class="space-y-2">
				<Label for="to-user">To (who is receiving)</Label>
				<select
					id="to-user"
					bind:value={toUserId}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each boardMembers.filter((m) => m.user_id !== fromUserId) as member}
						<option value={member.user_id}>
							{member.user?.name || member.user?.username || 'Unknown'}
						</option>
					{/each}
				</select>
			</div>

			<!-- Amount -->
			<div class="space-y-2">
				<Label for="settle-amount">Amount</Label>
				<Input
					id="settle-amount"
					type="number"
					step="0.01"
					min="0"
					placeholder="0.00"
					bind:value={amount}
				/>
			</div>

			{#if fromUserId && toUserId && amount}
				<div class="p-3 bg-primary/10 rounded-lg">
					<p class="text-sm">
						<span class="font-medium">{fromMember?.user?.name}</span>
						pays
						<span class="font-medium">{toMember?.user?.name}</span>
						<span class="font-semibold">{formatCurrency(parseFloat(amount))}</span>
					</p>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => onOpenChange(false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting}>
				{submitting ? 'Recording...' : 'Record Settlement'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
