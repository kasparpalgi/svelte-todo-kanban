/** @file src/lib/server/__tests__/taskfile.test.ts */
import { describe, it, expect } from 'vitest';
import {
	buildDraftFile,
	buildTaskFile,
	camelName,
	ensureFooter,
	findTaskFileRenames,
	nextNumber,
	runWithLabel,
	toText,
	todoPathFor
} from '../taskfile';

describe('camelName', () => {
	it('camel-cases the first four words', () => {
		expect(camelName('Fix the login redirect now')).toBe('fixTheLoginRedirect');
	});

	it('falls back when the title has no letters', () => {
		expect(camelName('!!! ???')).toBe('kanbanTask');
	});
});

describe('toText', () => {
	it('leaves plain text alone', () => {
		expect(toText('just a voice dump')).toBe('just a voice dump');
	});

	it('turns editor HTML into markdown-ish text', () => {
		expect(toText('<p>Hello &amp; welcome</p><ul><li>one</li><li>two</li></ul>')).toBe(
			'Hello & welcome\n\n- one\n- two'
		);
	});

	it('handles an empty body', () => {
		expect(toText(null)).toBe('');
	});
});

describe('nextNumber', () => {
	it('starts at 001 in an empty folder', () => {
		expect(nextNumber([])).toBe('001');
	});

	it('takes one past the highest number, ignoring other files', () => {
		expect(nextNumber(['001-a-DONE.md', '014-b-TODO.md', 'README.md'])).toBe('015');
	});

	it('uses the GitHub issue number when the card has one', () => {
		expect(nextNumber(['166-x-DONE.md'], 165)).toBe('165');
	});

	it('keeps four-digit issue numbers whole', () => {
		expect(nextNumber([], 1042)).toBe('1042');
	});

	it('falls back to highest+1 when the issue number is already taken', () => {
		expect(nextNumber(['165-other-DONE.md', '166-x-TODO.md'], 165)).toBe('167');
	});
});

describe('todoPathFor', () => {
	it('renumbers a draft to its issue number', () => {
		expect(todoPathFor('.claude/todo/167-chromeExt.md', 165)).toBe(
			'.claude/todo/165-chromeExt-TODO.md'
		);
	});

	it('only adds -TODO when the card has no issue', () => {
		expect(todoPathFor('doc/todo/033-thing.md', null)).toBe('doc/todo/033-thing-TODO.md');
	});
});

describe('runWithLabel', () => {
	it('defaults to sonnet', () => {
		expect(runWithLabel('add a button')).toBe('Sonnet 5 / medium');
	});

	it('honours opus from explicit Run with:', () => {
		expect(runWithLabel('Run with: opus\nredesign auth')).toBe('Opus 5 / high');
	});

	it('honours opus 5 from explicit Run with:', () => {
		expect(runWithLabel('Run with: opus 5\nhard task')).toBe('Opus 5 / high');
	});

	it('honours opus 4.8 from explicit Run with:', () => {
		expect(runWithLabel('Run with: opus 4.8\nmedium hard task')).toBe('Opus 4.8 / high');
	});

	it('honours sonnet 4.6, with the family default effort', () => {
		expect(runWithLabel('Run with: sonnet 4.6\nsimple task')).toBe('Sonnet 4.6 / medium');
	});

	it('picks up a bare model name "Opus 4.8"', () => {
		expect(runWithLabel('Opus 4.8\nrefactor everything')).toBe('Opus 4.8 / high');
	});

	it('picks up a bare "haiku"', () => {
		expect(runWithLabel('haiku\nadd a label')).toBe('Haiku 4.5 / low');
	});

	it('honours an effort written after the slash', () => {
		expect(runWithLabel('Run with: opus 4.8 / xhigh\nhard task')).toBe('Opus 4.8 / xhigh');
	});

	it('prefers an explicit Run with: over a model named earlier in prose', () => {
		expect(runWithLabel('rewrite the sonnet parser\nRun with: opus')).toBe('Opus 5 / high');
	});
});

