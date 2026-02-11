<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/environment';
	import { line } from 'd3-shape';
	import type { LayerCakeContext } from '$lib/types/charting';
	import type { PenonData } from '../../types/penon';

	const { data, xGet, yGet, width, height } = getContext<LayerCakeContext>('LayerCake');

	let { label = '', valueType = '' } = $props();

	const path = browser && data ? line<PenonData>()
		.x(d => xGet(d))
		.y(d => yGet(d)) : null;

	let tooltip = $state({ show: false, x: 0, y: 0, time: '', value: '' });

	function handleMouseMove(event: MouseEvent) {
		if (!browser || !data) return;
		
		const svg = event.currentTarget as SVGRectElement;
		const rect = svg.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		
		// Find closest data point
		let closestPoint: PenonData | null = null;
		let minDistance = Infinity;
		
		for (const point of data) {
			const pointX = xGet(point);
			const distance = Math.abs(pointX - mouseX);
			
			if (distance < minDistance) {
				minDistance = distance;
				closestPoint = point;
			}
		}
		
		if (closestPoint && minDistance < 30) {
			const x = xGet(closestPoint);
			const y = yGet(closestPoint);
			const time = closestPoint.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
			
			// Get the correct value based on valueType prop
			let value: number;
			if (valueType === 'temp') {
				value = closestPoint.temp;
			} else if (valueType === 'humidity') {
				value = closestPoint.humidity;
			} else if (valueType === 'soil') {
				value = closestPoint.soil;
			} else {
				value = yGet(closestPoint);
			}
			
			tooltip = {
				show: true,
				x,
				y,
				time,
				value: value.toFixed(1) + (label || '')
			};
		} else {
			tooltip = { show: false, x: 0, y: 0, time: '', value: '' };
		}
	}

	function handleMouseLeave() {
		tooltip = { show: false, x: 0, y: 0, time: '', value: '' };
	}
</script>

{#if browser && data && path}
<g class="line-group">
	<path d={path(data)} />
	
	<rect 
		width={width} 
		height={height} 
		fill="transparent" 
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		style="cursor: crosshair;"
	/>
	
	{#if tooltip.show}
		<circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#ff0000" />
		<g transform="translate({tooltip.x}, {tooltip.y - 10})">
			<rect 
				x="-60" 
				y="-35" 
				width="120" 
				height="30" 
				fill="rgba(0,0,0,0.8)" 
				rx="4"
			/>
			<text x="0" y="-22" text-anchor="middle" fill="white" font-size="11">
				{tooltip.time}
			</text>
			<text x="0" y="-10" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
				{tooltip.value}
			</text>
		</g>
	{/if}
</g>
{/if}

<style>
	path {
		fill: none;
		stroke: #ff0000;
		stroke-width: 2px;
	}
</style>