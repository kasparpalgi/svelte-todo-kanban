<!-- @file src/lib/components/debug/LoggingDebug.svelte -->
<script lang="ts">
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Download, Trash2, Eye, EyeOff } from 'lucide-svelte';

	let showDebug = $state(false);
	let selectedComponent = $state<string>('all');
	let selectedLevel = $state<string>('all');

	const components = $derived(
		['all', ...new Set(loggingStore.logs.map((log) => log.component))].sort()
	);

	const levels = ['all', 'debug', 'info', 'warn', 'error'];

	// Filter logs based on selected component and level
	const filteredLogs = $derived(
		loggingStore.logs.filter((log) => {
			const componentMatch = selectedComponent === 'all' || log.component === selectedComponent;
			const levelMatch = selectedLevel === 'all' || log.level === selectedLevel;
			return componentMatch && levelMatch;
		})
	);

	function getLevelColor(level: string) {
		switch (level) {
			case 'debug':
				return 'bg-gray-500';
			case 'info':
				return 'bg-blue-500';
			case 'warn':
				return 'bg-yellow-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	}

	function downloadLogs() {
		const logsJson = loggingStore.exportLogs();
		const blob = new Blob([logsJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `voice-input-logs-${new Date().toISOString().slice(0, 19)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatTime(date: Date) {
		return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
	}
</script>

{#if import.meta.env.DEV}
	<div class="fixed right-4 bottom-4 z-50">
		<Button
			variant={showDebug ? 'default' : 'outline'}
			size="sm"
			onclick={() => (showDebug = !showDebug)}
		>
			{#if showDebug}
				<EyeOff class="mr-2 h-4 w-4" />
				Hide Logs
			{:else}
				<Eye class="mr-2 h-4 w-4" />
				Show Logs ({loggingStore.logs.length})
			{/if}
		</Button>
	</div>
{/if}

{#if showDebug}
	<div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
		<div
			class="absolute top-0 right-0 h-full w-full overflow-hidden border-l bg-background shadow-lg md:w-2/3 lg:w-1/2"
		>
			<Card class="h-full rounded-none border-0">
				<CardHeader class="border-b">
					<div class="flex items-center justify-between">
						<CardTitle class="text-lg">Voice Input Debug Logs</CardTitle>
						<div class="flex gap-2">
							<Button variant="outline" size="sm" onclick={downloadLogs}>
								<Download class="mr-1 h-4 w-4" />
								Export
							</Button>
							<Button variant="outline" size="sm" onclick={() => loggingStore.clear()}>
								<Trash2 class="mr-1 h-4 w-4" />
								Clear
							</Button>
							<Button variant="ghost" size="sm" onclick={() => (showDebug = false)}>×</Button>
						</div>
					</div>

					<div class="flex gap-4 pt-2">
						<select bind:value={selectedComponent} class="rounded border px-2 py-1 text-sm">
							{#each components as component}
								<option value={component}>{component}</option>
							{/each}
						</select>
						<select bind:value={selectedLevel} class="rounded border px-2 py-1 text-sm">
							{#each levels as level}
								<option value={level}>{level}</option>
							{/each}
						</select>
					</div>
				</CardHeader>

				<CardContent class="h-full overflow-auto p-0">
					<div class="space-y-1 p-4">
						{#each filteredLogs as log (log.id)}
							<div
								class="flex gap-2 rounded border-l-2 p-2 text-sm {getLevelColor(
									log.level
								)} hover:bg-muted/50"
							>
								<div class="w-20 flex-shrink-0 text-xs text-muted-foreground">
									{formatTime(log.timestamp)}
								</div>
								<div class="flex-shrink-0">
									<Badge variant="outline" class="px-1 py-0 text-xs">
										{log.level}
									</Badge>
								</div>
								<div class="w-24 flex-shrink-0 truncate text-xs font-medium">
									{log.component}
								</div>
								<div class="flex-1 text-xs">
									{log.message}
									{#if log.data}
										<details class="mt-1">
											<summary class="cursor-pointer text-muted-foreground hover:text-foreground">
												Show data
											</summary>
											<pre class="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
{JSON.stringify(log.data, null, 2)}
											</pre>
										</details>
									{/if}
								</div>
							</div>
						{/each}

						{#if filteredLogs.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								No logs found for the selected filters
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
{/if}
