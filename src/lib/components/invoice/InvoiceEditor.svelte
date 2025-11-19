<!-- @file src/lib/components/invoice/InvoiceEditor.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { invoicesStore } from '$lib/stores/invoices.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Save, Plus, Trash2, FileText } from 'lucide-svelte';
	import InvoiceItemsEditor from './InvoiceItemsEditor.svelte';

	interface Props {
		invoiceId?: string;
		boardId: string;
	}

	let { invoiceId, boardId }: Props = $props();

	let user = $derived(userStore.user);
	let board = $derived(listsStore.boards.find((b) => b.id === boardId));
	let saving = $state(false);
	let isNew = $derived(!invoiceId);

	// Form data
	let formData = $state({
		invoice_number: '',
		invoice_date: new Date().toISOString().split('T')[0],
		due_date: '',
		status: 'draft',
		tax_rate: 0,
		notes: ''
	});

	let items = $state<any[]>([]);

	// Calculate totals
	let totals = $derived(() => {
		const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
		const taxAmount = subtotal * (formData.tax_rate / 100);
		const total = subtotal + taxAmount;
		return { subtotal, taxAmount, total };
	});

	// Load invoice if editing
	$effect(() => {
		if (invoiceId) {
			invoicesStore.loadInvoiceById(invoiceId);
		} else {
			// Generate invoice number for new invoice
			formData.invoice_number = invoicesStore.generateInvoiceNumber();
		}
	});

	// Populate form when invoice loads
	$effect(() => {
		const invoice = invoicesStore.currentInvoice;
		if (invoice && invoiceId) {
			formData = {
				invoice_number: invoice.invoice_number,
				invoice_date: invoice.invoice_date,
				due_date: invoice.due_date || '',
				status: invoice.status,
				tax_rate: invoice.tax_rate || 0,
				notes: invoice.notes || ''
			};
			items = invoicesStore.invoiceItems || [];
		}
	});

	async function handleSave() {
		if (!board) {
			displayMessage('Board not found');
			return;
		}

		if (!user?.invoice_from_details || !board.customer_invoice_details) {
			displayMessage(
				'Please set up invoice details in settings and customer details in board settings'
			);
			return;
		}

		if (items.length === 0) {
			displayMessage('Please add at least one item to the invoice');
			return;
		}

		saving = true;

		try {
			const { subtotal, taxAmount, total } = totals();

			const invoiceData = {
				invoice_number: formData.invoice_number,
				board_id: boardId,
				invoice_date: formData.invoice_date,
				due_date: formData.due_date || undefined,
				status: formData.status,
				customer_details: board.customer_invoice_details,
				invoice_from_details: user.invoice_from_details,
				subtotal,
				tax_rate: formData.tax_rate,
				tax_amount: taxAmount,
				total,
				notes: formData.notes
			};

			let result;

			if (invoiceId) {
				// Update existing invoice
				result = await invoicesStore.updateInvoice(invoiceId, invoiceData);

				// Update items
				for (const item of items) {
					if (item.id) {
						await invoicesStore.updateInvoiceItem(item.id, item);
					} else {
						await invoicesStore.addInvoiceItem({
							...item,
							invoice_id: invoiceId
						});
					}
				}
			} else {
				// Create new invoice with items
				result = await invoicesStore.createInvoice({
					...invoiceData,
					invoice_items: {
						data: items.map((item, index) => ({
							...item,
							sort_order: index
						}))
					}
				} as any);

				// Update todos with invoiced hours
				for (const item of items) {
					if (item.todo_id) {
						await invoicesStore.updateTodoInvoicedHours(item.todo_id, item.hours);
					}
				}
			}

			if (result.success) {
				displayMessage('Invoice saved successfully', 3000, true);
				if (result.data?.id) {
					goto(`../${result.data.id}`);
				}
			} else {
				displayMessage(result.message || 'Failed to save invoice');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save invoice';
			displayMessage(message);
		} finally {
			saving = false;
		}
	}

	function handleItemsChange(updatedItems: any[]) {
		items = updatedItems;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">
			<FileText class="inline h-6 w-6" />
			{isNew ? 'New Invoice' : `Edit Invoice ${formData.invoice_number}`}
		</h2>
		<Button
			on:click={handleSave}
			disabled={saving}
			class="gap-2"
		>
			<Save class="h-4 w-4" />
			{saving ? 'Saving...' : 'Save Invoice'}
		</Button>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Invoice Details -->
		<Card>
			<CardHeader>
				<CardTitle>Invoice Details</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="invoice_number">Invoice Number</Label>
					<Input
						id="invoice_number"
						type="text"
						bind:value={formData.invoice_number}
						required
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="invoice_date">Invoice Date</Label>
						<Input
							id="invoice_date"
							type="date"
							bind:value={formData.invoice_date}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="due_date">Due Date</Label>
						<Input
							id="due_date"
							type="date"
							bind:value={formData.due_date}
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="status">Status</Label>
					<Select bind:value={formData.status}>
						<SelectTrigger>
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="sent">Sent</SelectItem>
							<SelectItem value="paid">Paid</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="space-y-2">
					<Label for="tax_rate">Tax Rate (%)</Label>
					<Input
						id="tax_rate"
						type="number"
						step="0.01"
						min="0"
						max="100"
						bind:value={formData.tax_rate}
					/>
				</div>

				<div class="space-y-2">
					<Label for="notes">Notes</Label>
					<Textarea
						id="notes"
						bind:value={formData.notes}
						placeholder="Additional notes..."
						rows={3}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Totals -->
		<Card>
			<CardHeader>
				<CardTitle>Totals</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="flex justify-between text-lg">
					<span>Subtotal:</span>
					<span class="font-semibold">{totals().subtotal.toFixed(2)} €</span>
				</div>
				<div class="flex justify-between text-lg">
					<span>Tax ({formData.tax_rate}%):</span>
					<span class="font-semibold">{totals().taxAmount.toFixed(2)} €</span>
				</div>
				<div class="flex justify-between border-t pt-3 text-xl font-bold">
					<span>Total:</span>
					<span>{totals().total.toFixed(2)} €</span>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Invoice Items -->
	<InvoiceItemsEditor
		{boardId}
		bind:items
		onItemsChange={handleItemsChange}
	/>
</div>
