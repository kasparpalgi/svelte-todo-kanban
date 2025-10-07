<!-- @file src/lib/components/editor/RichTextEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEditor, Editor } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';
	import { get } from 'svelte/store';
	import StarterKit from '@tiptap/starter-kit';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import EditorToolbar from './EditorToolbar.svelte';

	let {
		content = '',
		editor: editorStore = $bindable(),
		showToolbar = true
	} = $props<{
		content?: string;
		editor?: Readable<Editor> | null;
		showToolbar?: boolean;
	}>();

	let element: HTMLDivElement;

	onMount(() => {
		if (element) {
			editorStore = createEditor({
				element: element,
				extensions: [
					StarterKit,
					TaskList,
					TaskItem.configure({
						nested: true
					})
				],
				content: content || '',
				editorProps: {
					attributes: {
						class:
							'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-4 rounded-md border'
					}
				}
			});
		}
	});

	onDestroy(() => {
		if (editorStore) {
			get(editorStore)?.destroy();
		}
	});
</script>

<div>
	{#if editorStore && showToolbar}
		<EditorToolbar editor={editorStore} />
	{/if}
	<div bind:this={element}></div>
</div>
