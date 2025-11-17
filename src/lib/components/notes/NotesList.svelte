<!-- @file src/lib/components/notes/NotesList.svelte -->
<script lang="ts">
	import { Plus, Search } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import { notesStore } from '$lib/stores/notes.svelte';
	import NoteItem from './NoteItem.svelte';

	interface Note {
		id: string;
		title: string;
		content: string | null;
		cover_image_url: string | null;
		updated_at: string;
		parent_id?: string | null;
		sort_order: number;
		subnotes?: Note[];
	}

	interface Props {
		notes: Note[];
		selectedNoteId: string | null;
		onNoteSelect: (id: string) => void;
		onCreateNote: () => void;
		onCreateSubnote: (parentId: string) => void;
	}

	let { notes, selectedNoteId, onNoteSelect, onCreateNote, onCreateSubnote }: Props = $props();

	let searchQuery: string = $state('');
	let draggedNote = $state<Note | null>(null);
	let dropTarget = $state<{
		noteId: string;
		position: 'above' | 'below' | 'inside';
		parentId: string | null;
	} | null>(null);

	// Filter to show only top-level notes (no parent_id)
	const topLevelNotes = $derived(notes.filter((note) => !note.parent_id));

	const filteredNotes = $derived(
		topLevelNotes.filter(
			(note) =>
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function renderSubnotes(parentNote: Note, depth: number = 1): Note[] {
		if (!parentNote.subnotes || parentNote.subnotes.length === 0) {
			return [];
		}

		const isExpanded = notesStore.isNoteExpanded(parentNote.id);
		if (!isExpanded) {
			return [];
		}

		return parentNote.subnotes;
	}

	function handleDragStart(note: Note) {
		draggedNote = note;
		dropTarget = null;
	}

	async function handleDragEnd() {
		if (!draggedNote || !dropTarget) {
			draggedNote = null;
			dropTarget = null;
			return;
		}

		const { noteId: targetNoteId, position, parentId } = dropTarget;

		// Don't do anything if dropping on itself
		if (targetNoteId === draggedNote.id) {
			draggedNote = null;
			dropTarget = null;
			return;
		}

		// Determine new parent and siblings for sort order calculation
		let newParentId: string | null = null;
		let siblings: Note[] = [];

		if (position === 'inside') {
			// Dropping inside a note makes it a subnote
			newParentId = targetNoteId;
			const targetNote = findNote(notes, targetNoteId);
			siblings = targetNote?.subnotes || [];
		} else {
			// Dropping above/below means same parent as target
			newParentId = parentId;
			if (parentId) {
				const parentNote = findNote(notes, parentId);
				siblings = parentNote?.subnotes || [];
			} else {
				siblings = topLevelNotes;
			}
		}

		// Calculate new sort order
		const targetNote = findNote(notes, targetNoteId);
		if (!targetNote) {
			draggedNote = null;
			dropTarget = null;
			return;
		}

		let newSortOrder = 0;

		if (position === 'inside') {
			// Add to end of subnotes
			newSortOrder = siblings.length > 0 ? Math.max(...siblings.map((n) => n.sort_order)) + 1 : 0;
		} else {
			const targetIndex = siblings.findIndex((n) => n.id === targetNoteId);
			if (targetIndex === -1) {
				draggedNote = null;
				dropTarget = null;
				return;
			}

			// Remove dragged note from siblings if it's there
			const filteredSiblings = siblings.filter((n) => n.id !== draggedNote!.id);
			const adjustedIndex =
				position === 'above' ? targetIndex : Math.min(targetIndex + 1, filteredSiblings.length);

			// Recalculate sort orders
			const reorderedIds = [
				...filteredSiblings.slice(0, adjustedIndex).map((n) => n.id),
				draggedNote.id,
				...filteredSiblings.slice(adjustedIndex).map((n) => n.id)
			];

			// Update all siblings with new sort order
			const updates = reorderedIds.map((id, index) => ({ id, sort_order: index }));

			// If parent changed, update parent first
			if (draggedNote.parent_id !== newParentId) {
				await notesStore.updateNoteParent(draggedNote.id, newParentId, adjustedIndex);
			} else {
				// Just reorder within same parent
				await notesStore.reorderNotes(reorderedIds);
			}

			draggedNote = null;
			dropTarget = null;
			return;
		}

		// Update parent if it changed
		if (draggedNote.parent_id !== newParentId) {
			await notesStore.updateNoteParent(draggedNote.id, newParentId, newSortOrder);
		}

		draggedNote = null;
		dropTarget = null;
	}

	function updateDropTarget(clientX: number, clientY: number) {
		if (!draggedNote) return;

		const elements = document.elementsFromPoint(clientX, clientY);
		let foundTarget = false;

		for (const el of elements) {
			const noteEl = el.closest('[data-note-id]');
			if (!noteEl) continue;

			const noteId = noteEl.getAttribute('data-note-id');
			if (!noteId || noteId === draggedNote.id) continue;

			const parentId = noteEl.getAttribute('data-parent-id') || null;
			const rect = noteEl.getBoundingClientRect();
			const mouseY = clientY;

			// Find the target note to check if it has expanded children
			const targetNote = findNote(notes, noteId);
			const hasExpandedChildren = targetNote &&
				targetNote.subnotes &&
				targetNote.subnotes.length > 0 &&
				notesStore.isNoteExpanded(noteId);

			// Determine drop zone: top 25% = above, bottom 25% = below, middle 50% = inside
			const relativeY = mouseY - rect.top;
			const percentY = relativeY / rect.height;

			let position: 'above' | 'below' | 'inside';
			if (percentY < 0.25) {
				position = 'above';
			} else if (percentY > 0.75) {
				// If this note has expanded children, treat "below" as "inside" to make it easier
				// to drop as first child
				position = hasExpandedChildren ? 'inside' : 'below';
			} else {
				position = 'inside';
			}

			dropTarget = { noteId, position, parentId };
			foundTarget = true;
			break;
		}

		if (!foundTarget) {
			dropTarget = null;
		}
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (draggedNote) {
			updateDropTarget(e.clientX, e.clientY);
		}
	}

	function handleGlobalTouchMove(e: TouchEvent) {
		if (!draggedNote || e.touches.length === 0) return;
		const touch = e.touches[0];
		updateDropTarget(touch.clientX, touch.clientY);
	}

	function findNote(notesList: Note[], id: string): Note | null {
		for (const note of notesList) {
			if (note.id === id) return note;
			if (note.subnotes) {
				const found = findNote(note.subnotes, id);
				if (found) return found;
			}
		}
		return null;
	}

	function getDropIndicator(note: Note, parentId: string | null = null): 'above' | 'below' | 'inside' | null {
		if (!dropTarget || dropTarget.noteId !== note.id) return null;
		return dropTarget.position;
	}
</script>

<svelte:window onmousemove={handleGlobalMouseMove} ontouchmove={handleGlobalTouchMove} />

<div class="flex h-full flex-col border-r bg-background">
	<!-- Header -->
	<div class="border-b p-4">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{$t('notes.title')}</h2>
			<Button size="sm" onclick={onCreateNote}>
				<Plus class="h-4 w-4" />
			</Button>
		</div>
		<div class="relative">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder={$t('notes.searchPlaceholder')}
				bind:value={searchQuery}
				class="pl-8"
			/>
		</div>
	</div>

	<!-- Notes List -->
	<div class="flex-1 overflow-y-auto p-2">
		{#if filteredNotes.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-sm text-muted-foreground">
					{searchQuery ? 'No notes found' : $t('notes.noNotes')}
				</p>
				{#if !searchQuery}
					<Button variant="ghost" size="sm" onclick={onCreateNote} class="mt-2">
						<Plus class="mr-2 h-4 w-4" />
						{$t('notes.newNote')}
					</Button>
				{/if}
			</div>
		{:else}
			<div class="space-y-1">
				{#each filteredNotes as note (note.id)}
					<div>
						<!-- Parent note -->
						<NoteItem
							{note}
							isSelected={selectedNoteId === note.id}
							isDragging={draggedNote?.id === note.id}
							dropIndicator={getDropIndicator(note, null)}
							onclick={() => onNoteSelect(note.id)}
							onAddSubnote={onCreateSubnote}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							parentId={null}
						/>

						<!-- Subnotes (indented) -->
						{#each renderSubnotes(note) as subnote (subnote.id)}
							<div class="ml-6">
								<NoteItem
									note={subnote}
									isSelected={selectedNoteId === subnote.id}
									isDragging={draggedNote?.id === subnote.id}
									dropIndicator={getDropIndicator(subnote, note.id)}
									onclick={() => onNoteSelect(subnote.id)}
									onAddSubnote={onCreateSubnote}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
									parentId={note.id}
								/>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
