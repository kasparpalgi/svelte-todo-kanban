<script>
	import { getContext } from 'svelte';

	const { width, x, xScale } = getContext('LayerCake');

	export let gridlines = true;
	export let tickMarks = false;
	export let ticks = 4;
	export let format = d => d;
</script>

<g class="axis x-axis">
	{#if gridlines}
		{#each $xScale.ticks(ticks) as tick}
			<g class="tick" transform="translate({$x(tick)},0)">
				<line y2={$width} />
			</g>
		{/each}
	{/if}

	{#each $xScale.ticks(ticks) as tick}
		<g class="tick" transform="translate({$x(tick)},0)">
			{#if tickMarks}
				<line y2="6" />
			{/if}
			<text y="20" dy="0.71em">{format(tick)}</text>
		</g>
	{/each}
</g>

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
