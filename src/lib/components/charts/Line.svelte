<script>
	import { getContext } from 'svelte';
	import { line } from 'd3-shape';

	const { data, xGet, yGet } = getContext('LayerCake');

	const path = line()
		.x(d => $xGet(d))
		.y(d => $yGet(d));
</script>

<g class="line-group">
	<path d={path($data)} />
</g>

<style>
	path {
		fill: none;
		stroke: #ff0000;
		stroke-width: 2px;
	}
</style>
