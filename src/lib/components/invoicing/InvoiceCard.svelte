<!-- @file src/lib/components/invoicing/InvoiceCard.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { invoicingStore } from '$lib/stores/invoicing.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Trash2, ChevronDown, ChevronUp, CheckCircle, Send } from 'lucide-svelte';
	import type { InvoiceFieldsFragment } from '$lib/graphql/generated/graphql';

	interface Props {
		invoice: InvoiceFieldsFragment;
	}

	let { invoice }: Props = $props();
	let expanded = $state(false);

	const statusVariant = $derived(
		invoice.status === 'paid'
			? 'default'
			: invoice.status === 'sent'
				? 'secondary'
				: invoice.status === 'cancelled'
					? 'destructive'
					: 'outline'
	);

	async function markSent() {
		const result = await invoicingStore.updateInvoiceStatus(invoice.id, 'sent');
		if (result.success) displayMessage($t('invoicing.marked_sent'), 2000, true);
	}

	async function markPaid() {
		const result = await invoicingStore.updateInvoiceStatus(invoice.id, 'paid');
		if (result.success) displayMessage($t('invoicing.marked_paid'), 2000, true);
	}

	async function handleDelete() {
		if (!confirm($t('invoicing.delete_confirm'))) return;
		const result = await invoicingStore.deleteInvoice(invoice.id);
		if (result.success) displayMessage($t('invoicing.deleted'), 2000, true);
	}
</script>

<div class="rounded-lg border bg-card">
	<div class="flex items-center justify-between p-4">
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<span class="font-semibold">{invoice.invoice_number}</span>
				<Badge variant={statusVariant}>{$t(`invoicing.status.${invoice.status}`)}</Badge>
			</div>
			{#if invoice.client}
				<p class="text-sm text-muted-foreground">{invoice.client.name}</p>
			{/if}
			<p class="text-xs text-muted-foreground">{invoice.issued_date}</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-lg font-bold">
				{Number(invoice.total_amount).toFixed(2)}
				{invoice.currency}
			</span>
			<div class="flex gap-1">
				{#if invoice.status === 'draft'}
					<Button variant="ghost" size="icon" title={$t('invoicing.mark_sent')} onclick={markSent}>
						<Send class="h-4 w-4" />
					</Button>
				{/if}
				{#if invoice.status === 'sent'}
					<Button variant="ghost" size="icon" title={$t('invoicing.mark_paid')} onclick={markPaid}>
						<CheckCircle class="h-4 w-4 text-green-600" />
					</Button>
				{/if}
				<Button variant="ghost" size="icon" onclick={() => (expanded = !expanded)}>
					{#if expanded}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</Button>
				<Button variant="ghost" size="icon" class="text-destructive" onclick={handleDelete}>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>

	{#if expanded}
		<div class="border-t px-4 pt-3 pb-4">
			<div class="mb-2 flex gap-4 text-sm">
				<span>{invoice.total_hours}h × {invoice.hourly_rate} {invoice.currency}/h</span>
				{#if invoice.due_date}
					<span class="text-muted-foreground">{$t('invoicing.due')}: {invoice.due_date}</span>
				{/if}
			</div>
			{#if invoice.items && invoice.items.length > 0}
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-xs text-muted-foreground">
							<th class="py-1">{$t('invoicing.item')}</th>
							<th class="py-1 text-right">{$t('invoicing.hours')}</th>
							<th class="py-1 text-right">{$t('invoicing.amount')}</th>
						</tr>
					</thead>
					<tbody>
						{#each invoice.items as item (item.id)}
							<tr class="border-t">
								<td class="py-1">{item.title}</td>
								<td class="py-1 text-right">{item.hours}h</td>
								<td class="py-1 text-right">{Number(item.amount).toFixed(2)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if invoice.notes}
				<p class="mt-2 text-xs text-muted-foreground">{invoice.notes}</p>
			{/if}
		</div>
	{/if}
</div>
