<script lang="ts">
	/** @file src/lib/components/expenses/ImportSplitwiseDialog.svelte */
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Upload, FileText, AlertCircle } from 'lucide-svelte';
	import { expensesStore } from '$lib/stores/expenses.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import UserMappingDialog from './UserMappingDialog.svelte';
	import {
		parseSplitwiseCsv,
		isSimpleTwoUserCase,
		identifyCurrentUserInSimpleCase
	} from '$lib/utils/splitwiseCsvParser';
	import type { ParsedCsvData } from '$lib/utils/splitwiseCsvParser';
	import type { GetBoardMembersQuery } from '$lib/graphql/generated/graphql';

	type BoardMember = GetBoardMembersQuery['board_members'][number];

	interface Props {
		open: boolean;
		boardId: string;
		boardMembers: BoardMember[];
		currentUserId: string;
		onOpenChange: (open: boolean) => void;
	}

	let { open = $bindable(), boardId, boardMembers, currentUserId, onOpenChange }: Props = $props();

	let fileInput: HTMLInputElement | undefined;
	let selectedFile = $state<File | null>(null);
	let parsedData = $state<ParsedCsvData | null>(null);
	let error = $state<string | null>(null);
	let importing = $state(false);
	let userMappingOpen = $state(false);

	// Reset state when dialog opens/closes
	$effect(() => {
		if (open) {
			selectedFile = null;
			parsedData = null;
			error = null;
			importing = false;
		}
	});

	const fileName = $derived(selectedFile?.name || 'No file selected');
	const canImport = $derived(selectedFile !== null && parsedData !== null && !importing);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) {
			return;
		}

		selectedFile = file;
		error = null;
		parsedData = null;

		// Read and parse the file
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const data = parseSplitwiseCsv(text);
				parsedData = data;
				console.log('[ImportSplitwiseDialog] Parsed CSV:', {
					expenses: data.expenses.length,
					users: data.userNames
				});
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to parse CSV';
				console.error('[ImportSplitwiseDialog] Parse error:', err);
			}
		};
		reader.onerror = () => {
			error = 'Failed to read file';
		};
		reader.readAsText(file);
	}

	function handleImportClick() {
		if (!parsedData) return;

		// Check if it's a simple 2-user case
		if (isSimpleTwoUserCase(parsedData)) {
			// Automatically map users for 2-user case
			const currentUserIndex = identifyCurrentUserInSimpleCase(parsedData);
			const otherUserIndex = currentUserIndex === 0 ? 1 : 0;

			// The current user from CSV maps to the current board user
			// The other user from CSV maps to the other board member
			const otherBoardMember = boardMembers.find((m) => m.user_id !== currentUserId);

			if (!otherBoardMember) {
				displayMessage('Board must have at least 2 members');
				return;
			}

			const mapping = new Map<string, string>();
			mapping.set(parsedData.userNames[currentUserIndex], currentUserId);
			mapping.set(parsedData.userNames[otherUserIndex], otherBoardMember.user_id);

			console.log('[ImportSplitwiseDialog] Auto-mapping (2 users):', Array.from(mapping.entries()));
			performImport(mapping);
		} else {
			// Multiple users - show mapping dialog
			userMappingOpen = true;
		}
	}

	async function handleUserMappingConfirm(mapping: Map<string, string>) {
		console.log('[ImportSplitwiseDialog] Manual mapping:', Array.from(mapping.entries()));
		await performImport(mapping);
	}

	async function performImport(userMapping: Map<string, string>) {
		if (!parsedData || importing) return;

		importing = true;
		error = null;

		try {
			// Import expenses using the store method
			const result = await expensesStore.importFromSplitwise(
				boardId,
				parsedData,
				userMapping,
				currentUserId
			);

			if (result.success) {
				displayMessage(result.message, 2000, true);
				onOpenChange(false);
			} else {
				error = result.message;
				displayMessage(result.message);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Import failed';
			displayMessage('Import failed');
			console.error('[ImportSplitwiseDialog] Import error:', err);
		} finally {
			importing = false;
		}
	}

	function handleCancel() {
		onOpenChange(false);
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Import from Splitwise</DialogTitle>
			<DialogDescription>
				Upload a CSV file exported from Splitwise to import expenses into this board.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<!-- File Upload -->
			<div class="space-y-2">
				<Label for="csv-file">Select CSV File</Label>
				<div class="flex gap-2">
					<input
						id="csv-file"
						type="file"
						accept=".csv"
						bind:this={fileInput}
						onchange={handleFileSelect}
						disabled={importing}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
					/>
					<Button
						variant="outline"
						size="icon"
						onclick={() => fileInput?.click()}
						disabled={importing}
					>
						<Upload class="h-4 w-4" />
					</Button>
				</div>
				<p class="text-sm text-muted-foreground">
					<FileText class="inline h-3 w-3 mr-1" />
					{fileName}
				</p>
			</div>

			<!-- Parsed Data Summary -->
			{#if parsedData}
				<div class="rounded-lg border p-3 space-y-2 bg-muted/50">
					<p class="text-sm font-medium">CSV Summary:</p>
					<ul class="text-sm text-muted-foreground space-y-1">
						<li>✓ {parsedData.expenses.length} expenses found</li>
						<li>✓ {parsedData.userNames.length} users: {parsedData.userNames.join(', ')}</li>
					</ul>
				</div>
			{/if}

			<!-- Error Display -->
			{#if error}
				<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
					<div class="flex items-start gap-2">
						<AlertCircle class="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
						<div class="flex-1">
							<p class="text-sm font-medium text-destructive">Error</p>
							<p class="text-sm text-destructive/90">{error}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Instructions -->
			<div class="text-sm text-muted-foreground space-y-1">
				<p class="font-medium">CSV Format:</p>
				<ul class="list-disc list-inside space-y-0.5 ml-2">
					<li>First row: headers (Date, Description, Category, Cost, Currency, User1, User2, ...)</li>
					<li>Each row: expense with amounts per user</li>
					<li>Negative amounts = user owes, Positive = user is owed</li>
				</ul>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleCancel} disabled={importing}>
				Cancel
			</Button>
			<Button onclick={handleImportClick} disabled={!canImport}>
				{importing ? 'Importing...' : 'Import'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- User Mapping Dialog (for multi-user CSVs) -->
{#if parsedData}
	<UserMappingDialog
		bind:open={userMappingOpen}
		csvUserNames={parsedData.userNames}
		{boardMembers}
		onOpenChange={(open) => (userMappingOpen = open)}
		onConfirm={handleUserMappingConfirm}
	/>
{/if}
