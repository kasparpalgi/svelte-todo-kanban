/** @file src/lib/server/__tests__/cardThread.test.ts */
import { describe, it, expect } from 'vitest';
import { withComments } from '../cardThread';

const BODY = '# Fix it\n\n## Original Requirement\n\n[NEVER REMOVE]\n\nFix the button.\n';
const kaspar = { name: 'Kaspar', username: 'kaspar' };

describe('withComments', () => {
	it('leaves a card with no comments untouched', () => {
		expect(withComments(BODY, [])).toBe(BODY);
		expect(withComments(BODY)).toBe(BODY);
	});

	it('appends the thread oldest first, with author and minute', () => {
		const out = withComments(BODY, [
			{ content: 'First run looked fine.', created_at: '2026-11-07T10:00:59Z', user: kaspar },
			{ content: 'Still broken on mobile.', created_at: '2026-11-07T12:30:00Z', user: kaspar }
		]);
		expect(out.startsWith(BODY.trimEnd())).toBe(true);
		expect(out).toContain('## Card comments');
		expect(out).toContain('**Kaspar** · 2026-11-07 12:30\n\nStill broken on mobile.');
		expect(out.indexOf('First run')).toBeLessThan(out.indexOf('Still broken'));
	});

	it("skips the board's own bookkeeping notes", () => {
		const notes = [
			'Task file ready: doc/todo/059-x-TODO.md (#59)',
			'Task file back to draft: doc/todo/059-x.md',
			'Could not write the task file to a/b: 409',
			'✅ **Task complete** — [`abc1234`](https://x)\n\n`059-x-DONE.md`'
		];
		const out = withComments(
			BODY,
			notes.map((content) => ({ content, user: kaspar }))
		);
		expect(out).toBe(BODY);
	});

	it('flattens editor HTML and falls back to the username, then Someone', () => {
		const out = withComments(BODY, [
			{ content: '<p>Use the <b>blue</b> one</p>', user: { username: 'karel' } },
			{ content: 'No author', user: null }
		]);
		expect(out).toContain('**karel**\n\nUse the blue one');
		expect(out).toContain('**Someone**\n\nNo author');
	});

	it('replaces the thread from an earlier queueing instead of repeating it', () => {
		const once = withComments(BODY, [{ content: 'Old note', user: kaspar }]);
		const twice = withComments(once, [
			{ content: 'Old note', user: kaspar },
			{ content: 'New note', user: kaspar }
		]);
		expect(twice.match(/## Card comments/g)).toHaveLength(1);
		expect(twice.match(/Old note/g)).toHaveLength(1);
		expect(twice).toContain('New note');
		expect(withComments(once, [])).toBe(BODY);
	});
});
