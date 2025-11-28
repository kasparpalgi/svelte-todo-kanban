<!-- @file src/lib/components/notes/NoteEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { Trash2, ChevronLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import NoteImageManager from '$lib/components/notes/NoteImageManager.svelte';
	import VoiceInput from '$lib/components/todo/VoiceInput.svelte';
	import AITaskButton from '$lib/components/todo/AITaskButton.svelte';
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
		onBackToList,
		saving = false
	}: {
		note: Note | null;
		onUpdate: (updates: { title?: string; content?: string }) => Promise<void>;
		onDelete: () => Promise<void>;
		onBackToList?: () => void;
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
	let titleInputEl: any = $state(null);

	// Update when note changes
	$effect(() => {
		if (!note) {
			currentNoteId = null;
			title = '';
			editorContent = '';
			editorInitialized = false; // Reset when no note
			// Clear editor content if we have an editor
			if (editorStore) {
				const editor = get(editorStore);
				if (editor) {
					isSettingContent = true;
					editor.commands.setContent('');
					setTimeout(() => { isSettingContent = false; }, 50);
				}
			}
			return;
		}

		// Only update if it's actually a different note
		if (currentNoteId !== note.id) {
			currentNoteId = note.id;
			title = note.title;
			hasUnsavedChanges = false;
			editorInitialized = false; // Reset when switching notes

			// Update content via reactive variable AND set it in the editor
			editorContent = note.content || '';

			// Set content in editor if editor is ready - use get() to avoid subscription loop
			if (editorStore) {
				const editor = get(editorStore);
				if (editor) {
					const currentContent = editor.getHTML();

					if (currentContent !== editorContent) {
						isSettingContent = true;
						editor.commands.setContent(editorContent);
						setTimeout(() => {
							isSettingContent = false;
						}, 50);
					}
				}
			}
		}
	});

	// Watch for editor store changes
	$effect(() => {
		if (!editorStore) {
			editorInitialized = false;
			return;
		}

		// Clean up previous subscription if any
		if (editorUnsubscribe) {
			editorUnsubscribe();
			editorUnsubscribe = null;
		}

		// Subscribe to editor store ONLY to set up event listeners
		editorUnsubscribe = editorStore.subscribe((editor) => {
			if (!editor) {
				return;
			}

			// ONLY set up listeners and initial content on FIRST initialization
			if (!editorInitialized) {
				editorInitialized = true;

				// Remove any existing listeners first
				editor.off('update');

				// Add update listener for user edits
				editor.on('update', () => {
					if (isSettingContent) {
						return;
					}
					handleContentChange();
				});

				// Set initial content if we have a note and editorContent
				if (note && editorContent && currentNoteId === note.id) {
					const currentContent = editor.getHTML();

					if (currentContent !== editorContent) {
						isSettingContent = true;
						editor.commands.setContent(editorContent);
						setTimeout(() => {
							isSettingContent = false;
						}, 50);
					}
				}
			}
		});

		return () => {
			if (editorUnsubscribe) {
				editorUnsubscribe();
				editorUnsubscribe = null;
			}
			// DON'T reset editorInitialized here - it's managed by note changes
		};
	});

	function handleTitleChange() {
		hasUnsavedChanges = true;
		scheduleAutoSave();
	}

	function handleContentChange() {
		hasUnsavedChanges = true;
		scheduleAutoSave();
	}

	function scheduleAutoSave() {
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		autoSaveTimeout = setTimeout(() => {
			saveChanges();
		}, 1000);
	}

	async function saveChanges() {
		if (!hasUnsavedChanges || !editorStore || !note) {
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
			displayMessage($t('notes.images_uploaded') || 'Images uploaded successfully', undefined, true);
		} catch (error) {
			console.error('[NoteEditor] Error uploading images:', error);
			displayMessage($t('notes.upload_error') || 'Error uploading images');
		}
	}

	// Upload images immediately when files are added
	function handleFilesAdded() {
		// Use setTimeout to ensure the files are added to state first
		setTimeout(() => {
			handleImageUploads();
		}, 100);
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

	function handleTitleVoice(transcript: string) {
		title = transcript;
		hasUnsavedChanges = true;
		scheduleAutoSave();
		setTimeout(() => {
			if (titleInputEl && typeof titleInputEl.focus === 'function') {
				titleInputEl.focus();
			}
		}, 100);
	}

	function handleContentVoice(transcript: string) {
		if (editorStore) {
			const editor = get(editorStore);
			if (editor) {
				// Insert at cursor position instead of replacing all content
				editor.commands.insertContent(transcript);
				hasUnsavedChanges = true;
				scheduleAutoSave();
			}
		}
	}

	function getEditorContext(): { contentBefore: string; contentAfter: string } {
		if (!editorStore) return { contentBefore: '', contentAfter: '' };

		const editor = get(editorStore);
		if (!editor) return { contentBefore: '', contentAfter: '' };

		const { from } = editor.state.selection;
		const doc = editor.state.doc;

		// Get text content before cursor
		const contentBefore = doc.textBetween(0, from, '\n');
		// Get text content after cursor
		const contentAfter = doc.textBetween(from, doc.content.size, '\n');

		return { contentBefore, contentAfter };
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
	}

	function handleAITaskResult(result: string) {
		if (editorStore) {
			const editor = get(editorStore);
			if (editor) {
				// Insert AI task result at cursor position
				editor.commands.insertContent(result);
				hasUnsavedChanges = true;
				scheduleAutoSave();
			}
		}
	}

	function getCleanContent(): string {
		if (!editorStore) return '';
		const editor = get(editorStore);
		if (!editor) return '';
		// Get text content without HTML tags
		return editor.getText();
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
				<div class="mb-2 flex gap-2">
					<!-- Back button - only visible on mobile -->
					{#if onBackToList}
						<Button
							variant="ghost"
							size="sm"
							onclick={onBackToList}
							class="md:hidden"
							aria-label="Back to list"
						>
							<ChevronLeft class="h-5 w-5" />
						</Button>
					{/if}
					<Input
						bind:this={titleInputEl}
						type="text"
						bind:value={title}
						oninput={handleTitleChange}
						placeholder={$t('notes.untitled')}
						class="flex-1 text-xl font-semibold"
					/>
					<VoiceInput
						onTranscript={handleTitleVoice}
						onError={handleVoiceError}
						minimal={true}
					/>
				</div>
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
			<div class="mt-2 flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-2">
				<VoiceInput
					onTranscript={handleContentVoice}
					onError={handleVoiceError}
					title={title || ''}
					getContext={getEditorContext}
					useContextualCorrection={!!editorStore}
				/>
				<AITaskButton
					onResult={handleAITaskResult}
					title={title || ''}
					content={getCleanContent()}
					minimal={true}
				/>
				<div class="flex-1"></div>
				<span class="text-xs text-muted-foreground">
					{$t('ai.toolbar_hint') || 'Voice input or AI task'}
				</span>
			</div>

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
					onFilesAdded={handleFilesAdded}
				/>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{$t('notes.selectNote')}</p>
	</div>
{/if}
