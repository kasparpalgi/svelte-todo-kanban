<script lang="ts">
	/** @file src/lib/components/expenses/BalanceSummary.svelte */
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Avatar } from '$lib/components/ui/avatar';
	import { formatCurrency } from '$lib/utils/expenseCalculations';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	interface BalanceItem {
		userId: string;
		userName: string;
		userImage: string | null;
		amount: number;
	}

	interface Props {
		owesMe: BalanceItem[];
		iOwe: BalanceItem[];
		myBalance: number;
		onSettleUp?: (userId: string, amount: number, direction: 'owe' | 'owed') => void;
	}

	let { owesMe, iOwe, myBalance, onSettleUp }: Props = $props();

	let expanded = $state(true);

	function toggleExpanded() {
		expanded = !expanded;
	}

	function handleSettleUp(userId: string, amount: number, direction: 'owe' | 'owed') {
		if (onSettleUp) {
			onSettleUp(userId, amount, direction);
		}
	}
</script>

<Card.Root class="overflow-hidden">
	<button
		class="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
		onclick={toggleExpanded}
		type="button"
	>
		<div class="flex-1">
			<h3 class="text-lg font-semibold">Balance Summary</h3>
			<p
				class="text-sm mt-1"
				class:text-green-600={myBalance > 0}
				class:text-red-600={myBalance < 0}
				class:text-muted-foreground={Math.abs(myBalance) < 0.01}
			>
				{#if Math.abs(myBalance) < 0.01}
					You're all settled up!
				{:else if myBalance > 0}
					You are owed {formatCurrency(myBalance)}
				{:else}
					You owe {formatCurrency(Math.abs(myBalance))}
				{/if}
			</p>
		</div>
		{#if expanded}
			<ChevronUp class="h-5 w-5 text-muted-foreground" />
		{:else}
			<ChevronDown class="h-5 w-5 text-muted-foreground" />
		{/if}
	</button>

	{#if expanded}
		<div class="border-t">
			<!-- People who owe me -->
			{#if owesMe.length > 0}
				<div class="p-4 space-y-3">
					<h4 class="text-sm font-medium text-muted-foreground">Owes you</h4>
					{#each owesMe as person}
						<div class="flex items-center justify-between gap-4">
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<Avatar.Root class="h-8 w-8 flex-shrink-0">
									<Avatar.Image src={person.userImage || ''} alt={person.userName} />
									<Avatar.Fallback>
										{person.userName.substring(0, 2).toUpperCase()}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate">{person.userName}</p>
									<p class="text-xs text-green-600 dark:text-green-400">
										owes you {formatCurrency(person.amount)}
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={() => handleSettleUp(person.userId, person.amount, 'owed')}
							>
								Settle
							</Button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- People I owe -->
			{#if iOwe.length > 0}
				<div class="p-4 space-y-3" class:border-t={owesMe.length > 0}>
					<h4 class="text-sm font-medium text-muted-foreground">You owe</h4>
					{#each iOwe as person}
						<div class="flex items-center justify-between gap-4">
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<Avatar.Root class="h-8 w-8 flex-shrink-0">
									<Avatar.Image src={person.userImage || ''} alt={person.userName} />
									<Avatar.Fallback>
										{person.userName.substring(0, 2).toUpperCase()}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate">{person.userName}</p>
									<p class="text-xs text-red-600 dark:text-red-400">
										you owe {formatCurrency(person.amount)}
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={() => handleSettleUp(person.userId, person.amount, 'owe')}
							>
								Settle
							</Button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- All settled -->
			{#if owesMe.length === 0 && iOwe.length === 0}
				<div class="p-4 text-center text-sm text-muted-foreground">
					<p>No pending balances</p>
				</div>
			{/if}
		</div>
	{/if}
</Card.Root>
