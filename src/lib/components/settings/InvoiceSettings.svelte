<!-- @file src/lib/components/settings/InvoiceSettings.svelte -->
<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
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
	import { FileText, Save } from 'lucide-svelte';

	let user = $derived(userStore.user);
	let saving = $state(false);

	// Form data with default values
	let formData = $state({
		company_name: '',
		code: '',
		vat: '',
		address: '',
		contact_details: ''
	});

	// Initialize form data from user settings
	$effect(() => {
		if (user?.invoice_from_details) {
			formData = {
				company_name: user.invoice_from_details.company_name || '',
				code: user.invoice_from_details.code || '',
				vat: user.invoice_from_details.vat || '',
				address: user.invoice_from_details.address || '',
				contact_details: user.invoice_from_details.contact_details || ''
			};
		}
	});

	async function handleSave() {
		if (!user?.id) {
			displayMessage('User not found');
			return;
		}

		saving = true;

		try {
			const result = await userStore.updateInvoiceFromDetails(user.id, formData);

			if (result.success) {
				displayMessage('Invoice details saved successfully', 3000, true);
			} else {
				displayMessage(result.message || 'Failed to save invoice details');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save invoice details';
			displayMessage(message);
		} finally {
			saving = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<FileText class="h-5 w-5" />
			<CardTitle>Invoice From Details</CardTitle>
		</div>
		<CardDescription>
			Your company details that will appear on invoices you generate
		</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			on:submit|preventDefault={handleSave}
			class="space-y-4"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="company_name">Company Name</Label>
					<Input
						id="company_name"
						type="text"
						bind:value={formData.company_name}
						placeholder="Your Company Ltd"
					/>
				</div>

				<div class="space-y-2">
					<Label for="code">Company Code</Label>
					<Input
						id="code"
						type="text"
						bind:value={formData.code}
						placeholder="12345678"
					/>
				</div>

				<div class="space-y-2">
					<Label for="vat">VAT Number</Label>
					<Input
						id="vat"
						type="text"
						bind:value={formData.vat}
						placeholder="EE123456789"
					/>
				</div>

				<div class="space-y-2">
					<Label for="contact_details">Contact Details</Label>
					<Input
						id="contact_details"
						type="text"
						bind:value={formData.contact_details}
						placeholder="Email, phone, etc."
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="address">Address</Label>
				<Textarea
					id="address"
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
					{saving ? 'Saving...' : 'Save Invoice Details'}
				</Button>
			</div>
		</form>
	</CardContent>
</Card>
