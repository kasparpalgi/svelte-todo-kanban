<!-- @file src/lib/components/notes/NotesView.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';
	import { notesStore } from '$lib/stores/notes.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import NotesList from './NotesList.svelte';
	import NoteEditor from './NoteEditor.svelte';

	let { open = $bindable(), boardId }: { open: boolean; boardId: string } = $props();

	let selectedNoteId: string | null = $state(null);
	let saving: boolean = $state(false);

	const selectedNote = $derived.by(() => {
		const found = notesStore.sortedNotes.find((n) => n.id === selectedNoteId) || null;
		return found;
	});

	onMount(async () => {
		if (boardId) {
			await notesStore.loadNotes(boardId);

			// Select first note if available
			if (notesStore.sortedNotes.length > 0 && !selectedNoteId) {
				selectedNoteId = notesStore.sortedNotes[0].id;
			}
		}
	});

	async function handleCreateNote() {
		const result = await notesStore.createNote(boardId);

		if (result.success && result.data) {
			selectedNoteId = result.data.id;
			displayMessage($t('notes.created'), 1500, true);
		} else {
			displayMessage(result.message, 3000, false);
		}
	}

	async function handleUpdateNote(updates: { title?: string; content?: string }) {
		if (!selectedNoteId) return;

		saving = true;
		const result = await notesStore.updateNote(selectedNoteId, updates);
		saving = false;

		if (!result.success) {
			displayMessage(result.message, 3000, false);
		}
	}

	async function handleDeleteNote() {
		if (!selectedNoteId) return;

		const confirmed = confirm($t('notes.deleteConfirm'));
		if (!confirmed) {
			return;
		}

		const deletedId = selectedNoteId;

		// Clear selection first to allow editor cleanup
		selectedNoteId = null;

		const result = await notesStore.deleteNote(deletedId);

		if (result.success) {
			// Wait a tick for editor cleanup, then select another note
			await new Promise(resolve => setTimeout(resolve, 50));

			const remainingNotes = notesStore.sortedNotes;
			if (remainingNotes.length > 0) {
				selectedNoteId = remainingNotes[0].id;
			}

			displayMessage($t('notes.deleted'), 1500, true);
		} else {
			// Restore selection if delete failed
			selectedNoteId = deletedId;
			displayMessage(result.message, 3000, false);
		}
	}

	function handleNoteSelect(id: string) {
		selectedNoteId = id;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;

		// Reset selection when closing
		if (!newOpen) {
			selectedNoteId = null;
		}
	}
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
	<DialogContent class="!max-w-[96vw] flex h-[85vh] w-[96vw] flex-col p-0">
		<DialogHeader class="border-b px-6 py-4">
			<DialogTitle>{$t('notes.title')}</DialogTitle>
		</DialogHeader>

		<div class="flex flex-1 overflow-hidden">
			<!-- Left Sidebar: Notes List -->
			<div class="w-80 flex-shrink-0">
				<NotesList
					notes={notesStore.sortedNotes}
					{selectedNoteId}
					onNoteSelect={handleNoteSelect}
					onCreateNote={handleCreateNote}
				/>
			</div>

			<!-- Right Panel: Note Editor -->
			<div class="flex-1 overflow-hidden">
				{#key selectedNoteId}
					<NoteEditor
						note={selectedNote}
						onUpdate={handleUpdateNote}
						onDelete={handleDeleteNote}
						{saving}
					/>
				{/key}
			</div>
		</div>
	</DialogContent>
</Dialog>
