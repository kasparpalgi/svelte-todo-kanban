<!-- @file src/lib/components/notes/NoteEditor.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
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

	// Update local state when note changes
	$effect(() => {
		if (note) {
			title = note.title;
			hasUnsavedChanges = false;

			// Update editor content
			if (editorStore) {
				let unsubscribe: (() => void) | undefined;
				unsubscribe = editorStore.subscribe((e) => {
					if (e && note.content !== undefined) {
						e.commands.setContent(note.content || '');
					}
					if (unsubscribe) unsubscribe();
				});
			}
		}
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
		if (!hasUnsavedChanges || !editorStore || !note) return;

		let content = '';
		const unsubscribe = editorStore.subscribe((editor) => {
			if (editor) {
				content = editor.getHTML();
			}
		});
		unsubscribe();

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

	onMount(() => {
		return () => {
			if (autoSaveTimeout) {
				clearTimeout(autoSaveTimeout);
			}
		};
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
			<div class="prose-editor" onkeyup={handleContentChange}></div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{$t('notes.selectNote')}</p>
	</div>
{/if}
