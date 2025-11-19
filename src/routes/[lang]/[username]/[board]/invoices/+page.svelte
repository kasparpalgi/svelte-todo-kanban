<!-- @file src/routes/[lang]/[username]/[board]/invoices/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import InvoiceList from '$lib/components/invoice/InvoiceList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	let boardAlias = $derived($page.params.board);
	let username = $derived($page.params.username);
	let lang = $derived($page.params.lang);

	let board = $derived(listsStore.boards.find((b) => b.alias === boardAlias));

	function handleNewInvoice() {
		console.log('[InvoicesPage] handleNewInvoice called');
		console.log('[InvoicesPage] Reactive values:', { lang, username, boardAlias });

		const targetUrl = `/${lang}/${username}/${boardAlias}/invoices/new`;
		console.log('[InvoicesPage] Navigating to:', targetUrl);

		try {
			goto(targetUrl);
			console.log('[InvoicesPage] goto() called successfully');
		} catch (error) {
			console.error('[InvoicesPage] goto() failed:', error);
		}
	}

	function handleInvoiceClick(invoiceId: string) {
		console.log('[InvoicesPage] handleInvoiceClick called with:', invoiceId);
		goto(`/${lang}/${username}/${boardAlias}/invoices/${invoiceId}`);
	}

	function goBack() {
		goto(`/${lang}/${username}/${boardAlias}`);
	}
</script>

<svelte:head>
	<title>{$t('board.invoices')} - {board?.name || $t('board.board')}</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<Button
		variant="ghost"
		onclick={goBack}
		class="mb-4 gap-2"
	>
		<ArrowLeft class="h-4 w-4" />
		{$t('common.back_to_board')}
	</Button>

	{#if board}
		<InvoiceList
			boardId={board.id}
			onNewInvoice={handleNewInvoice}
			onInvoiceClick={handleInvoiceClick}
		/>
	{:else}
		<div class="py-8 text-center">{$t('common.board_not_found')}</div>
	{/if}
</div>
