<!-- @file src/routes/[lang]/[username]/[board]/stats/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { trackerStatsStore } from '$lib/stores/trackerStats.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		ChartColumn,
		Calendar,
		Clock,
		TrendingUp,
		AlertCircle,
		Loader2,
		ChevronDown,
		ChevronUp,
		BarChart3
	} from 'lucide-svelte';
	import StatsPeriodTabs from './StatsPeriodTabs.svelte';
	import TimeBreakdownChart from './TimeBreakdownChart.svelte';
	import TimeBreakdownTable from './TimeBreakdownTable.svelte';
	import ThresholdControl from './ThresholdControl.svelte';
	import DateRangePicker from './DateRangePicker.svelte';
	import SessionBreakdown from './SessionBreakdown.svelte';

	let { data } = $props();

	let selectedPeriod: 'today' | 'week' | 'month' | 'custom' = $state('today');
	let customStartDate = $state(new Date());
	let customEndDate = $state(new Date());
	let showSessionBreakdown = $state(false);
	let showCharts = $state(false);
	let showThresholdControl = $state(false);
	let stats = $derived(trackerStatsStore.stats);
	let loading = $derived(trackerStatsStore.loading);
	let error = $derived(trackerStatsStore.error);

	const username: string = $derived(page.params.username || '');
	const boardAlias: string = $derived(page.params.board || '');
	const lang: string = $derived(page.params.lang || userStore.user?.locale || 'et');

	onMount(async () => {
		await trackerStatsStore.loadStatsPeriod(selectedPeriod);
	});

	async function handlePeriodChange(event: CustomEvent<'today' | 'week' | 'month'>) {
		selectedPeriod = event.detail;
		await trackerStatsStore.loadStatsPeriod(selectedPeriod);
	}

	function handleDateRangeChange(event: CustomEvent<{ startDate: Date; endDate: Date }>) {
		const { startDate, endDate } = event.detail;
		customStartDate = startDate;
		customEndDate = endDate;
		selectedPeriod = 'custom';

		if (trackerStatsStore.sessions.length > 0 && trackerStatsStore.keywords.length > 0) {
			trackerStatsStore.getStats(startDate, endDate);
		} else {
			// Load sessions if not already loaded
			trackerStatsStore.loadSessions(startDate, endDate).then(() => {
				trackerStatsStore.loadKeywords().then(() => {
					trackerStatsStore.getStats(startDate, endDate);
				});
			});
		}
	}

	function handleThresholdChange(event: CustomEvent<number>) {
		const newThreshold = event.detail;
		trackerStatsStore.setUnmatchedThreshold(newThreshold);
		// Recalculate stats with new threshold for current period
		if (trackerStatsStore.sessions.length > 0 && trackerStatsStore.keywords.length > 0) {
			let startDate: Date;
			let endDate: Date;

			if (selectedPeriod === 'custom') {
				startDate = customStartDate;
				endDate = customEndDate;
			} else {
				const now = new Date();
				endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

				switch (selectedPeriod) {
					case 'today':
						startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
						break;
					case 'week':
						startDate = new Date(now);
						startDate.setDate(startDate.getDate() - 7);
						startDate.setHours(0, 0, 0, 0);
						break;
					case 'month':
						startDate = new Date(now);
						startDate.setDate(startDate.getDate() - 30);
						startDate.setHours(0, 0, 0, 0);
						break;
					default:
						startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
				}
			}

			trackerStatsStore.getStats(startDate, endDate);
		}
	}

	function formatSeconds(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString(lang === 'et' ? 'et-EE' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold flex items-center gap-2">
				<ChartColumn class="w-8 h-8" />
				{$t('stats.title', 'Time Statistics')}
			</h1>
			<p class="text-muted-foreground mt-1">
				{$t('stats.description', 'Track your time spent on projects and categories')}
			</p>
		</div>
	</div>

	<StatsPeriodTabs {selectedPeriod} on:periodChange={handlePeriodChange} />

	<DateRangePicker
		startDate={selectedPeriod === 'custom' ? customStartDate : new Date()}
		endDate={selectedPeriod === 'custom' ? customEndDate : new Date()}
		on:dateRangeChange={handleDateRangeChange}
	/>

	<!-- Threshold Control (Hidden by default) -->
	<div class="space-y-2">
		<button
			onclick={() => (showThresholdControl = !showThresholdControl)}
			class="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
		>
			{#if showThresholdControl}
				<ChevronUp class="w-4 h-4" />
				Hide
			{:else}
				<ChevronDown class="w-4 h-4" />
				Show
			{/if}
			Advanced Options
		</button>
		{#if showThresholdControl}
			<ThresholdControl threshold={trackerStatsStore.unmatchedThreshold} on:thresholdChange={handleThresholdChange} />
		{/if}
	</div>

	{#if loading}
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12">
				<Loader2 class="w-8 h-8 animate-spin text-muted-foreground mb-2" />
				<p class="text-muted-foreground">{$t('common.loading', 'Loading...')}</p>
			</CardContent>
		</Card>
	{:else if error}
		<Card class="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
			<CardContent class="flex items-start gap-3 py-4">
				<AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
				<div>
					<h3 class="font-semibold text-red-900 dark:text-red-100">
						{$t('common.error', 'Error')}
					</h3>
					<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
				</div>
			</CardContent>
		</Card>
	{:else if stats}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground flex items-center gap-1">
						<Clock class="w-4 h-4" />
						{$t('stats.totalTime', 'Total Time')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">
						{formatSeconds(stats.totalSeconds)}
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						{stats.byProject.size + stats.byCategory.size} {$t(
							'stats.tracked',
							'tracked'
						)}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground flex items-center gap-1">
						<TrendingUp class="w-4 h-4" />
						Matched Time
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">
						{stats.matchedPercentage.toFixed(1)}%
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						Sessions with keyword matches
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground flex items-center gap-1">
						<Calendar class="w-4 h-4" />
						Period
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-sm font-medium">
						{formatDate(stats.startDate)} - {formatDate(stats.endDate)}
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						{stats.byProject.size + stats.byCategory.size + stats.unmatchedSessionCount}
						sessions
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- Charts Toggle -->
		{#if stats.byProject.size > 0 || stats.byCategory.size > 0}
			<div class="space-y-3">
				<button
					onclick={() => (showCharts = !showCharts)}
					class="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
				>
					<BarChart3 class="w-4 h-4" />
					{#if showCharts}
						<ChevronUp class="w-4 h-4" />
						Hide
					{:else}
						<ChevronDown class="w-4 h-4" />
						Show
					{/if}
					Charts (Top 5)
				</button>

				{#if showCharts}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#if stats.byProject.size > 0}
							<Card>
								<CardHeader>
									<CardTitle class="text-base">Top Projects</CardTitle>
									<CardDescription>Top 5 projects by time spent</CardDescription>
								</CardHeader>
								<CardContent>
									<TimeBreakdownChart data={Array.from(stats.byProject.values())} title="" />
								</CardContent>
							</Card>
						{/if}

						{#if stats.byCategory.size > 0}
							<Card>
								<CardHeader>
									<CardTitle class="text-base">Top Categories</CardTitle>
									<CardDescription>Top 5 categories by time spent</CardDescription>
								</CardHeader>
								<CardContent>
									<TimeBreakdownChart data={Array.from(stats.byCategory.values())} title="" />
								</CardContent>
							</Card>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Time by Projects -->
		{#if stats.byProject.size > 0}
			<Card>
				<CardHeader>
					<CardTitle>Time by Project</CardTitle>
					<CardDescription>
						Projects you worked on
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TimeBreakdownTable data={Array.from(stats.byProject.values())} type="project" />
				</CardContent>
			</Card>
		{/if}

		{#if stats.byCategory.size > 0}
			<Card>
				<CardHeader>
					<CardTitle>Time by Category</CardTitle>
					<CardDescription>
						Categories you worked on
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TimeBreakdownTable data={Array.from(stats.byCategory.values())} type="category" />
				</CardContent>
			</Card>
		{/if}

		{#if stats.unmatchedSeconds > 0}
			<Card class="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
				<CardHeader class="pb-2">
					<CardTitle class="text-yellow-900 dark:text-yellow-100">
						Unmatched Time
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-yellow-800 dark:text-yellow-200">
								{formatSeconds(stats.unmatchedSeconds)}
								({Math.round((stats.unmatchedSeconds / stats.totalSeconds) * 100)}%)
							</p>
							<p class="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
								{stats.unmatchedSessionCount} sessions without project or category match
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if stats.sessions.length > 0}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">
						Session Breakdown
					</h2>
					<Button
						variant={showSessionBreakdown ? 'default' : 'outline'}
						size="sm"
						onclick={() => (showSessionBreakdown = !showSessionBreakdown)}
					>
						{showSessionBreakdown ? 'Hide' : 'Show'}
					</Button>
				</div>

				{#if showSessionBreakdown}
					<SessionBreakdown sessions={stats.sessions} title="All Sessions" />
				{/if}
			</div>
		{/if}
	{:else}
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12">
				<ChartColumn class="w-8 h-8 text-muted-foreground mb-2" />
				<p class="text-muted-foreground">No data available for this period</p>
			</CardContent>
		</Card>
	{/if}
</div>

<style>
	:global(body) {
		background-color: hsl(var(--background));
	}
</style>
