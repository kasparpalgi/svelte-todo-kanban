<script lang="ts">
	/** @file src/routes/[lang]/invoices/import/+page.svelte */
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { FolderIcon, FileIcon, LoaderCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let currentFolderId = $state('root');
	let folders = $state<any[]>([]);
	let files = $state<any[]>([]);
	let loadingFolders = $state(false);
	let processing = $state(false);
	let processedInvoices = $state<any[]>([]);
	let currentStep = $state<'select-folder' | 'select-files' | 'processing' | 'complete'>('select-folder');
	let selectedFileIds = $state<string[]>([]);
	let bankStatementFileId = $state<string | null>(null);
	let processingProgress = $state({ current: 0, total: 0 });
	let spreadsheetUrl = $state<string | null>(null);
	let breadcrumbs = $state<Array<{ id: string; name: string }>>([{ id: 'root', name: 'My Drive' }]);

	// Derived value for selected count
	const selectedCount = $derived(selectedFileIds.length);

	async function loadFolder(folderId: string, folderName?: string) {
		loadingFolders = true;
		try {
			const response = await fetch(`/api/google-drive/list?folderId=${folderId}&type=all`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load folder');
			}

			// Separate folders and PDF files
			folders = data.items.filter((item: any) => item.mimeType === 'application/vnd.google-apps.folder');
			files = data.items.filter((item: any) => item.mimeType === 'application/pdf');

			currentFolderId = folderId;

			// Update breadcrumbs
			if (folderName) {
				const existingIndex = breadcrumbs.findIndex((b) => b.id === folderId);
				if (existingIndex >= 0) {
					breadcrumbs = breadcrumbs.slice(0, existingIndex + 1);
				} else {
					breadcrumbs = [...breadcrumbs, { id: folderId, name: folderName }];
				}
			}

			currentStep = 'select-files';
		} catch (error: any) {
			displayMessage(error.message || 'Failed to load folder');
			console.error('Error loading folder:', error);
		} finally {
			loadingFolders = false;
		}
	}

	function toggleFileSelection(fileId: string) {
		if (selectedFileIds.includes(fileId)) {
			selectedFileIds = selectedFileIds.filter(id => id !== fileId);
		} else {
			selectedFileIds = [...selectedFileIds, fileId];
		}
	}

	function selectAllFiles() {
		selectedFileIds = files.map(file => file.id);
	}

	function deselectAllFiles() {
		selectedFileIds = [];
	}

	async function processInvoices() {
		if (selectedFileIds.length === 0) {
			displayMessage('Please select at least one PDF file');
			return;
		}

		processing = true;
		currentStep = 'processing';
		processedInvoices = [];

		// Calculate total invoices to process (exclude bank statement)
		const invoiceCount = bankStatementFileId
			? selectedFileIds.filter(id => id !== bankStatementFileId).length
			: selectedFileIds.length;
		processingProgress = { current: 0, total: invoiceCount };

		// Step 1: Extract payments from bank statement if provided
		let payments: any[] = [];
		if (bankStatementFileId) {
			try {
				console.log('Extracting payments from bank statement...');
				const downloadResponse = await fetch('/api/google-drive/download', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ fileId: bankStatementFileId })
				});

				if (downloadResponse.ok) {
					const downloadData = await downloadResponse.json();
					const extractResponse = await fetch('/api/bank-statement/extract', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							pdfBase64: downloadData.file.content,
							fileName: 'bank-statement.pdf'
						})
					});

					if (extractResponse.ok) {
						const extractData = await extractResponse.json();
						payments = extractData.payments || [];
						console.log(`Extracted ${payments.length} payments from bank statement`);
					}
				}
			} catch (error: any) {
				console.error('Error processing bank statement:', error);
				displayMessage('Warning: Could not extract payment dates from bank statement', 3000);
			}
		}

		// Step 2: Process invoices (exclude bank statement)
		const selectedFilesList = files.filter((f) =>
			selectedFileIds.includes(f.id) && f.id !== bankStatementFileId
		);

		for (const file of selectedFilesList) {
			try {
				console.log(`Processing ${file.name}...`);

				// Download PDF
				const downloadResponse = await fetch('/api/google-drive/download', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ fileId: file.id })
				});

				if (!downloadResponse.ok) {
					throw new Error('Failed to download file');
				}

				const downloadData = await downloadResponse.json();

				// Extract invoice data
				const extractResponse = await fetch('/api/invoices/extract', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						pdfBase64: downloadData.file.content,
						fileName: file.name
					})
				});

				if (!extractResponse.ok) {
					const errorData = await extractResponse.json();
					throw new Error(errorData.error || 'Failed to extract invoice data');
				}

				const extractData = await extractResponse.json();
				const invoiceData = extractData.data;

				// Step 3: Match payment date from bank statement
				if (payments.length > 0 && invoiceData.vendor_name && invoiceData.total_amount) {
					const matchedPayment = payments.find(p => {
						const vendorMatch = p.vendor.toLowerCase().includes(invoiceData.vendor_name.toLowerCase()) ||
							invoiceData.vendor_name.toLowerCase().includes(p.vendor.toLowerCase());
						const amountMatch = Math.abs(p.amount - invoiceData.total_amount) < 0.01;
						return vendorMatch && amountMatch;
					});

					if (matchedPayment) {
						invoiceData.payment_date = matchedPayment.date;
						console.log(`Matched payment for ${invoiceData.vendor_name}: ${matchedPayment.date}`);
					}
				}

				processedInvoices.push({
					fileName: file.name,
					...invoiceData
				});

				processingProgress.current++;
			} catch (error: any) {
				console.error(`Error processing ${file.name}:`, error);
				processedInvoices.push({
					fileName: file.name,
					error: error.message,
					vendor_name: null,
					invoice_number: null,
					invoice_date: null,
					total_amount: null,
					amount_without_vat: null,
					payment_date: null
				});
				processingProgress.current++;
			}
		}

		// Create spreadsheet
		try {
			const createSheetResponse = await fetch('/api/google-sheets/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					invoices: processedInvoices,
					title: `Invoices - ${new Date().toISOString().split('T')[0]}`
				})
			});

			const sheetData = await createSheetResponse.json();

			if (!createSheetResponse.ok) {
				// Show helpful error with link to enable API if available
				if (sheetData.enableUrl) {
					const message = `${sheetData.error}\n\nClick here to enable the Google Sheets API:`;
					displayMessage(message);
					console.error('Enable Google Sheets API:', sheetData.enableUrl);
					// Open the enable URL in a new tab
					window.open(sheetData.enableUrl, '_blank');
				} else {
					displayMessage(sheetData.error || 'Failed to create spreadsheet');
				}
				throw new Error(sheetData.error || 'Failed to create spreadsheet');
			}

			spreadsheetUrl = sheetData.spreadsheetUrl;

			currentStep = 'complete';
			displayMessage('Invoices processed successfully!', 3000, true);
		} catch (error: any) {
			// Error already handled above, just log it
			console.error('Error creating spreadsheet:', error);
		} finally {
			processing = false;
		}
	}

	function reset() {
		currentStep = 'select-folder';
		selectedFileIds = [];
		bankStatementFileId = null;
		processedInvoices = [];
		spreadsheetUrl = null;
		breadcrumbs = [{ id: 'root', name: 'My Drive' }];
		folders = [];
		files = [];
	}

	// Load root folder on mount
	$effect(() => {
		if ($page.data.session) {
			loadFolder('root');
		}
	});
