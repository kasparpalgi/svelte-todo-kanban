<!-- @file src/lib/components/notes/NoteEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import NoteImageManager from '$lib/components/notes/NoteImageManager.svelte';
	import { notesStore } from '$lib/stores/notes.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { t } from '$lib/i18n';
	import type { Editor } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	type NoteUpload = {
		id: string;
		url: string;
		created_at: string;
	};

	type Note = {
		id: string;
		title: string;
		content: string | null;
		cover_image_url: string | null;
		note_uploads?: NoteUpload[];
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
	let editorContent: string = $state('');
	let editorInitialized: boolean = false;
	let imageManager: any = $state(null);
	let showImageSection: boolean = $state(false);

	console.log('[NoteEditor] Component initialized');

	// Update when note changes
	$effect(() => {
		console.log('[NoteEditor] Note effect running, note:', note?.id, 'currentNoteId:', currentNoteId);

		if (!note) {
			console.log('[NoteEditor] No note, resetting');
			currentNoteId = null;
			title = '';
			editorContent = '';
			editorInitialized = false; // Reset when no note
			// Clear editor content if we have an editor
			if (editorStore) {
				const editor = get(editorStore);
				if (editor) {
					console.log('[NoteEditor] Clearing editor content');
					isSettingContent = true;
					editor.commands.setContent('');
					setTimeout(() => { isSettingContent = false; }, 50);
				}
			}
			return;
		}

		// Only update if it's actually a different note
		if (currentNoteId !== note.id) {
			console.log('[NoteEditor] New note selected, id:', note.id);
			currentNoteId = note.id;
			title = note.title;
			hasUnsavedChanges = false;
			editorInitialized = false; // Reset when switching notes

			// Update content via reactive variable AND set it in the editor
			editorContent = note.content || '';
			console.log('[NoteEditor] Set editorContent, length:', editorContent.length);

			// Set content in editor if editor is ready - use get() to avoid subscription loop
			if (editorStore) {
				const editor = get(editorStore);
				if (editor) {
					const currentContent = editor.getHTML();
					console.log('[NoteEditor] Current editor content length:', currentContent.length, 'New length:', editorContent.length);

					if (currentContent !== editorContent) {
						console.log('[NoteEditor] Updating editor content');
						isSettingContent = true;
						editor.commands.setContent(editorContent);
						setTimeout(() => {
							isSettingContent = false;
							console.log('[NoteEditor] Content update complete');
						}, 50);
					} else {
						console.log('[NoteEditor] Content unchanged, skipping update');
					}
				} else {
					console.log('[NoteEditor] Editor not ready yet, content will be set when editor initializes');
				}
			} else {
				console.log('[NoteEditor] No editorStore yet, content will be set when editor initializes');
			}
		} else {
			console.log('[NoteEditor] Same note (just updated from store) - NOT resetting editor');
		}
	});

	// Watch for editor store changes
	$effect(() => {
		console.log('[NoteEditor] EditorStore effect running, editorStore:', !!editorStore, 'initialized:', editorInitialized);

		if (!editorStore) {
			console.log('[NoteEditor] No editorStore yet');
			editorInitialized = false;
			return;
		}

		// Clean up previous subscription if any
		if (editorUnsubscribe) {
			console.log('[NoteEditor] Cleaning up previous subscription');
			editorUnsubscribe();
			editorUnsubscribe = null;
		}

		// Subscribe to editor store ONLY to set up event listeners
		console.log('[NoteEditor] Creating new editor subscription');
		editorUnsubscribe = editorStore.subscribe((editor) => {
			console.log('[NoteEditor] Subscription callback fired, editor:', !!editor, 'initialized:', editorInitialized);

			if (!editor) {
				console.log('[NoteEditor] Editor not ready');
				return;
			}

			// ONLY set up listeners and initial content on FIRST initialization
			if (!editorInitialized) {
				console.log('[NoteEditor] First initialization - setting up listeners and initial content');
				editorInitialized = true;

				// Remove any existing listeners first
				editor.off('update');

				// Add update listener for user edits
				editor.on('update', () => {
					console.log('[NoteEditor] Editor update event, isSettingContent:', isSettingContent);
					if (isSettingContent) {
						console.log('[NoteEditor] Ignoring update - programmatic');
						return;
					}
					console.log('[NoteEditor] User edit detected');
					handleContentChange();
				});

				// Set initial content if we have a note and editorContent
				if (note && editorContent && currentNoteId === note.id) {
					const currentContent = editor.getHTML();
					console.log('[NoteEditor] Initial content check - current:', currentContent.length, 'expected:', editorContent.length);

					if (currentContent !== editorContent) {
						console.log('[NoteEditor] Setting initial content in newly ready editor');
						isSettingContent = true;
						editor.commands.setContent(editorContent);
						setTimeout(() => {
							isSettingContent = false;
							console.log('[NoteEditor] Initial content set');
						}, 50);
					}
				}
			} else {
				console.log('[NoteEditor] Already initialized, skipping setup');
			}
		});

		return () => {
			console.log('[NoteEditor] EditorStore effect cleanup');
			if (editorUnsubscribe) {
				editorUnsubscribe();
				editorUnsubscribe = null;
			}
			// DON'T reset editorInitialized here - it's managed by note changes
		};
	});

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
			console.log('[NoteEditor] Auto-save timeout fired');
			saveChanges();
		}, 1000);
	}

	async function saveChanges() {
		console.log('[NoteEditor] saveChanges called, hasChanges:', hasUnsavedChanges, 'note:', !!note, 'editorStore:', !!editorStore);
		if (!hasUnsavedChanges || !editorStore || !note) {
			console.log('[NoteEditor] Skipping save');
			return;
		}

		// Get current editor content without subscribing
		const editor = get(editorStore);
		const content = editor ? editor.getHTML() : '';

		const updates: { title?: string; content?: string } = {};

		if (title !== note.title) {
			updates.title = title;
		}

		if (content !== note.content) {
			updates.content = content;
		}

		if (Object.keys(updates).length > 0) {
			console.log('[NoteEditor] Saving updates:', updates);
			await onUpdate(updates);
			hasUnsavedChanges = false;
		}

		// Handle new image uploads
		await handleImageUploads();
	}

	async function handleImageUploads() {
		if (!imageManager || !note) return;

		const newImages = imageManager.getNewImages();
		if (newImages.length === 0) return;

		try {
			const uploadPromises = newImages.map(async (img: any) => {
				const formData = new FormData();
				formData.append('file', img.file!);
				const response = await fetch('/api/upload', { method: 'POST', body: formData });
				const uploadResult = await response.json();
				if (uploadResult.success) {
					return await notesStore.createNoteUpload(note.id, uploadResult.url);
				}
			});

			await Promise.all(uploadPromises);
			displayMessage($t('notes.images_uploaded') || 'Images uploaded successfully');
		} catch (error) {
			console.error('[NoteEditor] Error uploading images:', error);
			displayMessage($t('notes.upload_error') || 'Error uploading images', 'error');
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

	onDestroy(() => {
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
		<!-- Header with Cover Image -->
		<div class="border-b">
			{#if note.cover_image_url}
				<div class="h-32 w-full overflow-hidden">
					<img
						src={note.cover_image_url}
						alt={$t('notes.cover_image') || 'Cover Image'}
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}
			<div class="p-4">
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
							<span class="ml-2 text-amber-600">•</span>
						{:else if saving}
							<span class="ml-2 text-blue-600">•</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<Button size="sm" variant="ghost" onclick={onDelete}>
							<Trash2 class="h-4 w-4 text-destructive" />
						</Button>
					</div>
				</div>
			</div>
		</div>

		<!-- Editor -->
		<div class="flex-1 overflow-y-auto p-4">
			<RichTextEditor
				content={editorContent}
				bind:editor={editorStore}
				showToolbar={true}
			/>

			<!-- Image Manager -->
			<div class="mt-6 border-t pt-6">
				<NoteImageManager
					bind:this={imageManager}
					noteId={note.id}
					coverImageUrl={note.cover_image_url}
					initialImages={note.note_uploads?.map((upload) => ({
						id: upload.id,
						file: null,
						preview: upload.url,
						isExisting: true
					})) || []}
				/>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{$t('notes.selectNote')}</p>
	</div>
{/if}
