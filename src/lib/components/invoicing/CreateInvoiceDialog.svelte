<!-- @file src/lib/components/invoicing/CreateInvoiceDialog.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { invoicingStore } from '$lib/stores/invoicing.svelte';
	import { clientsStore } from '$lib/stores/clients.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import type { ListFieldsFragment } from '$lib/graphql/generated/graphql';

	interface Props {
		open: boolean;
		boardId: string;
		lists: ListFieldsFragment[];
		onCreated?: (invoiceId: string) => void;
	}

	let { open = $bindable(), boardId, lists, onCreated }: Props = $props();

	type Step = 'select-lists' | 'select-todos' | 'invoice-details' | 'confirm';

	let step = $state<Step>('select-lists');
	let selectedListIds = $state<string[]>([]);
	let selectedTodoIds = $state<string[]>([]);
	let saving = $state(false);

	const todosForInvoicing = $derived(invoicingStore.todosForInvoicing);
	const clients = $derived(clientsStore.clients);

	let form = $state({
		clientId: '',
		invoiceNumber: '',
		issuedDate: new Date().toISOString().split('T')[0],
		dueDate: '',
		currency: 'EUR',
		hourlyRate: '',
		notes: ''
	});

	const totalHours = $derived(
		todosForInvoicing
			.filter((t) => selectedTodoIds.includes(t.id))
			.reduce((sum, t) => sum + (t.actual_hours || 0), 0)
	);

	const totalAmount = $derived(totalHours * (parseFloat(form.hourlyRate) || 0));

	const selectedClient = $derived(clients.find((c) => c.id === form.clientId));

	$effect(() => {
		if (open && clients.length > 0 && !form.clientId) {
			form.clientId = clients[0].id;
		}
	});

	$effect(() => {
		if (selectedClient?.default_rate && !form.hourlyRate) {
			form.hourlyRate = selectedClient.default_rate.toString();
		}
		if (selectedClient?.currency) {
			form.currency = selectedClient.currency;
		}
	});

	function toggleList(listId: string) {
		selectedListIds = selectedListIds.includes(listId)
			? selectedListIds.filter((id) => id !== listId)
			: [...selectedListIds, listId];
	}

	function toggleTodo(todoId: string) {
		selectedTodoIds = selectedTodoIds.includes(todoId)
			? selectedTodoIds.filter((id) => id !== todoId)
			: [...selectedTodoIds, todoId];
	}

	async function goToSelectTodos() {
		if (selectedListIds.length === 0) {
			displayMessage($t('invoicing.select_at_least_one_list'));
			return;
		}
		await invoicingStore.loadTodosForInvoicing(selectedListIds);
		selectedTodoIds = todosForInvoicing.map((t) => t.id);
		step = 'select-todos';
	}

	function goToInvoiceDetails() {
		if (selectedTodoIds.length === 0) {
			displayMessage($t('invoicing.select_at_least_one_todo'));
			return;
		}
		step = 'invoice-details';
	}

	function goToConfirm() {
		if (!form.clientId) {
			displayMessage($t('invoicing.client_required'));
			return;
		}
		if (!form.invoiceNumber.trim()) {
			displayMessage($t('invoicing.invoice_number_required'));
			return;
		}
		if (!form.hourlyRate || parseFloat(form.hourlyRate) <= 0) {
			displayMessage($t('invoicing.rate_required'));
			return;
		}
		step = 'confirm';
	}

	async function handleCreate() {
		saving = true;
		const result = await invoicingStore.createInvoice({
			boardId,
			clientId: form.clientId,
			invoiceNumber: form.invoiceNumber.trim(),
			issuedDate: form.issuedDate,
			dueDate: form.dueDate || undefined,
			currency: form.currency,
			hourlyRate: parseFloat(form.hourlyRate),
			notes: form.notes.trim() || undefined,
			selectedTodoIds,
			todos: todosForInvoicing
		});
		saving = false;

		if (result.success) {
			displayMessage($t('invoicing.created'), 2000, true);
			open = false;
			if (result.data?.id) onCreated?.(result.data.id);
			resetDialog();
		}
	}

	function resetDialog() {
		step = 'select-lists';
		selectedListIds = [];
		selectedTodoIds = [];
		form = {
			clientId: clients[0]?.id || '',
			invoiceNumber: '',
			issuedDate: new Date().toISOString().split('T')[0],
			dueDate: '',
			currency: 'EUR',
			hourlyRate: '',
			notes: ''
		};
	}

	const todosByList = $derived(
		selectedListIds.map((listId) => ({
			listId,
			listName: lists.find((l) => l.id === listId)?.name || listId,
			todos: todosForInvoicing.filter((t) => t.list_id === listId)
		}))
	);
</script>

