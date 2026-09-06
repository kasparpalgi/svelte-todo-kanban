/** @file src/lib/server/__tests__/taskfile.test.ts */
import { describe, it, expect } from 'vitest';
import {
	buildDraftFile,
	buildTaskFile,
	camelName,
	nextNumber,
	runWithLabel,
	toText
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
