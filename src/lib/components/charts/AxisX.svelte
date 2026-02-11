<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayerCakeContext } from '$lib/types/charting';

	const { width, xScale } = getContext<LayerCakeContext>('LayerCake');
	console.log('[AxisX.svelte] xScale:', xScale);
	console.log('[AxisX.svelte] width:', width);

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
				<line y2={$width} />
			</g>
		{/each}
	{/if}

	{#each $xScale.ticks(ticks) as tick}
		<g class="tick" transform="translate({$xScale(tick)},0)">
			{#if tickMarks}
				<line y2="6" />
			{/if}
			<text y="20" dy="0.71em">{format(tick)}</text>
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
	.axis.x-axis .tick text {
		text-anchor: middle;
	}
</style>