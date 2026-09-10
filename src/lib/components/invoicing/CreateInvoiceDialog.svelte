<!-- @file src/lib/components/invoicing/CreateInvoiceDialog.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { invoicingStore } from '$lib/stores/invoicing.svelte';
	import { clientsStore } from '$lib/stores/clients.svelte';
	import { invoiceCompaniesStore } from '$lib/stores/invoiceCompanies.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { formatLocaleDate } from '$lib/utils/dateTime.svelte';
	import { parseDate } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Calendar as CalendarPrimitive } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Calendar as CalendarIcon, Plus, X } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { ListFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { DateValue } from '@internationalized/date';

	interface Props {
		open: boolean;
		boardId: string;
		lists: ListFieldsFragment[];
		lang: string;
		onCreated?: (invoiceId: string) => void;
	}

	let { open = $bindable(), boardId, lists, lang = 'en', onCreated }: Props = $props();

	type Step = 'select-lists' | 'select-todos' | 'invoice-details' | 'confirm';

	let step = $state<Step>('select-lists');
	let selectedListIds = $state<string[]>([]);
	let selectedTodoIds = $state<string[]>([]);
	let saving = $state(false);
	let issuedDatePickerOpen = $state(false);
	let dueDatePickerOpen = $state(false);

	const todosForInvoicing = $derived(invoicingStore.todosForInvoicing);
	const clients = $derived(clientsStore.clients);
	const companies = $derived(invoiceCompaniesStore.companies);

	type CustomField = { label: string; value: string };

	function todayISODate() {
		return new Date().toISOString().split('T')[0];
	}

	function addDays(isoDate: string, days: number): string {
		const d = new Date(isoDate);
		d.setDate(d.getDate() + days);
		return d.toISOString().split('T')[0];
	}

	function isoToDateValue(iso: string): DateValue | undefined {
		try {
			return parseDate(iso);
		} catch {
			return undefined;
		}
	}

	let form = $state({
		clientId: '',
		companyId: '',
		invoiceNumber: '',
		issuedDate: todayISODate(),
		dueDate: addDays(todayISODate(), 5),
		currency: 'EUR',
		hourlyRate: '',
		notes: ''
	});

	let customFields = $state<CustomField[]>([]);

	function addCustomField() {
		customFields = [...customFields, { label: '', value: '' }];
	}

	function removeCustomField(i: number) {
		customFields = customFields.filter((_, idx) => idx !== i);
	}

	let selectedIssuedDate = $state<DateValue | undefined>(isoToDateValue(form.issuedDate));
	let selectedDueDate = $state<DateValue | undefined>(isoToDateValue(form.dueDate));

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
		if (open && companies.length > 0 && !form.companyId) {
			const def = companies.find((c) => c.is_default);
			form.companyId = def?.id || companies[0].id;
		}
		if (open && companies.length === 0) {
			invoiceCompaniesStore.loadCompanies();
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

	$effect(() => {
		if (selectedIssuedDate) {
			form.issuedDate = `${selectedIssuedDate.year}-${String(selectedIssuedDate.month).padStart(2, '0')}-${String(selectedIssuedDate.day).padStart(2, '0')}`;
		}
	});

	$effect(() => {
		if (selectedDueDate) {
			form.dueDate = `${selectedDueDate.year}-${String(selectedDueDate.month).padStart(2, '0')}-${String(selectedDueDate.day).padStart(2, '0')}`;
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
		if (!form.invoiceNumber) {
			invoicingStore.getNextInvoiceNumber().then((num) => {
				if (num && !form.invoiceNumber) form.invoiceNumber = num;
			});
		}
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
			companyId: form.companyId || undefined,
			invoiceNumber: form.invoiceNumber.trim(),
			issuedDate: form.issuedDate,
			dueDate: form.dueDate || undefined,
			currency: form.currency,
			hourlyRate: parseFloat(form.hourlyRate),
			notes: form.notes.trim() || undefined,
			customFields: customFields.filter((f) => f.label.trim()),
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
		customFields = [];
		const today = todayISODate();
		const def = companies.find((c) => c.is_default);
		form = {
			clientId: clients[0]?.id || '',
			companyId: def?.id || companies[0]?.id || '',
			invoiceNumber: '',
			issuedDate: today,
			dueDate: addDays(today, 5),
			currency: 'EUR',
			hourlyRate: '',
			notes: ''
		};
		selectedIssuedDate = isoToDateValue(form.issuedDate);
		selectedDueDate = isoToDateValue(form.dueDate);
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
				<div class="grid grid-cols-2 gap-3">
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
					<div class="grid gap-1.5">
						<Label>{$t('invoice_companies.title')}</Label>
						<select
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
							bind:value={form.companyId}
						>
							<option value="">—</option>
							{#each companies as company (company.id)}
								<option value={company.id}>{company.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1.5">
						<Label for="inv-number">{$t('invoicing.invoice_number')} *</Label>
						<Input id="inv-number" bind:value={form.invoiceNumber} placeholder="2609101" />
					</div>
					<div class="grid gap-1.5">
						<Label for="inv-currency">{$t('clients.currency')}</Label>
						<Input id="inv-currency" bind:value={form.currency} maxlength={3} />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1.5">
						<Label>{$t('invoicing.issued_date')}</Label>
						<Popover bind:open={issuedDatePickerOpen}>
							<PopoverTrigger>
								<Button
									variant="outline"
									class={cn(
										'w-full justify-start text-left font-normal',
										!selectedIssuedDate && 'text-muted-foreground'
									)}
								>
									<CalendarIcon class="mr-2 h-4 w-4" />
									{selectedIssuedDate
										? formatLocaleDate(
												new Date(
													selectedIssuedDate.year,
													selectedIssuedDate.month - 1,
													selectedIssuedDate.day
												),
												lang
											)
										: $t('card.pick_date')}
								</Button>
							</PopoverTrigger>
							<PopoverContent class="w-auto p-0" align="start">
								<CalendarPrimitive
									type="single"
									value={selectedIssuedDate}
									locale={lang}
									onValueChange={(date: DateValue | undefined) => {
										selectedIssuedDate = date;
										issuedDatePickerOpen = false;
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div class="grid gap-1.5">
						<Label>{$t('invoicing.due_date')}</Label>
						<Popover bind:open={dueDatePickerOpen}>
							<PopoverTrigger>
								<Button
									variant="outline"
									class={cn(
										'w-full justify-start text-left font-normal',
										!selectedDueDate && 'text-muted-foreground'
									)}
								>
									<CalendarIcon class="mr-2 h-4 w-4" />
									{selectedDueDate
										? formatLocaleDate(
												new Date(
													selectedDueDate.year,
													selectedDueDate.month - 1,
													selectedDueDate.day
												),
												lang
											)
										: $t('card.pick_date')}
								</Button>
							</PopoverTrigger>
							<PopoverContent class="w-auto p-0" align="start">
								<CalendarPrimitive
									type="single"
									value={selectedDueDate}
									locale={lang}
									onValueChange={(date: DateValue | undefined) => {
										selectedDueDate = date;
										dueDatePickerOpen = false;
									}}
								/>
							</PopoverContent>
						</Popover>
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
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label>{$t('invoicing.custom_fields')}</Label>
						<Button variant="ghost" size="sm" onclick={addCustomField} class="h-7 gap-1 text-xs">
							<Plus class="h-3.5 w-3.5" />
							{$t('invoicing.add_field')}
						</Button>
					</div>
					{#each customFields as field, i (i)}
						<div class="flex gap-2">
							<Input
								bind:value={field.label}
								placeholder={$t('invoicing.field_label')}
								class="w-2/5"
							/>
							<Input
								bind:value={field.value}
								placeholder={$t('invoicing.field_value')}
								class="flex-1"
							/>
							<Button
								variant="ghost"
								size="icon"
								class="h-9 w-9 shrink-0"
								onclick={() => removeCustomField(i)}
							>
								<X class="h-4 w-4" />
							</Button>
						</div>
					{/each}
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
					<p>
						<span class="font-medium">{$t('invoicing.issued_date')}:</span>
						{selectedIssuedDate
							? formatLocaleDate(
									new Date(
										selectedIssuedDate.year,
										selectedIssuedDate.month - 1,
										selectedIssuedDate.day
									),
									lang
								)
							: form.issuedDate}
					</p>
					{#if selectedDueDate}
						<p>
							<span class="font-medium">{$t('invoicing.due_date')}:</span>
							{formatLocaleDate(
								new Date(selectedDueDate.year, selectedDueDate.month - 1, selectedDueDate.day),
								lang
							)}
						</p>
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
