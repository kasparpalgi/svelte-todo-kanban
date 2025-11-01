<!-- @file src/routes/[lang]/[username]/[board]/stats/TimeBreakdownTable.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { trackerStatsStore } from '$lib/stores/trackerStats.svelte';
	import type { TimeBreakdown } from '$lib/stores/trackerStats.svelte';

	interface Props {
		data: TimeBreakdown[];
		type: 'project' | 'category';
	}

	let { data, type }: Props = $props();

	// Sort by duration descending
	const sorted = $derived(
		[...data].sort((a, b) => b.totalSeconds - a.totalSeconds)
	);

	function formatTime(seconds: number): string {
		return trackerStatsStore.formatTime(seconds);
	}

	function getDisplayName(item: TimeBreakdown): string {
		if (type === 'project' && item.projectName) {
			return item.projectName;
		}
		if (type === 'category' && item.categoryName) {
			return item.parentCategoryName
				? `${item.parentCategoryName} → ${item.categoryName}`
				: item.categoryName;
		}
		return 'Unknown';
	}
</script>

<div class="space-y-2">
	{#each sorted as item}
		<div class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				<div class="flex-1 min-w-0">
					<div class="font-medium truncate text-sm">{getDisplayName(item)}</div>
					<div class="text-xs text-muted-foreground">
						{item.sessionCount}
						{item.sessionCount === 1
							? $t('stats.session', 'session')
							: $t('stats.sessions', 'sessions')}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-4 ml-4 flex-shrink-0">
				<!-- Progress bar -->
				<div class="w-24 bg-secondary rounded-full h-2 overflow-hidden">
					<div
						class="bg-primary h-full transition-all duration-300"
						style="width: {item.percentage}%"
					/>
				</div>

				<!-- Time and percentage -->
				<div class="text-right min-w-24">
					<div class="font-semibold text-sm">{formatTime(item.totalSeconds)}</div>
					<div class="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
				</div>
			</div>
		</div>
	{/each}

	{#if sorted.length === 0}
		<div class="text-center py-6 text-muted-foreground">
			{$t('stats.noData', 'No data available')}
		</div>
	{/if}
</div>
