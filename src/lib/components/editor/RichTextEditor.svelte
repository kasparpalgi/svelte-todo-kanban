<!-- @file src/lib/components/editor/RichTextEditor.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { createEditor, Editor } from 'svelte-tiptap';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import EditorToolbar from './EditorToolbar.svelte';
	import type { Readable } from 'svelte/store';

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
					StarterKit.configure({
						link: false
					}),
					Link.configure({
						openOnClick: true,
						HTMLAttributes: {
							class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
							target: '_blank',
							rel: 'noopener noreferrer'
						}
					}).extend({
						addKeyboardShortcuts() {
							return {
								'Mod-k': () => {
									const previousUrl = this.editor.getAttributes('link').href;
									const url = window.prompt('Enter URL:', previousUrl);

									if (url === null) {
										return true;
									}

									if (url === '') {
										this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
										return true;
									}

									this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
									return true;
								}
							};
						}
					}),
					TaskList,
					TaskItem.configure({
						nested: true
					})
				],
				content: content || '',
				editorProps: {
					attributes: {
						class:
							'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-4 rounded-md border editor-content'
					}
				}
			});
		}
	});

	onDestroy(() => {
		if (editorStore) {
			(get(editorStore) as Editor)?.destroy();
		}
	});
</script>

<div>
	{#if editorStore && showToolbar}
		<EditorToolbar editor={editorStore} />
	{/if}
	<div bind:this={element}></div>
</div>

<style>
	:global(.editor-content ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
	}

	:global(.editor-content ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
	}

	:global(.editor-content ul li),
	:global(.editor-content ol li) {
		display: list-item;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	:global(.editor-content ul li::marker),
	:global(.editor-content ol li::marker) {
		color: hsl(var(--foreground));
	}

	:global(.editor-content ul ul) {
		list-style-type: circle;
		margin-top: 0.25rem;
	}

	:global(.editor-content ul ul ul) {
		list-style-type: square;
	}
</style>
