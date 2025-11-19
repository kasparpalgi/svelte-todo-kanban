<!-- @file src/routes/[lang]/[username]/[board]/invoices/[invoiceId]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import InvoiceEditor from '$lib/components/invoice/InvoiceEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Printer } from 'lucide-svelte';

	let boardAlias = $derived($page.params.board);
	let username = $derived($page.params.username);
	let lang = $derived($page.params.lang);
	let invoiceId = $derived($page.params.invoiceId);

	let board = $derived(listsStore.boards.find((b) => b.alias === boardAlias));
	let invoice = $derived(invoicesStore.currentInvoice);

	// Load invoice on mount
	$effect(() => {
		if (invoiceId) {
			invoicesStore.loadInvoiceById(invoiceId);
		}
	});

	function goBack() {
		goto(`/${lang}/${username}/${boardAlias}/invoices`);
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Invoice {invoice?.invoice_number || invoiceId} - {board?.name || 'Board'}</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-4">
	<div class="mb-4 flex items-center justify-between">
		<Button
			variant="ghost"
			onclick={goBack}
			class="gap-2"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Invoices
		</Button>

		{#if invoice}
			<Button
				variant="outline"
				onclick={handlePrint}
				class="gap-2"
			>
				<Printer class="h-4 w-4" />
				Print
			</Button>
		{/if}
	</div>

	{#if board && invoiceId}
		<InvoiceEditor
			{invoiceId}
			boardId={board.id}
		/>
	{:else}
		<div class="py-8 text-center">
			{board ? 'Invoice not found' : 'Board not found'}
		</div>
	{/if}
</div>
