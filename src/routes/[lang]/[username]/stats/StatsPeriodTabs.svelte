<!-- @file src/routes/[lang]/[username]/[board]/stats/StatsPeriodTabs.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	import { Calendar } from 'lucide-svelte';

	let { selectedPeriod }: { selectedPeriod: 'today' | 'week' | 'month' | 'custom' } = $props();

	const dispatch = createEventDispatcher<{ periodChange: 'today' | 'week' | 'month' }>();

	function handleChange(period: 'today' | 'week' | 'month') {
		dispatch('periodChange', period);
	}
</script>

<div class="flex gap-2 items-center">
	<Calendar class="w-4 h-4 text-muted-foreground" />
	<div class="flex gap-2">
		<Button
			variant={selectedPeriod === 'today' ? 'default' : 'outline'}
			size="sm"
			onclick={() => handleChange('today')}
			class="transition-all"
		>
			{$t('stats.today', { default: 'Today' })}
		</Button>
		<Button
			variant={selectedPeriod === 'week' ? 'default' : 'outline'}
			size="sm"
			onclick={() => handleChange('week')}
			class="transition-all"
		>
			{$t('stats.week', { default: 'Last 7 Days' })}
		</Button>
		<Button
			variant={selectedPeriod === 'month' ? 'default' : 'outline'}
			size="sm"
			onclick={() => handleChange('month')}
			class="transition-all"
		>
			{$t('stats.month', { default: 'Last 30 Days' })}
		</Button>
	</div>
</div>
