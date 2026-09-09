<script lang="ts">
	/** @file src/routes/[lang]/[username]/[board]/invoices/+page.svelte */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Plus, FileText } from 'lucide-svelte';
	import { invoicingStore } from '$lib/stores/invoicing.svelte';
	import { clientsStore } from '$lib/stores/clients.svelte';
	import InvoiceCard from '$lib/components/invoicing/InvoiceCard.svelte';
	import CreateInvoiceDialog from '$lib/components/invoicing/CreateInvoiceDialog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const board = data.board;
	const lists = data.lists;

	let createOpen = $state(false);

	onMount(() => {
		invoicingStore.loadBoardInvoices(board.id);
		clientsStore.loadClients();
	});

	const invoices = $derived(invoicingStore.invoices);
	const loading = $derived(invoicingStore.loading);
	const hasClients = $derived(clientsStore.clients.length > 0);

	function handleBack() {
		goto(`/${page.params.lang}/${page.params.username}/${page.params.board}`);
	}
</script>

<div class="container mx-auto max-w-3xl px-4 py-6">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon" onclick={handleBack}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="flex items-center gap-2 text-xl font-bold">
					<FileText class="h-5 w-5" />
					{$t('invoicing.title')}
				</h1>
				<p class="text-sm text-muted-foreground">{board.name}</p>
			</div>
		</div>
		<Button onclick={() => (createOpen = true)} disabled={!hasClients}>
			<Plus class="mr-1 h-4 w-4" />
			{$t('invoicing.new_invoice')}
		</Button>
	</div>

	{#if !hasClients}
		<div class="rounded-lg border p-6 text-center">
			<p class="mb-2 text-muted-foreground">{$t('invoicing.no_clients_hint')}</p>
			<Button variant="outline" onclick={() => goto(`/${page.params.lang}/settings`)}>
				{$t('invoicing.go_to_settings')}
			</Button>
		</div>
	{:else if loading}
		<p class="py-8 text-center text-muted-foreground">{$t('common.loading')}</p>
	{:else if invoices.length === 0}
		<div class="rounded-lg border p-8 text-center">
			<FileText class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
			<p class="text-muted-foreground">{$t('invoicing.empty')}</p>
			<Button class="mt-4" onclick={() => (createOpen = true)}>
				{$t('invoicing.new_invoice')}
			</Button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each invoices as invoice (invoice.id)}
				<InvoiceCard {invoice} />
			{/each}
		</div>
	{/if}
</div>

<CreateInvoiceDialog bind:open={createOpen} boardId={board.id} {lists} />
