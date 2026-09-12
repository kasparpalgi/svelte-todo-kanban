/** @file src/lib/components/editor/__tests__/markdownRoundTrip.svelte.test.ts */
import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { createEditorExtensions } from '../extensions';
import { getEditorMarkdown } from '$lib/utils/markdown';

let editor: Editor | null = null;

/** The real app extension set — this is what the card and note editors mount. */
function mount(content: string): Editor {
	editor = new Editor({
		element: document.createElement('div'),
		extensions: createEditorExtensions(),
		content
	});
	return editor;
}

afterEach(() => {
	editor?.destroy();
	editor = null;
});

describe('editor markdown round-trip', () => {
	it('stores markdown, not HTML', () => {
		const md = getEditorMarkdown(mount('**bold** and *italic*'));
		expect(md).toBe('**bold** and *italic*');
	});

	it('keeps the document rich while the storage stays markdown', () => {
		const e = mount('## Ship it');
		expect(e.getHTML()).toContain('<h2>');
		expect(getEditorMarkdown(e)).toBe('## Ship it');
	});

	it('round-trips every construct the toolbar can produce', () => {
		const md = [
			'# Heading one',
			'',
			'## Heading two',
			'',
			'Some **bold**, some *italic*, some `code` and a [link](https://example.com).',
			'',
			'- one',
			'- two',
			'',
			'1. first',
			'2. second',
			'',
			'> quoted',
			'',
			'```ts',
			'const a = 1;',
			'```'
		].join('\n');

		expect(getEditorMarkdown(mount(md))).toBe(md);
	});

	it('round-trips task lists as GFM checkboxes', () => {
		const md = '- [ ] not done\n- [x] done';
		expect(getEditorMarkdown(mount(md))).toBe(md);
	});

	it('is idempotent — reloading a saved body produces the same body', () => {
		const md = '## Title\n\n- one\n- two\n\n- [x] three\n\nTrailing **text**.';
		const once = getEditorMarkdown(mount(md));
		editor?.destroy();
		const twice = getEditorMarkdown(mount(once));
		expect(twice).toBe(once);
	});

	it('splits a mixed bullet/checkbox list instead of inventing an empty checkbox', () => {
		// markdown-it flags the whole list as a task list; Tiptap's taskList takes taskItems only.
		const md = getEditorMarkdown(mount('- context\n- [x] two'));
		expect(md).toBe('- context\n\n- [x] two');
		expect(md).not.toContain('- [ ] \n');
	});
});

describe('inserted content', () => {
	// VoiceInput and AITaskButton both drop their result in with insertContent().
	it('parses markdown inserted at the cursor into rich text', () => {
		const e = mount('');
		e.commands.insertContent('## Plan\n\n- [ ] first step');

		expect(e.getHTML()).toContain('<h2>Plan</h2>');
		expect(getEditorMarkdown(e)).toBe('## Plan\n\n- [ ] first step');
	});

	it('keeps a plain transcript plain', () => {
		const e = mount('');
		e.commands.insertContent('remember to call the bank tomorrow');

		expect(getEditorMarkdown(e)).toBe('remember to call the bank tomorrow');
	});
});

describe('legacy HTML bodies', () => {
	it('loads HTML written by the old editor as real rich text', () => {
		const e = mount('<h2>Ship it</h2><ul><li>one</li><li>two</li></ul>');
		expect(e.getHTML()).toContain('<h2>Ship it</h2>');
		expect(getEditorMarkdown(e)).toBe('## Ship it\n\n- one\n- two');
	});

	it('preserves inline marks when converting a legacy body', () => {
		expect(getEditorMarkdown(mount('<p>Do <strong>this</strong> <em>now</em></p>'))).toBe(
			'Do **this** *now*'
		);
	});

	it('carries legacy links across', () => {
		expect(
			getEditorMarkdown(mount('<p>see <a href="https://example.com">the docs</a></p>'))
		).toBe('see [the docs](https://example.com)');
	});
});
