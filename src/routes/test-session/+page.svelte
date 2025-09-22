<!-- @file src/routes/test-session/+page.svelte -->
<script>
	import { page } from '$app/state';
</script>

<h1>Session Test Page</h1>

<div class="space-y-4 p-4">
	{#if page.data.session}
		<div class="rounded border border-green-300 bg-green-100 p-4">
			<h2>✅ Session found</h2>
			<pre class="mt-2 text-sm">{JSON.stringify(page.data.session, null, 2)}</pre>
		</div>
	{:else}
		<div class="rounded border border-red-300 bg-red-100 p-4">
			<h2>❌ No Session</h2>
			<p>User is not authenticated</p>
		</div>
	{/if}

	<div class="rounded border border-gray-300 bg-gray-100 p-4">
		<h3>Debug info</h3>
		<p>Page data keys: {Object.keys(page.data).join(', ')}</p>
		<p>Current URL: {page.url.pathname}</p>
	</div>
</div>
