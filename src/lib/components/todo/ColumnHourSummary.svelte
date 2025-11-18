<!-- @file src/lib/components/todo/ColumnHourSummary.svelte -->
<script lang="ts">
	import { Euro } from 'lucide-svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';

	interface Props {
		minHours: number;
		maxHours: number;
		avgHours: number;
		actualHours: number;
		count: number;
		hourlyRate?: number;
	}

	let { minHours, maxHours, avgHours, actualHours, count, hourlyRate = 50 }: Props = $props();

	let open = $state(false);

	// Calculate currency values
	const minCost = $derived(minHours * hourlyRate);
	const maxCost = $derived(maxHours * hourlyRate);
	const avgCost = $derived(avgHours * hourlyRate);
	const actualCost = $derived(actualHours * hourlyRate);

	// Format currency
	function formatCurrency(value: number): string {
		return `€${value.toFixed(2)}`;
	}

	// Format hours
	function formatHours(value: number): string {
		return `${value.toFixed(1)}h`;
	}

	// Handle mouse enter
	function handleMouseEnter() {
		open = true;
	}

	// Handle mouse leave
	function handleMouseLeave() {
		open = false;
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		<button
			class="group flex items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm transition-all hover:border-primary/20 hover:bg-primary/5"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			<Euro class="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
			<span
				class="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary"
			>
				{formatCurrency(avgCost)}
			</span>
		</button>
	</PopoverTrigger>
	<PopoverContent class="w-auto" align="center">
		<div class="space-y-2">
			<div class="border-b pb-2">
				<p class="text-xs font-semibold">Hour Totals ({count} {count === 1 ? 'task' : 'tasks'})</p>
				<p class="text-xs text-muted-foreground">Rate: {formatCurrency(hourlyRate)}/hour</p>
			</div>

			<div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
				<div class="text-muted-foreground">Minimum:</div>
				<div class="text-right font-medium">
					{formatHours(minHours)} • {formatCurrency(minCost)}
				</div>

				<div class="text-muted-foreground">Average:</div>
				<div class="text-right font-medium">
					{formatHours(avgHours)} • {formatCurrency(avgCost)}
				</div>

				<div class="text-muted-foreground">Maximum:</div>
				<div class="text-right font-medium">
					{formatHours(maxHours)} • {formatCurrency(maxCost)}
				</div>

				{#if actualHours > 0}
					<div class="col-span-2 mt-1 border-t pt-1.5"></div>
					<div class="font-semibold text-primary">Actual:</div>
					<div class="text-right font-semibold text-primary">
						{formatHours(actualHours)} • {formatCurrency(actualCost)}
					</div>
				{/if}
			</div>
		</div>
	</PopoverContent>
</Popover>
