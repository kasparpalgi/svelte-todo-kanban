<!-- @file src/lib/components/notes/NoteEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Trash2, Save } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import { t } from '$lib/i18n';
	import type { Editor } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	type Note = {
		id: string;
		title: string;
		content: string | null;
		updated_at: string;
		created_at: string;
	};

	let {
		note,
		onUpdate,
		onDelete,
		saving = false
	}: {
		note: Note | null;
		onUpdate: (updates: { title?: string; content?: string }) => Promise<void>;
		onDelete: () => Promise<void>;
		saving?: boolean;
	} = $props();

	let title: string = $state('');
	let editorStore: Readable<Editor> | null = $state(null);
	let hasUnsavedChanges: boolean = $state(false);
	let autoSaveTimeout: NodeJS.Timeout | null = null;
	let isSettingContent: boolean = false;
	let currentNoteId: string | null = null;
	let editorUnsubscribe: (() => void) | null = null;

	console.log('[NoteEditor] Component created');

	// Update when note changes
	$effect(() => {
		console.log('[NoteEditor] Note changed:', note?.id);

		if (!note) {
			console.log('[NoteEditor] No note');
			currentNoteId = null;
			title = '';
			return;
		}

		// Only update if it's actually a different note
		if (currentNoteId !== note.id) {
			console.log('[NoteEditor] New note selected:', note.id);
			currentNoteId = note.id;
			title = note.title;
			hasUnsavedChanges = false;

			// Update editor content
			updateEditorContent(note.content || '');
		}
	});

	// Watch for editor store changes
	$effect(() => {
		console.log('[NoteEditor] EditorStore changed:', !!editorStore);

		if (!editorStore) return;

		// Clean up previous subscription if any
		if (editorUnsubscribe) {
			editorUnsubscribe();
			editorUnsubscribe = null;
		}

		// Subscribe to editor store
		editorUnsubscribe = editorStore.subscribe((editor) => {
			if (!editor) {
				console.log('[NoteEditor] Editor not ready yet');
				return;
			}

			console.log('[NoteEditor] Editor ready, setting up update listener');

			// Remove any existing listeners first
			editor.off('update');

			// Add update listener
			editor.on('update', () => {
				if (isSettingContent) {
					console.log('[NoteEditor] Ignoring update - programmatic change');
					return;
				}
				console.log('[NoteEditor] User edited content');
				handleContentChange();
			});

			// Set initial content if we have a note
			if (note && currentNoteId === note.id) {
				updateEditorContent(note.content || '');
			}
		});

		return () => {
			console.log('[NoteEditor] Cleaning up editor subscription');
			if (editorUnsubscribe) {
				editorUnsubscribe();
				editorUnsubscribe = null;
			}
		};
	});

	function updateEditorContent(content: string) {
		console.log('[NoteEditor] updateEditorContent called, length:', content.length);

		if (!editorStore) {
			console.log('[NoteEditor] No editor store');
			return;
		}

		const unsub = editorStore.subscribe((editor) => {
			if (!editor) return;

			const currentContent = editor.getHTML();
			console.log('[NoteEditor] Current:', currentContent.length, 'New:', content.length);

			if (currentContent !== content) {
				console.log('[NoteEditor] Setting editor content');
				isSettingContent = true;
				editor.commands.setContent(content);
				setTimeout(() => {
					isSettingContent = false;
					console.log('[NoteEditor] Content setting complete');
				}, 50);
			}
		});
		unsub();
	}

	function handleTitleChange() {
		console.log('[NoteEditor] Title changed');
		hasUnsavedChanges = true;
		scheduleAutoSave();
	}

	function handleContentChange() {
		console.log('[NoteEditor] Content changed');
		hasUnsavedChanges = true;
		scheduleAutoSave();
	}

	function scheduleAutoSave() {
		console.log('[NoteEditor] Scheduling auto-save');

		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		autoSaveTimeout = setTimeout(() => {
			console.log('[NoteEditor] Auto-save triggered');
			saveChanges();
		}, 1000);
	}

	async function saveChanges() {
		console.log('[NoteEditor] saveChanges, hasChanges:', hasUnsavedChanges, 'note:', !!note);

		if (!hasUnsavedChanges || !editorStore || !note) {
			console.log('[NoteEditor] Skipping save');
			return;
		}

		let content = '';
		const unsub = editorStore.subscribe((editor) => {
			if (editor) {
				content = editor.getHTML();
			}
		});
		unsub();

		const updates: { title?: string; content?: string } = {};

		if (title !== note.title) {
			updates.title = title;
			console.log('[NoteEditor] Title updated');
		}

		if (content !== note.content) {
			updates.content = content;
			console.log('[NoteEditor] Content updated, length:', content.length);
		}

		if (Object.keys(updates).length > 0) {
			console.log('[NoteEditor] Saving updates');
			await onUpdate(updates);
			hasUnsavedChanges = false;
			console.log('[NoteEditor] Save complete');
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	onMount(() => {
		console.log('[NoteEditor] onMount');
	});

	onDestroy(() => {
		console.log('[NoteEditor] onDestroy');
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}
		if (editorUnsubscribe) {
			editorUnsubscribe();
		}
	});
</script>

{#if note}
	<div class="flex h-full flex-col">
		<!-- Header -->
		<div class="border-b p-4">
			<Input
				type="text"
				bind:value={title}
				oninput={handleTitleChange}
				placeholder={$t('notes.untitled')}
				class="mb-2 text-xl font-semibold"
			/>
			<div class="flex items-center justify-between">
				<div class="text-xs text-muted-foreground">
					<span>Updated {formatDate(note.updated_at)}</span>
					{#if hasUnsavedChanges}
						<span class="ml-2 text-amber-600">• Unsaved changes</span>
					{:else if saving}
						<span class="ml-2 text-blue-600">• Saving...</span>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if hasUnsavedChanges}
						<Button size="sm" variant="ghost" onclick={saveChanges} disabled={saving}>
							<Save class="mr-2 h-4 w-4" />
							Save
						</Button>
					{/if}
					<Button size="sm" variant="ghost" onclick={onDelete}>
						<Trash2 class="h-4 w-4 text-destructive" />
					</Button>
				</div>
			</div>
		</div>

		<!-- Editor -->
		<div class="flex-1 overflow-y-auto p-4">
			<RichTextEditor
				content={note.content || ''}
				bind:editor={editorStore}
				showToolbar={true}
			/>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{$t('notes.selectNote')}</p>
	</div>
{/if}
