<!-- @file src/routes/[lang]/[username]/[board]/invoices/new/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import InvoiceEditor from '$lib/components/invoice/InvoiceEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';

	let boardAlias = $derived($page.params.board);
	let username = $derived($page.params.username);
	let lang = $derived($page.params.lang);

	let board = $derived(listsStore.boards.find((b) => b.alias === boardAlias));

	function goBack() {
		goto(`/${lang}/${username}/${boardAlias}/invoices`);
	}
</script>

<svelte:head>
	<title>New Invoice - {board?.name || 'Board'}</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-4">
	<Button
		variant="ghost"
		onclick={goBack}
		class="mb-4 gap-2"
	>
		<ArrowLeft class="h-4 w-4" />
		Back to Invoices
	</Button>

	{#if board}
		<InvoiceEditor boardId={board.id} />
	{:else}
		<div class="py-8 text-center">Board not found</div>
	{/if}
</div>
