/** @file src/lib/utils/markdown.ts - Markdown helpers for the rich text editor's stored content */
import { stripHtml } from './stripHtml';
import type { Editor } from '@tiptap/core';

/**
 * Card and note bodies are stored as Markdown, but the column also holds HTML written by the
 * editor before that switch (and, with `html: true`, Markdown may legitimately contain inline
 * HTML). A body counts as legacy HTML only when a tag opens a *block* — inline `<b>`/`<code>`
 * inside otherwise-Markdown prose must not send it down the HTML path.
 */
const BLOCK_TAG = /<(p|div|ul|ol|li|h[1-6]|blockquote|pre|table|br)\b[^>]*>/i;

export function isHtmlContent(content?: string | null): content is string {
	return !!content && BLOCK_TAG.test(content);
}

/** Markdown constructs that carry no meaning once the text is flattened to a preview line. */
export function markdownToPlainText(markdown?: string | null): string {
	if (!markdown) return '';

	return (
		markdown
			// fenced code: keep the code, drop the fences
			.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
			.replace(/`([^`]+)`/g, '$1')
			// images before links — ![alt](src) would otherwise leave a stray "!"
			.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/<((?:https?|mailto):[^>\s]+)>/gi, '$1')
			// block prefixes: headings, quotes, list bullets, task checkboxes
			.replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
			.replace(/^[ \t]*>[ \t]?/gm, '')
			.replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/gm, '')
			.replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, '')
			// emphasis markers
			.replace(/(\*\*|__)(.*?)\1/g, '$2')
			.replace(/(\*|_)(.*?)\1/g, '$2')
			.replace(/~~(.*?)~~/g, '$1')
			.replace(/\s+/g, ' ')
			.trim()
	);
}

/**
 * Flatten a stored body to a single preview line, whichever format it happens to be in.
 * Used for card previews and for the context handed to the AI endpoints.
 */
export function toPlainText(content?: string | null): string {
	if (!content) return '';
	return isHtmlContent(content) ? stripHtml(content) : markdownToPlainText(content);
}

/**
 * The Markdown extension hangs `storage.markdown` off the editor. The fallback matters for
 * tests and for any editor built without it — better a stale HTML body than a lost one.
 */
export function getEditorMarkdown(editor: Editor | null | undefined): string {
	if (!editor) return '';
	const markdown = (editor.storage as { markdown?: { getMarkdown(): string } })?.markdown;
	return markdown ? markdown.getMarkdown() : editor.getHTML();
}
