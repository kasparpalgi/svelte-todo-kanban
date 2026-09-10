<!-- @file src/lib/components/invoicing/InvoiceCompaniesManagement.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { invoiceCompaniesStore } from '$lib/stores/invoiceCompanies.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Plus, Pencil, Trash2, Building } from 'lucide-svelte';
	import type { InvoiceCompanyFieldsFragment } from '$lib/graphql/generated/graphql';

	const companies = $derived(invoiceCompaniesStore.companies);
	const loading = $derived(invoiceCompaniesStore.loading);

	let dialogOpen = $state(false);
	let editingCompany = $state<InvoiceCompanyFieldsFragment | null>(null);
	let saving = $state(false);

	let form = $state({
		name: '',
		address: '',
		vat_number: '',
		vat_rate: '0',
		is_default: false
	});

	onMount(() => {
		invoiceCompaniesStore.loadCompanies();
	});

	function openCreate() {
		editingCompany = null;
		form = { name: '', address: '', vat_number: '', vat_rate: '0', is_default: false };
		dialogOpen = true;
	}

	function openEdit(company: InvoiceCompanyFieldsFragment) {
		editingCompany = company;
		form = {
			name: company.name,
			address: company.address || '',
			vat_number: company.vat_number || '',
			vat_rate: String(company.vat_rate ?? 0),
			is_default: company.is_default
		};
		dialogOpen = true;
	}

	async function handleSave() {
		if (!form.name.trim()) {
			displayMessage($t('invoice_companies.name_required'));
			return;
		}
		saving = true;
		const payload = {
			name: form.name.trim(),
			address: form.address.trim() || null,
			vat_number: form.vat_number.trim() || null,
			vat_rate: parseFloat(form.vat_rate) || 0,
			is_default: form.is_default
		};

		if (editingCompany) {
			const result = await invoiceCompaniesStore.updateCompany(editingCompany.id, payload);
			if (result.success) {
				displayMessage($t('invoice_companies.updated'), 2000, true);
				dialogOpen = false;
			}
		} else {
			const result = await invoiceCompaniesStore.createCompany(payload);
			if (result.success) {
				displayMessage($t('invoice_companies.created'), 2000, true);
				dialogOpen = false;
			}
		}
		saving = false;
	}

	async function handleDelete(company: InvoiceCompanyFieldsFragment) {
		if (!confirm($t('invoice_companies.delete_confirm', { name: company.name }))) return;
		const result = await invoiceCompaniesStore.deleteCompany(company.id);
		if (result.success) displayMessage($t('invoice_companies.deleted'), 2000, true);
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle class="flex items-center gap-2">
					<Building class="h-4 w-4" />
					{$t('invoice_companies.title')}
				</CardTitle>
				<CardDescription>{$t('invoice_companies.description')}</CardDescription>
			</div>
			<Button size="sm" onclick={openCreate}>
				<Plus class="mr-1 h-4 w-4" />
				{$t('invoice_companies.add')}
			</Button>
		</div>
	</CardHeader>
	<CardContent>
		{#if loading}
			<p class="py-4 text-center text-sm text-muted-foreground">{$t('common.loading')}</p>
		{:else if companies.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">
				{$t('invoice_companies.empty')}
			</p>
		{:else}
			<div class="space-y-2">
				{#each companies as company (company.id)}
					<div class="flex items-start justify-between rounded-lg border bg-muted/30 p-3">
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-2 font-medium">
								{company.name}
								{#if company.is_default}
									<span class="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
										>{$t('invoice_companies.default')}</span
									>
								{/if}
							</p>
							{#if company.address}
								<p class="mt-0.5 text-xs text-muted-foreground">{company.address}</p>
							{/if}
							<div class="mt-1 flex gap-3 text-xs text-muted-foreground">
								{#if company.vat_number}
									<span>{$t('invoice_companies.vat_id')}: {company.vat_number}</span>
								{/if}
								{#if company.vat_rate}
									<span>VAT: {company.vat_rate}%</span>
								{/if}
							</div>
						</div>
						<div class="ml-2 flex gap-1">
							<Button variant="ghost" size="icon" class="h-7 w-7" onclick={() => openEdit(company)}>
								<Pencil class="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-destructive"
								onclick={() => handleDelete(company)}
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>

<Dialog bind:open={dialogOpen}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>
				{editingCompany ? $t('invoice_companies.edit') : $t('invoice_companies.add')}
			</DialogTitle>
		</DialogHeader>
		<div class="grid gap-4 py-2">
			<div class="grid gap-1.5">
				<Label for="co-name">{$t('invoice_companies.name')} *</Label>
				<Input
					id="co-name"
					bind:value={form.name}
					placeholder={$t('invoice_companies.name_placeholder')}
				/>
			</div>
			<div class="grid gap-1.5">
				<Label for="co-address">{$t('invoice_companies.address')}</Label>
				<Input id="co-address" bind:value={form.address} />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label for="co-vat-number">{$t('invoice_companies.vat_number')}</Label>
					<Input id="co-vat-number" bind:value={form.vat_number} placeholder="EE123456789" />
				</div>
				<div class="grid gap-1.5">
					<Label for="co-vat-rate">{$t('invoice_companies.vat_rate')} (%)</Label>
					<Input
						id="co-vat-rate"
						type="number"
						min="0"
						max="100"
						step="0.01"
						bind:value={form.vat_rate}
						placeholder="0"
					/>
				</div>
			</div>
			<label class="flex cursor-pointer items-center gap-2">
				<Checkbox bind:checked={form.is_default} />
				<span class="text-sm">{$t('invoice_companies.set_as_default')}</span>
			</label>
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (dialogOpen = false)}>{$t('common.cancel')}</Button>
			<Button onclick={handleSave} disabled={saving}>
				{saving ? $t('common.saving') : $t('common.save')}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
