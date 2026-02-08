<script lang="ts">
	import { onMount } from 'svelte';
	import { LayerCake, Svg } from 'layercake';
	import { scaleTime, scaleLinear } from 'd3-scale';

	import Line from '$lib/components/charts/Line.svelte';
	import AxisX from '$lib/components/charts/AxisX.svelte';
	import AxisY from '$lib/components/charts/AxisY.svelte';

	const API_URL = 'https://api.admin.servicehost.io/v1/graphql';
	const API_SECRET = 'Asdc1523!Asdc1523!';

	let data = $state([]);
	let loading = $state(true);
	let error = $state(null);

	let endDate = $state(new Date());

	async function fetchData() {
		loading = true;
		error = null;

		const startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - 1);

		// Adjust for Gran Canaria timezone (WET/WEST)
		const offset = new Date().getTimezoneOffset() * 60000;
		const granCanariaOffset = 0; // WET in winter
		const adjustedStartDate = new Date(startDate.getTime() - offset + granCanariaOffset);
		const adjustedEndDate = new Date(endDate.getTime() - offset + granCanariaOffset);

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
					_gte: adjustedStartDate.toISOString(),
					_lte: adjustedEndDate.toISOString()
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
				throw new Error(result.errors.map((e) => e.message).join(', '));
			}
			data = result.data.penon.map((d) => ({
				...d,
				timestamp: new Date(d.timestamp)
			}));
		} catch (e) {
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
		fetchData();
	});

	const xGet = (d) => d.timestamp;
	const yGetTemp = (d) => d.temp;
	const yGetHumidity = (d) => d.humidity;
	const yGetSoil = (d) => d.soil;
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
			{endDate.toLocaleDateString()}
		</div>
	</div>

	{#if loading}
		<p>Cargando…</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if data.length === 0}
		<p>No hay datos disponibles para este período.</p>
	{:else}
		<div class="grid grid-cols-1 gap-8">
			<!-- Temperature Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Temperatura interior (°C)</h2>
				<div class="chart-container">
					<LayerCake
						{data}
						x={xGet}
						y={yGetTemp}
						xScale={scaleTime()}
						yScale={scaleLinear()}
						yDomain={[Math.min(...data.map(yGetTemp)) - 1, Math.max(...data.map(yGetTemp)) + 1]}
					>
						<Svg>
							<AxisX />
							<AxisY />
							<Line />
						</Svg>
					</LayerCake>
				</div>
			</div>

			<!-- Humidity Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Humedad interior (%)</h2>
				<div class="chart-container">
					<LayerCake
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
							<AxisX />
							<AxisY />
							<Line />
						</Svg>
					</LayerCake>
				</div>
			</div>

			<!-- Soil Moisture Chart -->
			<div>
				<h2 class="text-xl font-semibold mb-2">Humedad del suelo 1</h2>
				<div class="chart-container">
					<LayerCake
						{data}
						x={xGet}
						y={yGetSoil}
						xScale={scaleTime()}
						yScale={scaleLinear()}
						yDomain={[Math.min(...data.map(yGetSoil)) - 100, Math.max(...data.map(yGetSoil)) + 100]}
					>
						<Svg>
							<AxisX />
							<AxisY />
							<Line />
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
