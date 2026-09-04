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
		expect(runWithLabel('Run with: opus\nredesign auth')).toBe('Opus 5 / hard');
	});

	it('honours opus 5 from explicit Run with:', () => {
		expect(runWithLabel('Run with: opus 5\nhard task')).toBe('Opus 5 / hard');
	});

	it('honours opus 4.8 from explicit Run with:', () => {
		expect(runWithLabel('Run with: opus 4.8\nmedium hard task')).toBe('Opus 4.8 / high');
	});

	it('honours sonnet 4.6 from explicit Run with:', () => {
		expect(runWithLabel('Run with: sonnet 4.6\nsimple task')).toBe('Sonnet 4.6 / low');
	});

	it('picks up a bare model name "Opus 4.8"', () => {
		expect(runWithLabel('Opus 4.8\nrefactor everything')).toBe('Opus 4.8 / high');
	});

	it('picks up a bare "haiku"', () => {
		expect(runWithLabel('haiku\nadd a label')).toBe('Haiku 4.5 / low');
	});
});

describe('buildDraftFile', () => {
	it('produces a draft without the agent-list trailer', () => {
		const file = buildDraftFile({ id: 'abc', title: 'Ship it', content: '<p>Do <b>this</b></p>' });
		expect(file).toContain('> Run with: Sonnet 5 / medium');
		expect(file).toContain('# Ship it');
		expect(file).toContain('[NEVER REMOVE]');
		expect(file).toContain('Do this');
		expect(file).not.toContain('agent list');
		expect(file).not.toContain('<p>');
	});

	it('uses a placeholder when the card has no description yet', () => {
		expect(buildDraftFile({ id: 'abc', title: 'Ship it' })).toContain('_(no description yet)_');
	});
});

describe('buildTaskFile', () => {
	it('keeps the original requirement readable, not HTML', () => {
		const file = buildTaskFile({ id: 'abc', title: 'Ship it', content: '<p>Do <b>this</b></p>' });
		expect(file).toContain('> Run with: Sonnet 5 / medium');
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
});
