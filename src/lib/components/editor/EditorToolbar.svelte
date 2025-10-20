<!-- @file src/lib/components/editor/EditorToolbar.svelte -->
<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import type { Readable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import {
		Bold,
		Italic,
		Code,
		Heading1,
		Heading2,
		List,
		ListOrdered,
		Link as LinkIcon
	} from 'lucide-svelte';

	let { editor }: { editor: Readable<Editor> } = $props();

	function setLink() {
		if (!$editor) return;

		const previousUrl = $editor.getAttributes('link').href;
		const url = window.prompt('Enter URL:', previousUrl);

		if (url === null) {
			return;
		}

		if (url === '') {
			$editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		$editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}
</script>

{#if editor && $editor}
	<div
		class="mb-2 flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 bg-muted/30 p-2"
	>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('bold') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleBold().run()}
			disabled={!$editor.can().chain().focus().toggleBold().run()}
			title="Bold"
		>
			<Bold class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('italic') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleItalic().run()}
			disabled={!$editor.can().chain().focus().toggleItalic().run()}
			title="Italic"
		>
			<Italic class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('code') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleCode().run()}
			disabled={!$editor.can().chain().focus().toggleCode().run()}
			title="Code"
		>
			<Code class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('link') ? 'bg-muted' : ''}"
			onclick={setLink}
			title="Link (Ctrl+K)"
		>
			<LinkIcon class="h-4 w-4" />
		</Button>

		<div class="mx-1 h-6 w-px bg-border"></div>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleHeading({ level: 1 }).run()}
			title="Heading 1"
		>
			<Heading1 class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleHeading({ level: 2 }).run()}
			title="Heading 2"
		>
			<Heading2 class="h-4 w-4" />
		</Button>

		<div class="mx-1 h-6 w-px bg-border"></div>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('bulletList') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleBulletList().run()}
			title="Bullet List"
		>
			<List class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 w-8 p-0 {$editor.isActive('orderedList') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleOrderedList().run()}
			title="Numbered List"
		>
			<ListOrdered class="h-4 w-4" />
		</Button>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="h-8 px-2 {$editor.isActive('taskList') ? 'bg-muted' : ''}"
			onclick={() => $editor.chain().focus().toggleTaskList().run()}
			title="Task List"
		>
			<span class="toolbar-checkbox"></span>
		</Button>
	</div>
{/if}
