<!-- @file src/lib/components/todo/CardCostBadge.svelte
	Card-level Claude cost (#21): API-list cost always shown, plus a plan-effective
	estimate once the board owner has a flat plan set and this period has usage. -->
<script lang="ts">
	import { claudeUsageStore } from '$lib/stores/claudeUsage.svelte';
	import { effectiveRatio, formatUsd, formatPlanCurrency } from '$lib/utils/claudeCost';
	import { Sparkles } from 'lucide-svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let { todo }: { todo: TodoFieldsFragment } = $props();

	const board = $derived(todo.list?.board);
	const costUsd = $derived(todo.claude_usages_aggregate?.aggregate?.sum?.cost_usd ?? 0);

	$effect(() => {
		if (board?.user_id) claudeUsageStore.loadMonthCost(board.user_id);
	});

	const ratio = $derived(
		board?.user_id
			? effectiveRatio(
					board.user.claude_plan,
					board.user.claude_plan_monthly,
					claudeUsageStore.monthCost(board.user_id)
				)
			: null
	);
</script>

{#if costUsd > 0}
	<div class="flex items-center gap-1 text-[10px] text-gray-400" title="Claude usage cost">
		<span>{formatUsd(costUsd)}</span>
		{#if ratio !== null && ratio !== 1}
			<span class="flex items-center gap-0.5 text-primary/70">
				<Sparkles class="h-2.5 w-2.5" />
				{formatPlanCurrency(costUsd * ratio, board?.user.claude_plan_currency)}
			</span>
		{/if}
	</div>
{/if}
