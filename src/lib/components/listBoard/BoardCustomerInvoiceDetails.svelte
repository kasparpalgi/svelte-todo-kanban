<!-- @file src/lib/components/listBoard/BoardCustomerInvoiceDetails.svelte -->
<script lang="ts">
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Building2, Save } from 'lucide-svelte';

	interface Props {
		boardId: string;
	}

	let { boardId }: Props = $props();

	let boards = $derived(listsStore.boards);
	let board = $derived(boards.find((b) => b.id === boardId));
	let saving = $state(false);

	// Form data with default values
	let formData = $state({
		company_name: '',
		code: '',
		vat: '',
		address: '',
		contact_details: '',
		hourly_rate: 0
	});

	// Initialize form data from board settings
	$effect(() => {
		if (board?.customer_invoice_details) {
			formData = {
				company_name: board.customer_invoice_details.company_name || '',
				code: board.customer_invoice_details.code || '',
				vat: board.customer_invoice_details.vat || '',
				address: board.customer_invoice_details.address || '',
				contact_details: board.customer_invoice_details.contact_details || '',
				hourly_rate: board.customer_invoice_details.hourly_rate || 0
			};
		}
	});

	async function handleSave() {
		if (!boardId) {
			displayMessage('Board not found');
			return;
		}

		saving = true;

		try {
			const result = await listsStore.updateBoardCustomerInvoiceDetails(boardId, formData);

			if (result.success) {
				displayMessage('Customer details saved successfully', 3000, true);
			} else {
				displayMessage(result.message || 'Failed to save customer details');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save customer details';
			displayMessage(message);
		} finally {
			saving = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<Building2 class="h-5 w-5" />
			<CardTitle>Customer Invoice Details</CardTitle>
		</div>
		<CardDescription>
			Customer details that will appear on invoices for this board
		</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			on:submit|preventDefault={handleSave}
			class="space-y-4"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="customer_company_name">Customer Company Name</Label>
					<Input
						id="customer_company_name"
						type="text"
						bind:value={formData.company_name}
						placeholder="Customer Company Ltd"
					/>
				</div>

				<div class="space-y-2">
					<Label for="customer_code">Company Code</Label>
					<Input
						id="customer_code"
						type="text"
						bind:value={formData.code}
						placeholder="87654321"
					/>
				</div>

				<div class="space-y-2">
					<Label for="customer_vat">VAT Number</Label>
					<Input
						id="customer_vat"
						type="text"
						bind:value={formData.vat}
						placeholder="EE987654321"
					/>
				</div>

				<div class="space-y-2">
					<Label for="customer_contact">Contact Details</Label>
					<Input
						id="customer_contact"
						type="text"
						bind:value={formData.contact_details}
						placeholder="Email, phone, etc."
					/>
				</div>

				<div class="space-y-2">
					<Label for="hourly_rate">Hourly Rate</Label>
					<Input
						id="hourly_rate"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.hourly_rate}
						placeholder="75.00"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="customer_address">Address</Label>
				<Textarea
					id="customer_address"
					bind:value={formData.address}
					placeholder="Street address&#10;City, ZIP&#10;Country"
					rows={3}
					class="resize-none"
				/>
			</div>

			<div class="flex justify-end">
				<Button
					type="submit"
					disabled={saving}
					class="gap-2"
				>
					<Save class="h-4 w-4" />
					{saving ? 'Saving...' : 'Save Customer Details'}
				</Button>
			</div>
		</form>
	</CardContent>
</Card>
