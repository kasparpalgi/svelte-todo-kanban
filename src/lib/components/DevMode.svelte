<!-- @file src/lib/components/DevMode.svelte -->
<script lang="ts">
	import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from '$env/static/public';
	import { TriangleAlert, Server } from 'lucide-svelte';

	const allowedAppEnvs = ['production', 'testing', 'development'] as const;
	const allowedApiEnvs = ['production', 'development'] as const;
	type AppEnv = (typeof allowedAppEnvs)[number];
	type ApiEnv = (typeof allowedApiEnvs)[number];

	const app = PUBLIC_APP_ENV as AppEnv;
	const api = PUBLIC_API_ENV as ApiEnv;

	const invalidApp = !allowedAppEnvs.includes(app);
	const invalidApi = !allowedApiEnvs.includes(api);
	const isDevOrTest = app === 'development' || app === 'testing';
</script>

<div
	class="pointer-events-none fixed top-4 left-1/2 z-50 z-9999 flex -translate-x-1/2 flex-col items-center gap-3"
>
	{#if invalidApp || invalidApi}
		<div
			class="flex items-center gap-2 rounded-xl border-2 border-yellow-600 bg-yellow-400/95 px-4 py-2 text-base font-bold text-black shadow-2xl"
		>
			<TriangleAlert class="h-6 w-6" />
			<span>
				{#if invalidApp}Invalid app env: "{app}"
				{/if}
				{#if invalidApi}Invalid api env: "{api}"{/if}
			</span>
		</div>
	{/if}
	{#if isDevOrTest}
		<div
			class="flex animate-pulse items-center gap-2 rounded-full border-2 border-red-600 bg-red-500/90 px-3 py-1.5 text-sm font-bold text-white shadow-lg"
		>
			<TriangleAlert class="h-4 w-4" />
			{app === 'development' ? 'Development' : 'Testing'}
		</div>
		{#if api === 'production'}
			<div class="flex items-center gap-1 text-sm font-medium text-green-500">
				<Server class="h-4 w-4 fill-green-500" /> API Production
			</div>
		{/if}
	{/if}
</div>
