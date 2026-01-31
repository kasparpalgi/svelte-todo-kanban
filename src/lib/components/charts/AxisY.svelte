<script>
	import { getContext } from 'svelte';

	const { height, y, yScale } = getContext('LayerCake');

	export let gridlines = true;
	export let tickMarks = false;
	export let ticks = 4;
	export let format = d => d;
</script>

<g class="axis y-axis">
	{#if gridlines}
		{#each $yScale.ticks(ticks) as tick}
			<g class="tick" transform="translate(0, {$y(tick)})">
				<line x2={$height} />
			</g>
		{/each}
	{/if}

	{#each $yScale.ticks(ticks) as tick}
		<g class="tick" transform="translate(0, {$y(tick)})">
			{#if tickMarks}
				<line x2="-6" />
			{/if}
			<text x="-12" dy="0.32em">{format(tick)}</text>
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
	.axis.y-axis .tick text {
		text-anchor: end;
	}
</style>
