<!-- @file src/lib/components/github/ImportIssuesDialog.svelte -->
<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { GithubIcon, Loader2 } from 'lucide-svelte';
	import type { ListFieldsFragment } from '$lib/graphql/generated/graphql';

	let {
		open = $bindable(false),
		boardId,
		boardName,
		lists = [],
		onImportComplete
	}: {
		open: boolean;
		boardId: string;
		boardName: string;
		lists: ListFieldsFragment[];
		onImportComplete?: () => void;
	} = $props();

	let selectedListId = $state(lists[0]?.id || '');
	let importing = $state(false);

	async function importIssues() {
		if (!selectedListId) {
			displayMessage('Please select a list');
			return;
		}

		importing = true;

		try {
			const response = await fetch('/api/github/import-issues', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					boardId,
					targetListId: selectedListId
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || result.error || 'Import failed');
			}

			loggingStore.info('GithubImport', 'Successfully imported issues', {
				boardId,
				listId: selectedListId,
				imported: result.imported,
				total: result.total
			});

			if (result.imported === 0) {
				displayMessage(result.message || 'No issues to import', 3000);
			} else {
				displayMessage(
					`Successfully imported ${result.imported} of ${result.total} issues`,
					3000,
					true
				);
			}

			open = false;

			// Call callback to reload data
			if (onImportComplete) {
				onImportComplete();
			}
		} catch (err: any) {
			loggingStore.error('GithubImport', 'Failed to import issues', {
				error: err.message,
				boardId
			});

			displayMessage(err.message || 'Failed to import issues');
		} finally {
			importing = false;
		}
	}

	// Update selected list when lists change
	$effect(() => {
		if (lists.length > 0 && !selectedListId) {
			selectedListId = lists[0].id;
		}
	});
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<GithubIcon class="h-5 w-5" />
				Import GitHub Issues
			</DialogTitle>
		</DialogHeader>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="board-name" class="text-sm font-medium">
					Board
				</Label>
				<div class="rounded-md border bg-muted/30 px-3 py-2 text-sm">
					{boardName}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="target-list" class="text-sm font-medium">
					Import issues into list
				</Label>
				<select
					id="target-list"
					bind:value={selectedListId}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					{#each lists as list (list.id)}
						<option value={list.id}>{list.name}</option>
					{/each}
				</select>
			</div>

			<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
				<p class="text-sm text-blue-900 dark:text-blue-100">
					This will import all open issues from the connected GitHub repository.
					Issues that have already been imported will be skipped.
				</p>
			</div>
		</div>

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (open = false)} disabled={importing}>
				Cancel
			</Button>
			<Button onclick={importIssues} disabled={importing || !selectedListId} class="gap-2">
				{#if importing}
					<Loader2 class="h-4 w-4 animate-spin" />
					Importing...
				{:else}
					<GithubIcon class="h-4 w-4" />
					Import Issues
				{/if}
			</Button>
		</div>
	</DialogContent>
</Dialog>
