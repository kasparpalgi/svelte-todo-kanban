<script lang="ts">
	/** @file src/lib/components/expenses/AddExpenseDialog.svelte */
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
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { expensesStore } from '$lib/stores/expenses.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import type { GetBoardMembersQuery } from '$lib/graphql/generated/graphql';

	type BoardMember = GetBoardMembersQuery['board_members'][number];

	interface Props {
		open: boolean;
		boardId: string;
		boardMembers: BoardMember[];
		currentUserId: string;
		onOpenChange: (open: boolean) => void;
	}

	let { open = $bindable(), boardId, boardMembers, currentUserId, onOpenChange }: Props = $props();

	let amount = $state('');
	let paidBy = $state(currentUserId);
	let splitType = $state<'equal' | 'custom'>('equal');
	let selectedMembers = $state<Set<string>>(new Set(boardMembers.map((m) => m.user_id)));
	let customSplits = $state<Map<string, string>>(new Map());
	let submitting = $state(false);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			amount = '';
			paidBy = currentUserId;
			splitType = 'equal';
			selectedMembers = new Set(boardMembers.map((m) => m.user_id));
			customSplits = new Map();
		}
	});

	const paidByMember = $derived(boardMembers.find((m) => m.user_id === paidBy));
	const selectedMembersList = $derived(
		boardMembers.filter((m) => selectedMembers.has(m.user_id))
	);

	const totalAmount = $derived(parseFloat(amount) || 0);
	const equalSplitAmount = $derived(
		selectedMembers.size > 0 ? totalAmount / selectedMembers.size : 0
	);

	const customSplitTotal = $derived(
		Array.from(customSplits.values()).reduce(
			(sum, val) => sum + (parseFloat(val) || 0),
			0
		)
	);

	const isValidSplit = $derived(
		splitType === 'equal'
			? selectedMembers.size > 0
			: Math.abs(customSplitTotal - totalAmount) < 0.01
	);

	function toggleMember(userId: string) {
		if (selectedMembers.has(userId)) {
			selectedMembers.delete(userId);
		} else {
			selectedMembers.add(userId);
		}
		selectedMembers = new Set(selectedMembers); // Trigger reactivity
	}

	function setCustomSplit(userId: string, value: string) {
		if (value === '' || value === '0') {
			customSplits.delete(userId);
		} else {
			customSplits.set(userId, value);
		}
		customSplits = new Map(customSplits); // Trigger reactivity
	}

	async function handleSubmit() {
		if (submitting) return;

		// Validation
		if (!amount || parseFloat(amount) <= 0) {
			displayMessage('Please enter a valid amount');
			return;
		}

		if (selectedMembers.size === 0) {
			displayMessage('Please select at least one person to split with');
			return;
		}

		if (!isValidSplit) {
			displayMessage(
				splitType === 'custom'
					? `Custom splits total ($${customSplitTotal.toFixed(2)}) must equal expense amount ($${totalAmount.toFixed(2)})`
					: 'Please select people to split with'
			);
			return;
		}

		submitting = true;

		try {
			// Build splits array
			const splits =
				splitType === 'equal'
					? Array.from(selectedMembers).map((userId) => ({
							user_id: userId,
							amount: equalSplitAmount
						}))
					: Array.from(customSplits.entries()).map(([userId, amt]) => ({
							user_id: userId,
							amount: parseFloat(amt)
						}));

			const result = await expensesStore.addExpense(
				boardId,
				parseFloat(amount),
				paidBy,
				splits
			);

			if (result.success) {
				displayMessage('Expense added successfully', 1500, true);
				onOpenChange(false);
			} else {
				displayMessage(result.message);
			}
		} catch (error) {
			displayMessage('Failed to add expense');
			console.error('[AddExpenseDialog] Error:', error);
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Add Expense</DialogTitle>
			<DialogDescription>Split an expense among board members</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<!-- Amount -->
			<div class="space-y-2">
				<Label for="amount">Amount</Label>
				<Input
					id="amount"
					type="number"
					step="0.01"
					min="0"
					placeholder="0.00"
					bind:value={amount}
				/>
			</div>

			<!-- Paid by -->
			<div class="space-y-2">
				<Label for="paid-by">Paid by</Label>
				<select
					id="paid-by"
					bind:value={paidBy}
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each boardMembers as member}
						<option value={member.user_id}>
							{member.user?.name || member.user?.username || 'Unknown'}
						</option>
					{/each}
				</select>
			</div>

			<!-- Split type -->
			<div class="space-y-2">
				<Label>Split type</Label>
				<div class="flex gap-2">
					<Button
						variant={splitType === 'equal' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (splitType = 'equal')}
						type="button"
					>
						Equal
					</Button>
					<Button
						variant={splitType === 'custom' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (splitType = 'custom')}
						type="button"
					>
						Custom
					</Button>
				</div>
			</div>

			<!-- Equal split -->
			{#if splitType === 'equal'}
				<div class="space-y-2">
					<Label>Split between</Label>
					<div class="space-y-2 max-h-48 overflow-y-auto">
						{#each boardMembers as member}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Checkbox
										checked={selectedMembers.has(member.user_id)}
										onCheckedChange={() => toggleMember(member.user_id)}
									/>
									<span class="text-sm">
										{member.user?.name || member.user?.username || 'Unknown'}
									</span>
								</div>
								{#if selectedMembers.has(member.user_id) && totalAmount > 0}
									<span class="text-xs text-muted-foreground">
										${equalSplitAmount.toFixed(2)}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Custom split -->
			{#if splitType === 'custom'}
				<div class="space-y-2">
					<Label>Custom amounts</Label>
					<div class="space-y-2 max-h-48 overflow-y-auto">
						{#each boardMembers as member}
							<div class="flex items-center gap-2">
								<span class="text-sm flex-1 truncate">
									{member.user?.name || member.user?.username || 'Unknown'}
								</span>
								<Input
									type="number"
									step="0.01"
									min="0"
									placeholder="0.00"
									class="w-24"
									value={customSplits.get(member.user_id) || ''}
									oninput={(e) => setCustomSplit(member.user_id, e.currentTarget.value)}
								/>
							</div>
						{/each}
					</div>
					<p class="text-xs" class:text-destructive={!isValidSplit}>
						Total: ${customSplitTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
					</p>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => onOpenChange(false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={submitting || !isValidSplit}>
				{submitting ? 'Adding...' : 'Add Expense'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
