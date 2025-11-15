<!-- @file src/routes/[lang]/[username]/[board]/stats/DateRangePicker.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Calendar } from 'lucide-svelte';

	interface Props {
		startDate: Date;
		endDate: Date;
	}

	let { startDate = new Date(), endDate = new Date() }: Props = $props();

	const dispatch = createEventDispatcher<{ dateRangeChange: { startDate: Date; endDate: Date } }>();

	let localStartDate = $derived(startDate.toISOString().split('T')[0]);
	let localEndDate = $derived(endDate.toISOString().split('T')[0]);

	function handleStartDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const date = new Date(input.value);
		date.setHours(0, 0, 0, 0);
		dispatch('dateRangeChange', { startDate: date, endDate });
	}

	function handleEndDateChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const date = new Date(input.value);
		date.setHours(23, 59, 59, 999);
		dispatch('dateRangeChange', { startDate, endDate: date });
	}

	function setToday() {
		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
		const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
		dispatch('dateRangeChange', { startDate: start, endDate: end });
	}

	function setLastWeek() {
		const end = new Date();
		end.setHours(23, 59, 59, 999);
		const start = new Date(end);
		start.setDate(start.getDate() - 7);
		start.setHours(0, 0, 0, 0);
		dispatch('dateRangeChange', { startDate: start, endDate: end });
	}

	function setLastMonth() {
		const end = new Date();
		end.setHours(23, 59, 59, 999);
		const start = new Date(end);
		start.setDate(start.getDate() - 30);
		start.setHours(0, 0, 0, 0);
		dispatch('dateRangeChange', { startDate: start, endDate: end });
	}
</script>

<Card class="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
	<CardHeader class="pb-3">
		<CardTitle class="flex items-center gap-2">
			<Calendar class="w-5 h-5" />
			{$t('stats.customDateRange', { default: 'Custom Date Range' })}
		</CardTitle>
		<CardDescription>
			{$t('stats.selectDateRange', { default: 'Select a custom date range or use presets' })}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<!-- Date inputs -->
		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="start-date" class="text-sm font-medium">
					{$t('stats.startDate', { default: 'Start Date' })}
				</Label>
				<Input
					id="start-date"
					type="date"
					value={localStartDate}
					onchange={handleStartDateChange}
					class="w-full"
				/>
			</div>
			<div class="space-y-2">
				<Label for="end-date" class="text-sm font-medium">
					{$t('stats.endDate', { default: 'End Date' })}
				</Label>
				<Input
					id="end-date"
					type="date"
					value={localEndDate}
					onchange={handleEndDateChange}
					class="w-full"
				/>
			</div>
		</div>

		<!-- Quick preset buttons -->
		<div class="space-y-2">
			<p class="text-sm font-medium">
				{$t('stats.quickPresets', { default: 'Quick Presets' })}
			</p>
			<div class="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={setToday}
					class="text-xs"
				>
					{$t('stats.today', { default: 'Today' })}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={setLastWeek}
					class="text-xs"
				>
					{$t('stats.last7Days', { default: 'Last 7 Days' })}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={setLastMonth}
					class="text-xs"
				>
					{$t('stats.last30Days', { default: 'Last 30 Days' })}
				</Button>
			</div>
		</div>

		<!-- Info -->
		<div class="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-400">
			<p class="font-medium text-slate-900 dark:text-slate-100 mb-1">
				{$t('stats.dateRangeInfo', { default: 'Date Range Information' })}
			</p>
			<ul class="list-disc list-inside space-y-1 text-xs">
				<li>{$t('stats.dateRangeInfo1', { default: 'Start date is set to 00:00:00' })}</li>
				<li>{$t('stats.dateRangeInfo2', { default: 'End date is set to 23:59:59' })}</li>
				<li>{$t('stats.dateRangeInfo3', { default: 'Changes apply immediately to statistics' })}</li>
			</ul>
		</div>
	</CardContent>
</Card>
