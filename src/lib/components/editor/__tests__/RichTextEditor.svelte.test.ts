/** @file src/lib/components/editor/__tests__/RichTextEditor.svelte.test.ts */
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorHarness from './EditorHarness.svelte';
import { getEditorMarkdown } from '$lib/utils/markdown';
import type { Editor } from 'svelte-tiptap';

/** Mount the real component and wait for onMount to build the editor. */
async function mount(content: string): Promise<Editor> {
	let editor: Editor | null = null;
	render(EditorHarness, {
		content,
		onready: (instance: Editor) => {
			editor = instance;
		}
	});
	await new Promise((resolve) => setTimeout(resolve, 0));
	if (!editor) throw new Error('editor never mounted');
	return editor;
}

describe('RichTextEditor', () => {
	it('renders markdown content as rich text', async () => {
		await mount('## Ship it\n\nSome **bold** text.');

		const editable = document.querySelector('.editor-content');
		expect(editable?.innerHTML).toContain('<h2>Ship it</h2>');
		expect(editable?.innerHTML).toContain('<strong>bold</strong>');
	});

	it('hands the saved body back as markdown, not HTML', async () => {
		const editor = await mount('## Ship it\n\n- [x] done');

		expect(getEditorMarkdown(editor)).toBe('## Ship it\n\n- [x] done');
	});

	it('serialises toolbar edits as markdown', async () => {
		const editor = await mount('plain');

		editor.chain().selectAll().toggleBold().run();

		expect(getEditorMarkdown(editor)).toBe('**plain**');
	});

	it('still opens a body written by the old HTML editor', async () => {
		const editor = await mount('<h2>Legacy</h2><ul><li>one</li><li>two</li></ul>');

		expect(document.querySelector('.editor-content')?.innerHTML).toContain('<h2>Legacy</h2>');
		expect(getEditorMarkdown(editor)).toBe('## Legacy\n\n- one\n- two');
	});
});
