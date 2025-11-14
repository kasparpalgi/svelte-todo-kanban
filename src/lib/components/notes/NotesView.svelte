<!-- @file src/lib/components/notes/NotesView.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n';
	import { notesStore } from '$lib/stores/notes.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import NotesList from './NotesList.svelte';
	import NoteEditor from './NoteEditor.svelte';

	let { open = $bindable(), boardId }: { open: boolean; boardId: string } = $props();

	let selectedNoteId: string | null = $state(null);
	let saving: boolean = $state(false);

	console.log('[NotesView] Component created, boardId:', boardId);

	const selectedNote = $derived(
		notesStore.sortedNotes.find((n) => n.id === selectedNoteId) || null
	);

	$effect(() => {
		console.log('[NotesView] open changed:', open);
	});

	$effect(() => {
		console.log('[NotesView] selectedNoteId changed:', selectedNoteId);
	});

	onMount(async () => {
		console.log('[NotesView] onMount, loading notes for boardId:', boardId);

		if (boardId) {
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
		console.log('[NotesView] handleCreateNote called');
		const result = await notesStore.createNote(boardId);
		console.log('[NotesView] createNote result:', result);

		if (result.success && result.data) {
			selectedNoteId = result.data.id;
			console.log('[NotesView] New note created and selected:', selectedNoteId);
			displayMessage($t('notes.created'), 1500, true);
		} else {
			displayMessage(result.message, 3000, false);
		}
	}

	async function handleUpdateNote(updates: { title?: string; content?: string }) {
		console.log('[NotesView] handleUpdateNote called, selectedNoteId:', selectedNoteId, 'updates:', updates);

		if (!selectedNoteId) return;

		saving = true;
		const result = await notesStore.updateNote(selectedNoteId, updates);
		saving = false;

		console.log('[NotesView] updateNote result:', result);

		if (!result.success) {
			displayMessage(result.message, 3000, false);
		}
	}

	async function handleDeleteNote() {
		console.log('[NotesView] handleDeleteNote called, selectedNoteId:', selectedNoteId);

		if (!selectedNoteId) return;

		const confirmed = confirm($t('notes.deleteConfirm'));
		if (!confirmed) {
			console.log('[NotesView] Delete cancelled by user');
			return;
		}

		const result = await notesStore.deleteNote(selectedNoteId);
		console.log('[NotesView] deleteNote result:', result);

		if (result.success) {
			// Select another note or clear selection
			const remainingNotes = notesStore.sortedNotes.filter((n) => n.id !== selectedNoteId);
			selectedNoteId = remainingNotes.length > 0 ? remainingNotes[0].id : null;
			console.log('[NotesView] Note deleted, new selectedNoteId:', selectedNoteId);

			displayMessage($t('notes.deleted'), 1500, true);
		} else {
			displayMessage(result.message, 3000, false);
		}
	}

	function handleNoteSelect(id: string) {
		console.log('[NotesView] handleNoteSelect called, id:', id);
		selectedNoteId = id;
	}

	function handleOpenChange(newOpen: boolean) {
		console.log('[NotesView] handleOpenChange called, newOpen:', newOpen);
		open = newOpen;

		// Reset selection when closing
		if (!newOpen) {
			selectedNoteId = null;
			console.log('[NotesView] Dialog closed, selection reset');
		}
	}
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
	<DialogContent class="flex h-[85vh] max-w-6xl flex-col p-0">
		<DialogHeader class="border-b px-6 py-4">
			<div class="flex items-center justify-between">
				<DialogTitle>{$t('notes.title')}</DialogTitle>
				<Button variant="ghost" size="sm" onclick={() => (open = false)}>
					<X class="h-4 w-4" />
				</Button>
			</div>
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
