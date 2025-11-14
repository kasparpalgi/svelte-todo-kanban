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

	console.log('[NotesView] Component initialized, boardId:', boardId);

	const selectedNote = $derived.by(() => {
		const found = notesStore.sortedNotes.find((n) => n.id === selectedNoteId) || null;
		console.log('[NotesView] selectedNote derived, id:', found?.id);
		return found;
	});

	onMount(async () => {
		console.log('[NotesView] onMount, boardId:', boardId);
		if (boardId) {
			console.log('[NotesView] Loading notes...');
			await notesStore.loadNotes(boardId);
			console.log('[NotesView] Notes loaded, count:', notesStore.sortedNotes.length);

			// Select first note if available
			if (notesStore.sortedNotes.length > 0 && !selectedNoteId) {
				selectedNoteId = notesStore.sortedNotes[0].id;
				console.log('[NotesView] Auto-selected first note:', selectedNoteId);
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

		const result = await notesStore.deleteNote(selectedNoteId);

		if (result.success) {
			// Select another note or clear selection
			const remainingNotes = notesStore.sortedNotes.filter((n) => n.id !== selectedNoteId);
			selectedNoteId = remainingNotes.length > 0 ? remainingNotes[0].id : null;

			displayMessage($t('notes.deleted'), 1500, true);
		} else {
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
	<DialogContent class="flex h-[85vh] w-[96vw] max-w-[96vw] flex-col p-0">
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
				<NoteEditor
					note={selectedNote}
					onUpdate={handleUpdateNote}
					onDelete={handleDeleteNote}
					{saving}
				/>
			</div>
		</div>
	</DialogContent>
</Dialog>
