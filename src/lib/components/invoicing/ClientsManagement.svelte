<!-- @file src/lib/components/invoicing/ClientsManagement.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { clientsStore } from '$lib/stores/clients.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
	import { Plus, Pencil, Trash2, Building2 } from 'lucide-svelte';
	import type { ClientFieldsFragment } from '$lib/graphql/generated/graphql';

	const clients = $derived(clientsStore.clients);
	const loading = $derived(clientsStore.loading);

	let dialogOpen = $state(false);
	let editingClient = $state<ClientFieldsFragment | null>(null);
	let saving = $state(false);

	let form = $state({
		name: '',
		company_name: '',
		email: '',
		phone: '',
		address: '',
		vat_number: '',
		currency: 'EUR',
		default_rate: '',
		notes: ''
	});

	onMount(() => {
		clientsStore.loadClients();
	});

	function openCreate() {
		editingClient = null;
		form = {
			name: '',
			company_name: '',
			email: '',
			phone: '',
			address: '',
			vat_number: '',
			currency: 'EUR',
			default_rate: '',
			notes: ''
		};
		dialogOpen = true;
	}

	function openEdit(client: ClientFieldsFragment) {
		editingClient = client;
		form = {
			name: client.name,
			company_name: client.company_name || '',
			email: client.email || '',
			phone: client.phone || '',
			address: client.address || '',
			vat_number: client.vat_number || '',
			currency: client.currency,
			default_rate: client.default_rate?.toString() || '',
			notes: client.notes || ''
		};
		dialogOpen = true;
	}

	async function handleSave() {
		if (!form.name.trim()) {
			displayMessage($t('clients.name_required'));
			return;
		}

		saving = true;
		const payload = {
			name: form.name.trim(),
			company_name: form.company_name.trim() || null,
			email: form.email.trim() || null,
			phone: form.phone.trim() || null,
			address: form.address.trim() || null,
			vat_number: form.vat_number.trim() || null,
			currency: form.currency || 'EUR',
			default_rate: form.default_rate ? parseFloat(form.default_rate) : null,
			notes: form.notes.trim() || null
		};

		let result;
		if (editingClient) {
			result = await clientsStore.updateClient(editingClient.id, payload);
		} else {
			result = await clientsStore.createClient(payload);
		}

		saving = false;
		if (result.success) {
			displayMessage(editingClient ? $t('clients.updated') : $t('clients.created'), 2000, true);
			dialogOpen = false;
		}
	}

	async function handleDelete(client: ClientFieldsFragment) {
		if (!confirm($t('clients.delete_confirm', { name: client.name }))) return;
		const result = await clientsStore.deleteClient(client.id);
		if (result.success) displayMessage($t('clients.deleted'), 2000, true);
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle class="flex items-center gap-2">
					<Building2 class="h-5 w-5" />
					{$t('clients.title')}
				</CardTitle>
				<CardDescription>{$t('clients.description')}</CardDescription>
			</div>
			<Button onclick={openCreate} size="sm">
				<Plus class="mr-1 h-4 w-4" />
				{$t('clients.add')}
			</Button>
		</div>
	</CardHeader>
	<CardContent>
		{#if loading}
			<p class="text-sm text-muted-foreground">{$t('common.loading')}</p>
		{:else if clients.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">{$t('clients.empty')}</p>
		{:else}
			<div class="space-y-2">
				{#each clients as client (client.id)}
					<div class="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
						<div>
							<p class="font-medium">{client.name}</p>
							{#if client.company_name}
								<p class="text-sm text-muted-foreground">{client.company_name}</p>
							{/if}
							{#if client.email}
								<p class="text-xs text-muted-foreground">{client.email}</p>
							{/if}
						</div>
						<div class="flex items-center gap-1">
							{#if client.default_rate}
								<span class="mr-2 text-sm text-muted-foreground">
									{client.default_rate}
									{client.currency}/h
								</span>
							{/if}
							<Button variant="ghost" size="icon" onclick={() => openEdit(client)}>
								<Pencil class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="text-destructive"
								onclick={() => handleDelete(client)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>

<Dialog bind:open={dialogOpen}>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle>
				{editingClient ? $t('clients.edit') : $t('clients.add')}
			</DialogTitle>
		</DialogHeader>

		<div class="grid gap-4 py-2">
			<div class="grid gap-1.5">
				<Label for="client-name">{$t('clients.name')} *</Label>
				<Input
					id="client-name"
					bind:value={form.name}
					placeholder={$t('clients.name_placeholder')}
				/>
			</div>
			<div class="grid gap-1.5">
				<Label for="company-name">{$t('clients.company_name')}</Label>
				<Input
					id="company-name"
					bind:value={form.company_name}
					placeholder={$t('clients.company_placeholder')}
				/>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label for="client-email">{$t('clients.email')}</Label>
					<Input id="client-email" type="email" bind:value={form.email} />
				</div>
				<div class="grid gap-1.5">
					<Label for="client-phone">{$t('clients.phone')}</Label>
					<Input id="client-phone" bind:value={form.phone} />
				</div>
			</div>
			<div class="grid gap-1.5">
				<Label for="client-address">{$t('clients.address')}</Label>
				<Input id="client-address" bind:value={form.address} />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="grid gap-1.5">
					<Label for="vat-number">{$t('clients.vat_number')}</Label>
					<Input id="vat-number" bind:value={form.vat_number} />
				</div>
				<div class="grid gap-1.5">
					<Label for="currency">{$t('clients.currency')}</Label>
					<Input id="currency" bind:value={form.currency} placeholder="EUR" maxlength={3} />
				</div>
			</div>
			<div class="grid gap-1.5">
				<Label for="default-rate">{$t('clients.default_rate')}</Label>
				<Input
					id="default-rate"
					type="number"
					min="0"
					step="0.01"
					bind:value={form.default_rate}
					placeholder="0.00"
				/>
			</div>
			<div class="grid gap-1.5">
				<Label for="client-notes">{$t('clients.notes')}</Label>
				<Input id="client-notes" bind:value={form.notes} />
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => (dialogOpen = false)}>{$t('common.cancel')}</Button>
			<Button onclick={handleSave} disabled={saving}>
				{saving ? $t('common.saving') : $t('common.save')}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
