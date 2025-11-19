<!-- @file src/lib/components/invoice/InvoiceList.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { FileText, Plus, Calendar, DollarSign } from 'lucide-svelte';

	interface Props {
		boardId?: string;
		onInvoiceClick?: (invoiceId: string) => void;
		onNewInvoice?: () => void;
	}

	let { boardId, onInvoiceClick, onNewInvoice }: Props = $props();

	let invoices = $derived(invoicesStore.invoices);
	let loading = $derived(invoicesStore.loading);

	// Load invoices on mount
	$effect(() => {
		if (boardId) {
			invoicesStore.loadBoardInvoices(boardId);
		} else {
			invoicesStore.loadInvoices();
		}
	});

	function getStatusColor(status: string): string {
		switch (status) {
			case 'draft':
				return 'bg-gray-500';
			case 'sent':
				return 'bg-blue-500';
			case 'paid':
				return 'bg-green-500';
			case 'cancelled':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	function handleInvoiceClick(invoiceId: string) {
		if (onInvoiceClick) {
			onInvoiceClick(invoiceId);
		} else {
			goto(`invoices/${invoiceId}`);
		}
	}

	function handleNewInvoice() {
		if (onNewInvoice) {
			onNewInvoice();
		} else {
			goto('invoices/new');
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Invoices</h2>
		<Button
			onclick={handleNewInvoice}
			class="gap-2"
		>
			<Plus class="h-4 w-4" />
			New Invoice
		</Button>
	</div>

	{#if loading}
		<div class="py-8 text-center text-muted-foreground">Loading invoices...</div>
	{:else if invoices.length === 0}
		<Card>
			<CardContent class="py-8">
				<div class="flex flex-col items-center justify-center text-center">
					<FileText class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="mb-2 text-lg font-semibold">No invoices yet</h3>
					<p class="mb-4 text-sm text-muted-foreground">
						Create your first invoice to get started
					</p>
					<Button
						onclick={handleNewInvoice}
						class="gap-2"
					>
						<Plus class="h-4 w-4" />
						Create Invoice
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each invoices as invoice (invoice.id)}
				<Card
					class="cursor-pointer transition-shadow hover:shadow-md"
					onclick={() => handleInvoiceClick(invoice.id)}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleInvoiceClick(invoice.id);
						}
					}}
				>
					<CardHeader>
						<div class="flex items-start justify-between">
							<div>
								<CardTitle class="flex items-center gap-2">
									<FileText class="h-5 w-5" />
									{invoice.invoice_number}
								</CardTitle>
								<CardDescription>
									{invoice.customer_details?.company_name || 'No customer name'}
								</CardDescription>
							</div>
							<Badge class={getStatusColor(invoice.status)}>
								{invoice.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid gap-2 text-sm">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Calendar class="h-4 w-4" />
								<span>Date: {formatDate(invoice.invoice_date)}</span>
								{#if invoice.due_date}
									<span>• Due: {formatDate(invoice.due_date)}</span>
								{/if}
							</div>
							<div class="flex items-center gap-2 font-semibold">
								<DollarSign class="h-4 w-4" />
								<span>Total: {formatCurrency(invoice.total)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
