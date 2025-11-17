<!-- @file src/routes/og-test/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';

	let boardAlias = $state('my-board');
	let username = $state('john');
	let lang = $state('en');
	let hasCard = $state(false);
	let cardAlias = $state('my-card');

	const appUrl = 'http://localhost:5173';

	$: previewUrl = hasCard
		? `${appUrl}/${lang}/${username}/${boardAlias}?card=${cardAlias}&og-preview=true`
		: `${appUrl}/${lang}/${username}/${boardAlias}?og-preview=true`;

	$: ogImage = `${appUrl}/pwa-512x512.png`;
	$: ogTitle = hasCard
		? `Card on ${boardAlias} | ToDzz`
		: `${boardAlias} Board | ToDzz`;
	$: ogDescription = hasCard
		? `View this card on ${username}'s board`
		: `View ${username}'s board on ToDzz`;
</script>

<svelte:head>
	<title>OG Tag Tester | ToDzz</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold">Open Graph Tag Tester</h1>

	<div class="mb-8 rounded-lg bg-muted p-6">
		<h2 class="mb-4 text-xl font-semibold">Build Your Test URL</h2>

		<div class="space-y-4">
			<div>
				<label class="mb-2 block text-sm font-medium">Language</label>
				<input
					type="text"
					bind:value={lang}
					class="w-full rounded border p-2"
					placeholder="en"
				/>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium">Username</label>
				<input
					type="text"
					bind:value={username}
					class="w-full rounded border p-2"
					placeholder="john"
				/>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium">Board Alias</label>
				<input
					type="text"
					bind:value={boardAlias}
					class="w-full rounded border p-2"
					placeholder="my-board"
				/>
			</div>

			<div class="flex items-center gap-2">
				<input type="checkbox" bind:checked={hasCard} id="has-card" class="h-4 w-4" />
				<label for="has-card" class="text-sm font-medium">Include Card</label>
			</div>

			{#if hasCard}
				<div>
					<label class="mb-2 block text-sm font-medium">Card Alias</label>
					<input
						type="text"
						bind:value={cardAlias}
						class="w-full rounded border p-2"
						placeholder="my-card"
					/>
				</div>
			{/if}
		</div>
	</div>

	<div class="mb-8 rounded-lg bg-primary/5 p-6">
		<h2 class="mb-4 text-xl font-semibold">Generated Test URL</h2>
		<div class="mb-4 rounded bg-background p-3 font-mono text-sm">
			{previewUrl}
		</div>
		<a href={previewUrl} target="_blank" class="text-primary hover:underline">
			→ Open Preview (will show 404 if board doesn't exist)
		</a>
	</div>

	<div class="mb-8 rounded-lg border p-6">
		<h2 class="mb-4 text-xl font-semibold">Open Graph Meta Tags (What bots will see)</h2>

		<div class="space-y-3 font-mono text-sm">
			<div class="rounded bg-muted p-3">
				<div class="text-muted-foreground">&lt;meta property="og:title"</div>
				<div class="ml-4">content="{ogTitle}" /&gt;</div>
			</div>

			<div class="rounded bg-muted p-3">
				<div class="text-muted-foreground">&lt;meta property="og:description"</div>
				<div class="ml-4">content="{ogDescription}" /&gt;</div>
			</div>

			<div class="rounded bg-muted p-3">
				<div class="text-muted-foreground">&lt;meta property="og:image"</div>
				<div class="ml-4">content="{ogImage}" /&gt;</div>
			</div>

			<div class="rounded bg-muted p-3">
				<div class="text-muted-foreground">&lt;meta property="og:url"</div>
				<div class="ml-4">content="{previewUrl.replace('&og-preview=true', '')}" /&gt;</div>
			</div>
		</div>
	</div>

	<div class="rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
		<h2 class="mb-4 text-xl font-semibold">Important Notes</h2>
		<ul class="list-inside list-disc space-y-2 text-sm">
			<li>The board must actually exist in your database</li>
			<li>Sign in first and create a board to get a real board alias</li>
			<li>The preview URL includes <code>?og-preview=true</code> to bypass authentication</li>
			<li>
				For actual social media crawlers, remove <code>?og-preview=true</code> - they'll still
				access it
			</li>
			<li>Use Facebook Debugger or Twitter Card Validator to test real social media previews</li>
		</ul>
	</div>
</div>
