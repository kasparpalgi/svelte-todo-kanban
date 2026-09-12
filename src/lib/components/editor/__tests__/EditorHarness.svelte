<!-- @file src/lib/components/editor/__tests__/EditorHarness.svelte - hands the mounted editor to tests -->
<script lang="ts">
	import { get } from 'svelte/store';
	import RichTextEditor from '../RichTextEditor.svelte';
	import type { Editor } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';

	let { content = '', onready }: { content?: string; onready?: (editor: Editor) => void } =
		$props();

	let editor: Readable<Editor> | null = $state(null);

	$effect(() => {
		if (editor) onready?.(get(editor));
	});
</script>

<RichTextEditor bind:editor {content} />
