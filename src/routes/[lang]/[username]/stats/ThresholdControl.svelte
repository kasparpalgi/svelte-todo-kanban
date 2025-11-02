<!-- @file src/routes/[lang]/[username]/[board]/stats/ThresholdControl.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { t } from '$lib/i18n';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { AlertCircle } from 'lucide-svelte';

	let { threshold = 3600 }: { threshold: number } = $props();

	const dispatch = createEventDispatcher<{ thresholdChange: number }>();

	let thresholdMinutes = $derived(Math.round(threshold / 60));

	function handleChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const minutes = parseInt(input.value, 10);
		const seconds = minutes * 60;
		dispatch('thresholdChange', seconds);
	}

	function handleSlider(event: Event) {
		const input = event.target as HTMLInputElement;
		const minutes = parseInt(input.value, 10);
		const seconds = minutes * 60;
		dispatch('thresholdChange', seconds);
	}
</script>

<Card class="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
	<CardHeader class="pb-3">
		<CardTitle class="flex items-center gap-2 text-blue-900 dark:text-blue-100">
			<AlertCircle class="w-5 h-5" />
			Unmatched Session Threshold
		</CardTitle>
		<CardDescription class="text-blue-800 dark:text-blue-200">
			Sessions without keyword matches longer than this duration are excluded from tracking
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="threshold-input" class="text-blue-900 dark:text-blue-100">
				Threshold (minutes): <span class="font-bold">{thresholdMinutes}</span>
			</Label>

			<!-- Slider -->
			<input
				id="threshold-slider"
				type="range"
				min="1"
				max="180"
				step="1"
				value={thresholdMinutes}
				onchange={handleSlider}
				class="w-full h-2 bg-blue-300 dark:bg-blue-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
			/>
			<div class="flex justify-between text-xs text-blue-700 dark:text-blue-300">
				<span>1 min</span>
				<span>30 min</span>
				<span>60 min</span>
				<span>180 min</span>
			</div>
		</div>

		<!-- Quick presets -->
		<div class="space-y-2">
			<p class="text-sm font-medium text-blue-900 dark:text-blue-100">Quick presets:</p>
			<div class="flex flex-wrap gap-2">
				{#each [15, 30, 60, 120] as minutes}
					<button
						onclick={() => dispatch('thresholdChange', minutes * 60)}
						class="px-3 py-1.5 rounded text-sm {thresholdMinutes === minutes
							? 'bg-blue-600 text-white'
							: 'bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800'}"
					>
						{minutes}m
					</button>
				{/each}
			</div>
		</div>

		<!-- Info box -->
		<div class="bg-white dark:bg-blue-900/30 rounded p-3 border border-blue-200 dark:border-blue-700 text-sm text-blue-900 dark:text-blue-100">
			<p class="font-medium mb-1">Explanation:</p>
			<ul class="list-disc list-inside space-y-1 text-xs">
				<li>Sessions without keywords are checked against this threshold</li>
				<li>Sessions ≤ threshold are counted as "unmatched" in stats</li>
				<li>Sessions &gt; threshold are ignored (likely breaks or context switches)</li>
				<li>Lower threshold = stricter tracking (ignore more breaks)</li>
				<li>Higher threshold = include more sessions</li>
			</ul>
		</div>
	</CardContent>
</Card>