describe('buildDraftFile', () => {
	it('produces a draft without the agent-list trailer', () => {
		const file = buildDraftFile({ id: 'abc', title: 'Ship it', content: '<p>Do <b>this</b></p>' });
		expect(file).not.toContain('> Run with:');
		expect(file).toContain('# Ship it');
		expect(file).toContain('[NEVER REMOVE]');
		expect(file).toContain('Do this');
		expect(file).not.toContain('agent list');
		expect(file).not.toContain('<p>');
	});

	it('uses a placeholder when the card has no description yet', () => {
		expect(buildDraftFile({ id: 'abc', title: 'Ship it' })).toContain('_(no description yet)_');
	});

	it('names the card so the runner can close the loop', () => {
		expect(buildDraftFile({ id: 'a1b2c3d4-0000-4000-8000-000000000000', title: 'x' })).toContain(
			'_From Kanban card `a1b2c3d4-0000-4000-8000-000000000000`._'
		);
	});

	it('omits the Run with line when the card is on auto', () => {
		expect(buildDraftFile({ id: 'abc', title: 'Ship it', content: 'add a button' })).not.toContain(
			'> Run with:'
		);
	});

	it('honours a hand-typed Run with line in the card body (back-compat)', () => {
		const file = buildDraftFile({ id: 'abc', title: 'Ship it', content: 'Run with: opus\ndo it' });
		expect(file).toContain('> Run with: Opus 5 / high');
	});

	it('prefers the agent_model/agent_effort fields over card prose', () => {
		const file = buildDraftFile({
			id: 'abc',
			title: 'Ship it',
			content: 'Run with: opus\ndo it',
			agent_model: 'haiku',
			agent_effort: 'low'
		});
		expect(file).toContain('> Run with: Haiku 4.5 / low');
	});

	it('defaults effort to medium when only a model field is set', () => {
		const file = buildDraftFile({ id: 'abc', title: 'Ship it', agent_model: 'sonnet' });
		expect(file).toContain('> Run with: Sonnet 5 / medium');
	});
});

describe('buildTaskFile', () => {
	it('keeps the original requirement readable, not HTML', () => {
		const file = buildTaskFile({ id: 'abc', title: 'Ship it', content: '<p>Do <b>this</b></p>' });
		expect(file).not.toContain('> Run with:');
		expect(file).toContain('# Ship it');
		expect(file).toContain('[NEVER REMOVE]');
		expect(file).toContain('Do this');
		expect(file).not.toContain('<p>');
	});

	it('names the issue so the agent can reference it in the commit', () => {
		const file = buildTaskFile({ id: 'abc', title: 'Ship it', github_issue_number: 165 });
		expect(file).toContain('GitHub issue #165');
		expect(file).toContain('(#165)');
	});

	it('says nothing about an issue when the card has none', () => {
		expect(buildTaskFile({ id: 'abc', title: 'Ship it' })).not.toContain('GitHub issue');
	});

	it('says so when the card has no description', () => {
		expect(buildTaskFile({ id: 'abc', title: 'Ship it' })).toContain(
			'_(no description on the card)_'
		);
	});

	it('writes the field-based tier when the card names a model', () => {
		const file = buildTaskFile({
			id: 'abc',
			title: 'Ship it',
			agent_model: 'haiku',
			agent_effort: 'low'
		});
		expect(file).toContain('> Run with: Haiku 4.5 / low');
	});
});

describe('ensureFooter', () => {
	const CARD = { id: 'a1b2c3d4-0000-4000-8000-000000000000', title: 'x', github_issue_number: 2 };

	it('adds the card and issue lines a draft was written without', () => {
		const out = ensureFooter('# Fix errors\n\nnpm run check is red.\n', CARD);
		expect(out).toContain(`_From Kanban card \`${CARD.id}\`, moved to the agent list._`);
		expect(out).toContain('_GitHub issue #2');
		expect(out).toContain('npm run check is red.');
	});

	it('leaves a file that already has both alone', () => {
		const body = ensureFooter('# Fix errors\n', CARD);
		expect(ensureFooter(body, CARD)).toBe(body);
	});

	it('adds nothing but the card line when there is no issue', () => {
		const out = ensureFooter('# Fix errors\n', { ...CARD, github_issue_number: null });
		expect(out).toContain('_From Kanban card');
		expect(out).not.toContain('_GitHub issue');
	});
});

describe('findTaskFileRenames', () => {
	it('pairs a TODO removal with the DONE file in .claude/todo', () => {
		expect(
			findTaskFileRenames({
				removed: ['.claude/todo/157-errors-TODO.md'],
				added: ['.claude/todo/157-errors-DONE.md']
			})
		).toEqual([
			{
				number: '157',
				todoFile: '.claude/todo/157-errors-TODO.md',
				doneFile: '.claude/todo/157-errors-DONE.md'
			}
		]);
	});

	it('still pairs files in doc/todo', () => {
		expect(
			findTaskFileRenames({
				removed: ['doc/todo/031-fix-TODO.md'],
				added: ['doc/todo/031-fix-DONE.md']
			})
		).toHaveLength(1);
	});

	it('treats a -BLOCKED rename as the task being over too', () => {
		expect(
			findTaskFileRenames({
				removed: ['.claude/todo/165-chromeExt-TODO.md'],
				added: ['.claude/todo/165-chromeExt-BLOCKED.md']
			})
		).toHaveLength(1);
	});

	it('ignores a removal with no matching DONE file', () => {
		expect(
			findTaskFileRenames({ removed: ['.claude/todo/160-dragNDropCrap-TODO.md'], added: [] })
		).toEqual([]);
	});
});
