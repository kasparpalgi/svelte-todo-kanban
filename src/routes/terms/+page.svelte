<script lang="ts">
	import { page } from '$app/state';
	import Terms from './Terms.svelte';
	import Privacy from './Privacy.svelte';

	const hasTerms = $derived(page.url.searchParams.has('terms'));
	const hasPrivacy = $derived(page.url.searchParams.has('privacy'));
</script>

<section class="mx-auto max-w-3xl space-y-6 p-6">
	{#if !hasTerms && !hasPrivacy}
		<h1 class="text-3xl font-bold">Terms & Conditions and Privacy Policy ⚖️</h1>
	{/if}

	{#if hasTerms}
		<Terms />
	{:else if hasPrivacy}
		<Privacy />
	{:else}
		<div class="flex gap-4">
			<a class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" href="/terms?privacy">
				Privacy Policy
			</a>

			<a class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700" href="/terms?terms">
				Terms & Conditions
			</a>
		</div>
	{/if}
</section>
