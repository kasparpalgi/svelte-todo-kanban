<!-- @file src/routes/[lang]/[username]/[board]/invoices/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import InvoiceList from '$lib/components/invoice/InvoiceList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';

	let boardAlias = $derived($page.params.board);
	let username = $derived($page.params.username);
	let lang = $derived($page.params.lang);

	let board = $derived(listsStore.boards.find((b) => b.alias === boardAlias));

	function handleNewInvoice() {
		goto(`/${lang}/${username}/${boardAlias}/invoices/new`);
	}

	function handleInvoiceClick(invoiceId: string) {
		goto(`/${lang}/${username}/${boardAlias}/invoices/${invoiceId}`);
	}

	function goBack() {
		goto(`/${lang}/${username}/${boardAlias}`);
	}
</script>

<svelte:head>
	<title>Invoices - {board?.name || 'Board'}</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<Button
		variant="ghost"
		on:click={goBack}
		class="mb-4 gap-2"
	>
		<ArrowLeft class="h-4 w-4" />
		Back to Board
	</Button>

	{#if board}
		<InvoiceList
			boardId={board.id}
			{onNewInvoice}
			{onInvoiceClick}
		/>
	{:else}
		<div class="py-8 text-center">Board not found</div>
	{/if}
</div>
