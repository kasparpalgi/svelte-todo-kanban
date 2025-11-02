<!-- @file src/routes/[lang]/[username]/[board]/stats/TimeBreakdownChart.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import type { TimeBreakdown } from '$lib/stores/trackerStats.svelte';

	interface Props {
		data: TimeBreakdown[];
		title: string;
	}

	let { data, title }: Props = $props();

	// Sort by duration descending and take top 5
	const topItems = $derived(
		[...data].sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 5)
	);

	const maxDuration = $derived(Math.max(...topItems.map(item => item.totalSeconds), 1));

	function getItemLabel(item: TimeBreakdown): string {
		return item.projectName || item.categoryName || 'Unknown';
	}

	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}
</script>

<div class="space-y-4">
	<h3 class="font-semibold text-sm">{title}</h3>

	{#if topItems.length > 0}
		<div class="space-y-3">
			{#each topItems as item}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-sm">
						<span class="truncate font-medium">{getItemLabel(item)}</span>
						<span class="text-muted-foreground">{formatTime(item.totalSeconds)}</span>
					</div>
					<div class="w-full bg-secondary rounded-full h-2 overflow-hidden">
						<div
							class="bg-primary h-full transition-all duration-300"
							style="width: {(item.totalSeconds / maxDuration) * 100}%"
						/>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground text-center py-4">
			{t('stats.noData', 'No data available')}
		</p>
	{/if}
</div>
