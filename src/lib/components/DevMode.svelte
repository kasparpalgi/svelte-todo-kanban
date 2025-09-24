<script lang="ts">
	import { TriangleAlert, Server } from 'lucide-svelte';

	let { app, api }: { app: string; api: string } = $props();

	const allowedAppEnvs = ['production', 'testing', 'development'] as const;
	const allowedApiEnvs = ['production', 'development'] as const;

	// validate props
	if (!allowedAppEnvs.includes(app as any)) {
		console.warn(`⚠️ Invalid app env: "${app}". Allowed: ${allowedAppEnvs.join(', ')}`);
	}

	if (!allowedApiEnvs.includes(api as any)) {
		console.warn(`⚠️ Invalid api env: "${api}". Allowed: ${allowedApiEnvs.join(', ')}`);
	}

	const isDevOrTest = app === 'development' || app === 'testing';
</script>

{#if isDevOrTest}
	<div
		class="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
	>
		<div
			class="flex animate-pulse items-center gap-2 rounded-full border-2 border-red-600 bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
		>
			<TriangleAlert class="h-4 w-4" />
			{app === 'development' ? 'Development' : 'Testing'}
		</div>

		{#if api === 'production'}
			<div class="flex items-center gap-1 text-xs font-medium text-green-500">
				<Server class="h-3 w-3 fill-green-500" /> API Production
			</div>
		{/if}
	</div>
{/if}