</script>

<div class="container mx-auto max-w-6xl p-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Import Invoices from Google Drive</h1>
		<p class="mt-2 text-muted-foreground">
			Select PDFs from your Google Drive to extract invoice data and create a spreadsheet
		</p>
	</div>

	{#if !$page.data.session}
		<Card>
			<CardContent class="p-6">
				<p class="text-center">Please sign in with Google to access your Drive files</p>
			</CardContent>
		</Card>
	{:else if currentStep === 'select-folder' || currentStep === 'select-files'}
		<Card>
			<CardHeader>
				<CardTitle>Browse Google Drive</CardTitle>
				<CardDescription>
					Navigate to the folder containing your invoice PDFs
				</CardDescription>
			</CardHeader>
			<CardContent>
				<!-- Breadcrumbs -->
				<div class="mb-4 flex items-center gap-2 text-sm">
					{#each breadcrumbs as crumb, i}
						{#if i > 0}
							<span class="text-muted-foreground">/</span>
						{/if}
						<button
							onclick={() => loadFolder(crumb.id)}
							class="hover:underline"
							class:font-semibold={i === breadcrumbs.length - 1}
						>
							{crumb.name}
						</button>
					{/each}
				</div>

				{#if loadingFolders}
					<div class="flex items-center justify-center py-12">
						<LoaderCircle class="h-8 w-8 animate-spin" />
					</div>
				{:else}
					<!-- Folders -->
					{#if folders.length > 0}
						<div class="mb-6">
							<h3 class="mb-2 text-sm font-semibold">Folders</h3>
							<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{#each folders as folder}
									<button
										onclick={() => loadFolder(folder.id, folder.name)}
										class="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
									>
										<FolderIcon class="h-5 w-5 text-blue-500" />
										<span class="flex-1 truncate">{folder.name}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- PDF Files -->
					{#if files.length > 0}
						<div>
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-sm font-semibold">
									PDF Files ({files.length})
									{#if selectedCount > 0}
										<span class="ml-2 text-blue-600 dark:text-blue-400">
											- {selectedCount} selected
										</span>
									{/if}
								</h3>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onclick={selectAllFiles}
									>
										Select All
									</Button>
									<Button
										size="sm"
										variant="outline"
										onclick={deselectAllFiles}
									>
										Deselect All
									</Button>
								</div>
							</div>
							<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{#each files as file}
									<button
										onclick={() => toggleFileSelection(file.id)}
										class="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
										class:bg-blue-50={selectedFileIds.includes(file.id)}
										class:border-blue-500={selectedFileIds.includes(file.id)}
									>
										<FileIcon class="h-5 w-5 text-red-500" />
										<span class="flex-1 truncate">{file.name}</span>
										{#if selectedFileIds.includes(file.id)}
											<CheckCircle2 class="h-5 w-5 text-blue-500" />
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<!-- Bank Statement Selection -->
						<div class="mt-6 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
							<h3 class="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Bank Statement (Optional)</h3>
							<p class="mb-3 text-xs text-blue-700 dark:text-blue-300">
								Select a bank statement PDF (v.pnf) to automatically extract payment dates
							</p>
							<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{#each files as file}
									<button
										onclick={() => bankStatementFileId = bankStatementFileId === file.id ? null : file.id}
										class="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-3 text-left hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
										class:bg-green-100={bankStatementFileId === file.id}
										class:border-green-500={bankStatementFileId === file.id}
										class:dark:bg-green-900={bankStatementFileId === file.id}
									>
										<FileIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
										<span class="flex-1 truncate text-sm">{file.name}</span>
										{#if bankStatementFileId === file.id}
											<CheckCircle2 class="h-5 w-5 text-green-600 dark:text-green-400" />
										{/if}
									</button>
								{/each}
							</div>
							{#if bankStatementFileId}
								<p class="mt-2 text-xs font-medium text-green-700 dark:text-green-300">
									✓ Bank statement selected - payment dates will be extracted and matched to invoices
								</p>
							{/if}
						</div>

						<div class="mt-6 flex justify-end">
							<Button
								onclick={processInvoices}
								disabled={selectedCount === 0}
								size="lg"
							>
								Process {selectedCount} Invoice{selectedCount !== 1 ? 's' : ''}
							</Button>
						</div>
					{:else if folders.length === 0}
						<p class="py-12 text-center text-muted-foreground">
							No folders or PDF files found in this location
						</p>
					{/if}
				{/if}
			</CardContent>
		</Card>
	{:else if currentStep === 'processing'}
		<Card>
			<CardHeader>
				<CardTitle>Processing Invoices</CardTitle>
				<CardDescription>
					Extracting data from {processingProgress.total} PDF{processingProgress.total !== 1
						? 's'
						: ''}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">
							Progress: {processingProgress.current} / {processingProgress.total}
						</span>
						<span class="text-sm text-muted-foreground">
							{Math.round((processingProgress.current / processingProgress.total) * 100)}%
						</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full bg-blue-500 transition-all duration-300"
							style="width: {(processingProgress.current / processingProgress.total) * 100}%"
						></div>
					</div>

					{#if processedInvoices.length > 0}
						<div class="mt-4 space-y-2">
							<h4 class="text-sm font-semibold">Processed:</h4>
							{#each processedInvoices as invoice}
								<div class="flex items-center gap-2 text-sm">
									{#if invoice.error}
										<XCircle class="h-4 w-4 text-red-500" />
										<span class="text-red-600">{invoice.fileName} - {invoice.error}</span>
									{:else}
										<CheckCircle2 class="h-4 w-4 text-green-500" />
										<span>{invoice.fileName}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	{:else if currentStep === 'complete'}
		<Card>
			<CardHeader>
				<CardTitle>Processing Complete!</CardTitle>
				<CardDescription>
					Successfully processed {processedInvoices.length} invoice{processedInvoices.length !==
					1
						? 's'
						: ''}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Spreadsheet Link -->
				{#if spreadsheetUrl}
					<div class="rounded-lg bg-green-50 p-4">
						<h3 class="mb-2 font-semibold text-green-900">Spreadsheet Created</h3>
						<a
							href={spreadsheetUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-2 text-blue-600 hover:underline"
						>
							Open in Google Sheets
							<ExternalLink class="h-4 w-4" />
						</a>
					</div>
				{/if}

				<!-- Summary -->
				<div>
					<h3 class="mb-2 font-semibold">Summary</h3>
					<div class="space-y-2 text-sm">
						{#each processedInvoices as invoice}
							<div class="rounded border p-3">
								<div class="mb-1 font-medium">{invoice.fileName}</div>
								{#if invoice.error}
									<p class="text-red-600">Error: {invoice.error}</p>
								{:else}
									<div class="grid gap-1 text-muted-foreground">
										{#if invoice.vendor_name}
											<div>Vendor: {invoice.vendor_name}</div>
										{/if}
										{#if invoice.invoice_number}
											<div>Invoice #: {invoice.invoice_number}</div>
										{/if}
										{#if invoice.total_amount}
											<div>Amount: €{invoice.total_amount}</div>
										{/if}
										{#if invoice.invoice_date}
											<div>Date: {invoice.invoice_date}</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="flex justify-end">
					<Button onclick={reset}>Process More Invoices</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
