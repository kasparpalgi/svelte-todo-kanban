<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayerCakeContext } from '$lib/types/charting';

	const { height, width, yScale } = getContext<LayerCakeContext>('LayerCake');

	let { 
		gridlines = true,
		tickMarks = false,
		ticks = 4,
		format = (d: number) => d
	} = $props();
</script>

{#if browser && $yScale}
<g class="axis y-axis">
	{#if gridlines}
		{#each $yScale.ticks(ticks) as tick}
			<g class="tick" transform="translate(0, {$yScale(tick)})">
				<line x2={$width} />
			</g>
		{/each}
	{/if}

	{#each $yScale.ticks(ticks) as tick}
		<g class="tick" transform="translate(0, {$yScale(tick)})">
			{#if tickMarks}
				<line x2="-6" />
			{/if}
			<text x="-12" dy="0.32em">{format(tick)}</text>
		</g>
	{/each}
</g>
{/if}

<style>
	.tick {
		font-size: 11px;
	}
	.tick text {
		fill: #666;
	}
	.tick line {
		stroke: #aaa;
		stroke-dasharray: 2;
	}
	.axis.y-axis .tick text {
		text-anchor: end;
	}
</style>