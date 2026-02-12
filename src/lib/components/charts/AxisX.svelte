<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayerCakeContext } from '$lib/types/charting';

	const { width, height, xScale } = getContext<LayerCakeContext>('LayerCake');

	let { 
		gridlines = true,
		tickMarks = false,
		ticks = 4,
		format = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
	} = $props();
</script>

{#if browser && $xScale}
<g class="axis x-axis">
	{#if gridlines}
		{#each $xScale.ticks(ticks) as tick}
			<g class="tick" transform="translate({$xScale(tick)},0)">
				<line y2={$height} />
			</g>
		{/each}
	{/if}

	{#each $xScale.ticks(ticks) as tick}
		<g class="tick" transform="translate({$xScale(tick)},-5)">
			{#if tickMarks}
				<line y2="6" />
			{/if}
			<rect x="-20" y="12" width="40" height="18" fill="white" />
			<text y="20" dy="0.71em">{format(tick)}</text>
		</g>
	{/each}
</g>
{/if}

<style>
	.tick {
		font-size: 12px;
		font-weight: bold;
	}
	.tick text {
		fill: #333;
	}
	.tick line {
		stroke: #aaa;
		stroke-dasharray: 2;
	}
	.axis.x-axis .tick text {
		text-anchor: middle;
	}
</style>
