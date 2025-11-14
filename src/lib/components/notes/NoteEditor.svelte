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

	// Update when note changes
	$effect(() => {
		if (!note) {
			currentNoteId = null;
			title = '';
			return;
		}

		// Only update if it's actually a different note
		if (currentNoteId !== note.id) {
			currentNoteId = note.id;
			title = note.title;
			hasUnsavedChanges = false;

			// Update editor content
			updateEditorContent(note.content || '');
		}
	});

	// Watch for editor store changes
	$effect(() => {
		if (!editorStore) return;

		// Clean up previous subscription if any
		if (editorUnsubscribe) {
			editorUnsubscribe();
			editorUnsubscribe = null;
		}

		// Subscribe to editor store ONLY to set up event listeners
		// Do NOT set content here - that's handled by the note change effect
		editorUnsubscribe = editorStore.subscribe((editor) => {
			if (!editor) {
				return;
			}

			// Remove any existing listeners first
			editor.off('update');

			// Add update listener for user edits
			editor.on('update', () => {
				if (isSettingContent) {
					return;
				}
				handleContentChange();
			});
		});

		return () => {
			if (editorUnsubscribe) {
				editorUnsubscribe();
				editorUnsubscribe = null;
			}
		};
	});

	function updateEditorContent(content: string) {
		if (!editorStore) {
			return;
		}

		const unsub = editorStore.subscribe((editor) => {
			if (!editor) return;

			const currentContent = editor.getHTML();

			if (currentContent !== content) {
				isSettingContent = true;
				editor.commands.setContent(content);
				setTimeout(() => {
					isSettingContent = false;
				}, 50);
			}
		});
		unsub();
	}

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
		}

		if (content !== note.content) {
			updates.content = content;
		}

		if (Object.keys(updates).length > 0) {
			await onUpdate(updates);
			hasUnsavedChanges = false;
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
