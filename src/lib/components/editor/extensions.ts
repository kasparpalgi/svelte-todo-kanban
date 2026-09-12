/** @file src/lib/components/editor/extensions.ts - Tiptap extension set shared by every editor instance */
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import type { AnyExtension } from '@tiptap/core';

/** Ctrl/Cmd+K over the current selection — an empty URL clears the link. */
const LinkWithShortcut = Link.configure({
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
});

/**
 * markdown-it-task-lists flags the whole `<ul>` as a task list as soon as a single item is a
 * checkbox, but Tiptap's `taskList` may only contain `taskItem`s. A mixed list — common in
 * imported GitHub issue bodies, where context bullets sit next to checkboxes — would otherwise
 * parse with a spurious empty checkbox wedged in front of it. Split it into consecutive runs so
 * the bullets stay bullets and the checkboxes stay checkboxes.
 */
function splitMixedTaskLists(element: HTMLElement): void {
	element.querySelectorAll('ul.contains-task-list').forEach((list) => {
		const items = [...list.children].filter(
			(child): child is HTMLElement => child.tagName === 'LI'
		);

		const runs: { isTask: boolean; items: HTMLElement[] }[] = [];
		for (const item of items) {
			const isTask = item.classList.contains('task-list-item');
			const current = runs[runs.length - 1];
			if (current && current.isTask === isTask) current.items.push(item);
			else runs.push({ isTask, items: [item] });
		}

		if (runs.length < 2) return;

		for (const run of runs) {
			const replacement = list.ownerDocument.createElement('ul');
			// Task runs inherit the original attributes so the taskList marker survives no matter
			// which of the two extension hooks ran first; plain runs start bare, as normal bullets.
			if (run.isTask) {
				for (const attribute of [...list.attributes]) {
					replacement.setAttribute(attribute.name, attribute.value);
				}
			}
			replacement.append(...run.items);
			list.parentNode?.insertBefore(replacement, list);
		}
		list.remove();
	});
}

/** Turn markdown-it's `<li class="task-list-item"><input checked>` into Tiptap's data attributes. */
function markTaskItems(element: HTMLElement): void {
	element.querySelectorAll('.task-list-item').forEach((item) => {
		const input = item.querySelector('input');
		item.setAttribute('data-type', 'taskItem');
		if (!input) return;

		item.setAttribute('data-checked', String(input.checked));
		// markdown-it renders the item as `<input> text`. Dropping the checkbox leaves that
		// separating space in front of the label, and insertContent() — the AI, voice and paste
		// paths — parses with preserveWhitespace, so it would survive into the saved markdown.
		const next = input.nextSibling;
		if (next?.nodeType === Node.TEXT_NODE && next.textContent) {
			next.textContent = next.textContent.replace(/^[ \t]/, '');
		}
		input.remove();
	});
}

const TaskItemWithMixedLists = TaskItem.configure({ nested: true }).extend({
	addStorage() {
		return {
			...this.parent?.(),
			// Replaces tiptap-markdown's own `parse` hook (specs merge one level deep), so this has
			// to do the item marking the default did, plus the mixed-list split.
			markdown: {
				parse: {
					updateDOM(element: HTMLElement) {
						splitMixedTaskLists(element);
						markTaskItems(element);
					}
				}
			}
		};
	}
});

/**
 * tiptap-markdown only teaches `bulletList`/`orderedList` about tightness, so a checklist
 * serialises loose — a blank line between every item. Give `taskList` the same attribute and
 * checklists round-trip as the tight lists they were written as.
 */
const TightTaskLists = Extension.create({
	name: 'markdownTightTaskLists',
	addGlobalAttributes() {
		return [
			{
				types: ['taskList'],
				attributes: {
					tight: {
						default: true,
						parseHTML: (element: HTMLElement) =>
							element.getAttribute('data-tight') === 'true' || !element.querySelector('p'),
						renderHTML: (attributes: { tight?: boolean }) => ({
							'data-tight': attributes.tight ? 'true' : null
						})
					}
				}
			}
		];
	}
});

/**
 * Bodies are stored as Markdown, not HTML. `html: true` lets markdown-it pass legacy HTML
 * bodies straight through, so cards written before that switch still load intact and get
 * rewritten as Markdown on their next save.
 */
const MarkdownStorage = Markdown.configure({
	html: true,
	tightLists: true,
	bulletListMarker: '-',
	// Off on purpose: auto-linking bare URLs on parse makes a load→serialise round-trip
	// non-idempotent, which the autosave timers would read as a real edit.
	linkify: false,
	breaks: false,
	transformPastedText: true,
	transformCopiedText: true
});

export function createEditorExtensions(): AnyExtension[] {
	return [
		StarterKit.configure({ link: false }),
		LinkWithShortcut,
		TaskList,
		TaskItemWithMixedLists,
		TightTaskLists,
		MarkdownStorage
	];
}