<Dialog bind:open>
	<DialogContent class="max-w-xl">
		<DialogHeader>
			<DialogTitle>{$t('invoicing.create_invoice')}</DialogTitle>
			<DialogDescription>
				{#if step === 'select-lists'}
					{$t('invoicing.step_select_lists')}
				{:else if step === 'select-todos'}
					{$t('invoicing.step_select_todos')}
				{:else if step === 'invoice-details'}
					{$t('invoicing.step_invoice_details')}
				{:else}
					{$t('invoicing.step_confirm')}
				{/if}
			</DialogDescription>
		</DialogHeader>

		{#if step === 'select-lists'}
			<div class="space-y-2 py-2">
				{#each lists as list (list.id)}
					<label class="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-3">
						<Checkbox
							checked={selectedListIds.includes(list.id)}
							onCheckedChange={() => toggleList(list.id)}
						/>
						<span>{list.name}</span>
					</label>
				{/each}
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (open = false)}>{$t('common.cancel')}</Button>
				<Button onclick={goToSelectTodos} disabled={selectedListIds.length === 0}>
					{$t('common.next')}
				</Button>
			</DialogFooter>
		{:else if step === 'select-todos'}
			<div class="max-h-80 space-y-3 overflow-y-auto py-2">
				{#if todosForInvoicing.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">
						{$t('invoicing.no_todos_with_hours')}
					</p>
				{:else}
					{#each todosByList as group (group.listId)}
						{#if group.todos.length > 0}
							<div>
								<p class="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									{group.listName}
								</p>
								<div class="space-y-1">
									{#each group.todos as todo (todo.id)}
										<label
											class="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/40"
										>
											<Checkbox
												checked={selectedTodoIds.includes(todo.id)}
												onCheckedChange={() => toggleTodo(todo.id)}
											/>
											<span class="flex-1 text-sm">{todo.title}</span>
											<span class="text-xs text-muted-foreground">{todo.actual_hours}h</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>
			<div class="text-sm text-muted-foreground">
				{$t('invoicing.selected_hours', { hours: totalHours.toFixed(2) })}
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (step = 'select-lists')}
					>{$t('common.back')}</Button
				>
				<Button onclick={goToInvoiceDetails} disabled={selectedTodoIds.length === 0}>
					{$t('common.next')}
				</Button>
			</DialogFooter>
		{:else if step === 'invoice-details'}
			<div class="grid gap-4 py-2">
				<div class="grid gap-1.5">
					<Label>{$t('invoicing.client')}</Label>
					<select
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
						bind:value={form.clientId}
					>
						{#each clients as client (client.id)}
							<option value={client.id}
								>{client.name}{client.company_name ? ` — ${client.company_name}` : ''}</option
							>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1.5">
						<Label for="inv-number">{$t('invoicing.invoice_number')} *</Label>
						<Input id="inv-number" bind:value={form.invoiceNumber} placeholder="INV-001" />
					</div>
					<div class="grid gap-1.5">
						<Label for="inv-currency">{$t('clients.currency')}</Label>
						<Input id="inv-currency" bind:value={form.currency} maxlength={3} />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1.5">
						<Label for="issued-date">{$t('invoicing.issued_date')}</Label>
						<Input id="issued-date" type="date" bind:value={form.issuedDate} />
					</div>
					<div class="grid gap-1.5">
						<Label for="due-date">{$t('invoicing.due_date')}</Label>
						<Input id="due-date" type="date" bind:value={form.dueDate} />
					</div>
				</div>
				<div class="grid gap-1.5">
					<Label for="hourly-rate">{$t('invoicing.hourly_rate')} *</Label>
					<Input
						id="hourly-rate"
						type="number"
						min="0"
						step="0.01"
						bind:value={form.hourlyRate}
						placeholder="0.00"
					/>
				</div>
				<div class="grid gap-1.5">
					<Label for="inv-notes">{$t('invoicing.notes')}</Label>
					<Input id="inv-notes" bind:value={form.notes} />
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (step = 'select-todos')}
					>{$t('common.back')}</Button
				>
				<Button onclick={goToConfirm}>{$t('common.next')}</Button>
			</DialogFooter>
		{:else if step === 'confirm'}
			<div class="space-y-3 py-2">
				<div class="rounded-lg border bg-muted/30 p-4 text-sm">
					<p><span class="font-medium">{$t('invoicing.client')}:</span> {selectedClient?.name}</p>
					<p>
						<span class="font-medium">{$t('invoicing.invoice_number')}:</span>
						{form.invoiceNumber}
					</p>
					<p><span class="font-medium">{$t('invoicing.issued_date')}:</span> {form.issuedDate}</p>
					{#if form.dueDate}
						<p><span class="font-medium">{$t('invoicing.due_date')}:</span> {form.dueDate}</p>
					{/if}
					<p>
						<span class="font-medium">{$t('invoicing.hourly_rate')}:</span>
						{form.hourlyRate}
						{form.currency}/h
					</p>
					<p class="mt-2 text-base font-semibold">
						{$t('invoicing.total')}: {totalAmount.toFixed(2)}
						{form.currency}
						({totalHours.toFixed(2)}h)
					</p>
				</div>
				<p class="text-sm text-muted-foreground">
					{$t('invoicing.items_count', { count: selectedTodoIds.length })}
				</p>
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => (step = 'invoice-details')}
					>{$t('common.back')}</Button
				>
				<Button onclick={handleCreate} disabled={saving}>
					{saving ? $t('common.saving') : $t('invoicing.create_invoice')}
				</Button>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
