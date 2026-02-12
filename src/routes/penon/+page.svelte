<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { LayerCake, Svg } from 'layercake';
	import { scaleTime, scaleLinear } from 'd3-scale';

	import Line from '$lib/components/charts/Line.svelte';
	import AxisX from '$lib/components/charts/AxisX.svelte';
	import AxisY from '$lib/components/charts/AxisY.svelte';
	import type { PenonData } from '$lib/types/penon';

	const API_URL = 'https://api.admin.servicehost.io/v1/graphql';
	const API_SECRET = 'Asdc1523!Asdc1523!';

	let data: PenonData[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);
	let mounted = $state(false);

	let endDate = $state(new Date());

	let lastTemp = $derived(data.length > 0 ? data[data.length - 1].temp : null);
	let lastHumidity = $derived(data.length > 0 ? data[data.length - 1].humidity : null);

	// Helper function to format date in Spanish
	function formatSpanishDate(date: Date): string {
		const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
		const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		
		const dayName = days[date.getDay()];
		const day = date.getDate();
		const monthName = months[date.getMonth()];
		const year = date.getFullYear().toString().slice(-2);
		
		return `${dayName}, ${day} de ${monthName}'${year}`;
	}

	// Helper function to convert to Gran Canaria time
	function toGranCanariaTime(date: Date): Date {
		// Gran Canaria uses WET (UTC+0) in winter and WEST (UTC+1) in summer
		// Determine if DST is in effect (last Sunday of March to last Sunday of October)
		const year = date.getFullYear();
		
		// Last Sunday of March at 1:00 UTC
		const marchLastSunday = new Date(Date.UTC(year, 2, 31));
		marchLastSunday.setUTCDate(31 - ((marchLastSunday.getUTCDay() + 6) % 7));
		marchLastSunday.setUTCHours(1, 0, 0, 0);
		
		// Last Sunday of October at 1:00 UTC
		const octoberLastSunday = new Date(Date.UTC(year, 9, 31));
		octoberLastSunday.setUTCDate(31 - ((octoberLastSunday.getUTCDay() + 6) % 7));
		octoberLastSunday.setUTCHours(1, 0, 0, 0);
		
		const isDST = date >= marchLastSunday && date < octoberLastSunday;
		const offsetHours = isDST ? 1 : 0; // UTC+1 in summer, UTC+0 in winter
		
		return new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
	}

	async function fetchData() {
		if (!browser) return;
		
		loading = true;
		error = null;

		const startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - 1);

		const query = `
      query Penon($where: penon_bool_exp) {
        penon(where: $where, order_by: {timestamp: asc}, limit: 5000) {
          id
          temp
          humidity
          soil
          timestamp
        }
      }
    `;

		const variables = {
			where: {
				timestamp: {
					_gte: startDate.toISOString(),
					_lte: endDate.toISOString()
				}
			}
		};

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-hasura-admin-secret': API_SECRET
				},
				body: JSON.stringify({ query, variables })
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if (result.errors) {
				throw new Error(result.errors.map((e: { message: string }) => e.message).join(', '));
			}
			data = result.data.penon.map((d: PenonData) => ({
				...d,
				timestamp: toGranCanariaTime(new Date(d.timestamp))
			}));
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function goBack() {
		endDate.setDate(endDate.getDate() - 1);
		fetchData();
	}

	function goForward() {
		endDate.setDate(endDate.getDate() + 1);
		fetchData();
	}

	onMount(() => {
		mounted = true;
		fetchData();
	});

	const xGet = (d: PenonData) => d.timestamp;
	const yGetTemp = (d: PenonData) => d.temp;
	const yGetHumidity = (d: PenonData) => d.humidity;
	const yGetSoil = (d: PenonData) => d.soil;
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">La Clima de Peñon</h1>

	<div class="flex items-center mb-4">
		<button onclick={goBack} class="bg-blue-500 text-white px-4 py-2 rounded mr-2">
			&lt; 24h
		</button>
		<button onclick={goForward} class="bg-blue-500 text-white px-4 py-2 rounded">
			24h &gt;
		</button>
		<div class="ml-4 text-gray-600">
			{formatSpanishDate(endDate)}
		</div>
	</div>

	{#if data.length > 0 && lastTemp !== null && lastHumidity !== null}
		<div class="mb-8 flex justify-around items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
			<div class="text-center">
				<p class="text-xl text-gray-500">Temperatura</p>
				<p class="text-5xl font-bold text-blue-600 dark:text-blue-400">{lastTemp.toFixed(1)}°C</p>
			</div>
			<div class="text-center">
				<p class="text-xl text-gray-500">Humedad</p>
				<p class="text-5xl font-bold text-green-600 dark:text-green-400">{lastHumidity.toFixed(0)}%</p>
			</div>
		</div>
	{/if}

	{#if !mounted}
		<p>Cargando… (not mounted)</p>
	{:else if loading}
		<p>Cargando…</p>
	{:else if error}
		<p class="text-red-500">Error: {error}</p>
	{:else if data.length === 0}
		<p>No hay datos disponibles para este período.</p>
	{:else}
		<div class="grid grid-cols-1 gap-8">
			<!-- Temperature Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Temperatura interior (°C)</h2>
				<div class="chart-container">
					<LayerCake
						padding={{ top: 10, right: 10, bottom: 30, left: 50 }}
						{data}
						x={xGet}
						y={yGetTemp}
						xScale={scaleTime()}
						yScale={scaleLinear()}
						yDomain={[Math.min(...data.map(yGetTemp)) - 1, Math.max(...data.map(yGetTemp)) + 1]}
					>
						<Svg>
							<AxisX gridlines={true} />
							<AxisY gridlines={true} format={(d: number) => d.toFixed(1) + '°C'} />
							<Line valueType="temp" label="°C" />
						</Svg>
					</LayerCake>
				</div>
			</div>

			<!-- Humidity Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Humedad interior (%)</h2>
				<div class="chart-container">
					<LayerCake
						padding={{ top: 10, right: 10, bottom: 30, left: 50 }}
						{data}
						x={xGet}
						y={yGetHumidity}
						xScale={scaleTime()}
						yScale={scaleLinear()}
						yDomain={[
							Math.min(...data.map(yGetHumidity)) - 5,
							Math.max(...data.map(yGetHumidity)) + 5
						]}
					>
						<Svg>
							<AxisX gridlines={true} />
							<AxisY gridlines={true} format={(d: number) => d.toFixed(0) + '%'} />
							<Line valueType="humidity" label="%" />
						</Svg>
					</LayerCake>
				</div>
			</div>

			<!-- Soil Moisture Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Humedad del suelo 1</h2>
				<div class="chart-container">
					<LayerCake
						padding={{ top: 10, right: 10, bottom: 30, left: 50 }}
						{data}
						x={xGet}
						y={yGetSoil}
						xScale={scaleTime()}
						yScale={scaleLinear()}
						yDomain={[Math.min(...data.map(yGetSoil)) - 100, Math.max(...data.map(yGetSoil)) + 100]}
					>
						<Svg>
							<AxisX gridlines={true} />
							<AxisY gridlines={true} />
							<Line valueType="soil" />
						</Svg>
					</LayerCake>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		height: 300px;
	}
</style>