<!-- @file src/lib/components/ErrorBoundary.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { AlertCircle, RefreshCw, Home } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { children, fallback } = $props<{
		children?: any;
		fallback?: any;
	}>();

	let error = $state<Error | null>(null);
	let errorInfo = $state<string | null>(null);

	function handleError(event: ErrorEvent) {
		error = event.error;
		errorInfo = event.error?.stack || event.message || 'Unknown error';

		loggingStore.error('ErrorBoundary', 'Uncaught error', {
			message: event.error?.message,
			stack: event.error?.stack,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno
		});

		// Prevent default error handling
		event.preventDefault();
	}

	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		error = event.reason;
		errorInfo = event.reason?.stack || String(event.reason) || 'Unhandled promise rejection';

		loggingStore.error('ErrorBoundary', 'Unhandled promise rejection', {
			reason: String(event.reason),
			stack: event.reason?.stack
		});

		// Prevent default error handling
		event.preventDefault();
	}

	function reload() {
		error = null;
		errorInfo = null;
		window.location.reload();
	}

	function goHome() {
		error = null;
		errorInfo = null;
		goto('/en');
	}

	onMount(() => {
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});
</script>

{#if error}
	{#if fallback}
		{@render fallback(error, errorInfo)}
	{:else}
		<div class="min-h-screen flex items-center justify-center p-4 bg-background">
			<Card class="w-full max-w-2xl border-destructive">
				<CardHeader>
					<div class="flex items-center gap-3">
						<AlertCircle class="h-8 w-8 text-destructive" />
						<div>
							<CardTitle class="text-2xl">Something went wrong</CardTitle>
							<CardDescription>The application encountered an unexpected error</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="bg-muted p-4 rounded-lg">
						<p class="font-semibold mb-2">Error Message:</p>
						<p class="text-sm font-mono text-destructive">
							{error.message || 'Unknown error occurred'}
						</p>
					</div>

					{#if errorInfo}
						<details class="bg-muted p-4 rounded-lg">
							<summary class="font-semibold cursor-pointer hover:text-foreground text-muted-foreground">
								Technical Details
							</summary>
							<pre class="mt-3 text-xs overflow-x-auto whitespace-pre-wrap">{errorInfo}</pre>
						</details>
					{/if}

					<div class="pt-4 flex gap-3">
						<Button onclick={reload} class="gap-2">
							<RefreshCw class="h-4 w-4" />
							Reload Page
						</Button>
						<Button onclick={goHome} variant="outline" class="gap-2">
							<Home class="h-4 w-4" />
							Go Home
						</Button>
					</div>

					<p class="text-sm text-muted-foreground">
						This error has been logged and reported. If the problem persists, please try clearing
						your browser cache or contact support.
					</p>
				</CardContent>
			</Card>
		</div>
	{/if}
{:else}
	{@render children?.()}
{/if}
