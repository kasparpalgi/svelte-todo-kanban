/** @file src/lib/utils/__tests__/markdown.test.ts */
import { describe, it, expect } from 'vitest';
import { getEditorMarkdown, isHtmlContent, markdownToPlainText, toPlainText } from '../markdown';

describe('isHtmlContent', () => {
	it('recognises bodies written by the old HTML editor', () => {
		expect(isHtmlContent('<p>Hello</p>')).toBe(true);
		expect(isHtmlContent('<ul><li>one</li></ul>')).toBe(true);
		expect(isHtmlContent('<h2>Raw voice note</h2>')).toBe(true);
	});

	it('treats markdown as markdown even when it carries an inline tag', () => {
		expect(isHtmlContent('# Title\n\n- one\n- two')).toBe(false);
		expect(isHtmlContent('press <kbd>Ctrl</kbd> to save')).toBe(false);
		expect(isHtmlContent('use `<Foo />` here')).toBe(false);
	});

	it('handles empty input', () => {
		expect(isHtmlContent('')).toBe(false);
		expect(isHtmlContent(null)).toBe(false);
		expect(isHtmlContent(undefined)).toBe(false);
	});
});

describe('markdownToPlainText', () => {
	it('drops heading and quote prefixes', () => {
		expect(markdownToPlainText('## Ship it\n\n> because reasons')).toBe('Ship it because reasons');
	});

	it('drops list bullets and task checkboxes', () => {
		expect(markdownToPlainText('- one\n- [ ] two\n- [x] three\n1. four')).toBe(
			'one two three four'
		);
	});

	it('keeps link and image text but not the target', () => {
		expect(markdownToPlainText('see [the docs](https://example.com/a)')).toBe('see the docs');
		expect(markdownToPlainText('![a cat](cat.png)')).toBe('a cat');
		expect(markdownToPlainText('<https://example.com>')).toBe('https://example.com');
	});

	it('unwraps emphasis and code', () => {
		expect(markdownToPlainText('**bold** and *italic* and ~~gone~~ and `code`')).toBe(
			'bold and italic and gone and code'
		);
	});

	it('keeps the body of a fenced code block', () => {
		expect(markdownToPlainText('```ts\nconst a = 1;\n```')).toBe('const a = 1;');
	});

	it('drops horizontal rules', () => {
		expect(markdownToPlainText('one\n\n---\n\ntwo')).toBe('one two');
	});

	it('handles empty input', () => {
		expect(markdownToPlainText('')).toBe('');
		expect(markdownToPlainText(null)).toBe('');
	});
});

describe('toPlainText', () => {
	it('routes legacy HTML through the HTML stripper', () => {
		expect(toPlainText('<p>Hello &amp; welcome</p><ul><li>one</li></ul>')).toBe(
			'Hello & welcome. one.'
		);
	});

	it('routes markdown through the markdown stripper', () => {
		expect(toPlainText('## Hello\n\n- one\n- two')).toBe('Hello one two');
	});

	it('handles empty input', () => {
		expect(toPlainText(null)).toBe('');
	});
});

describe('getEditorMarkdown', () => {
	it('serialises through the markdown storage when present', () => {
		const editor = {
			storage: { markdown: { getMarkdown: () => '# Title' } },
			getHTML: () => '<h1>Title</h1>'
		};
		expect(getEditorMarkdown(editor as never)).toBe('# Title');
	});

	it('falls back to HTML rather than losing the body', () => {
		const editor = { storage: {}, getHTML: () => '<p>kept</p>' };
		expect(getEditorMarkdown(editor as never)).toBe('<p>kept</p>');
	});

	it('handles a missing editor', () => {
		expect(getEditorMarkdown(null)).toBe('');
	});
});
