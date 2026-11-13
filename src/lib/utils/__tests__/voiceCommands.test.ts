/** @file src/lib/utils/__tests__/voiceCommands.test.ts */
import { describe, it, expect } from 'vitest';
import { findWakeWord, matchIntent, speechLang } from '../voiceCommands';

describe('findWakeWord', () => {
	it('returns the command after the wake word', () => {
		expect(findWakeWord('Hopsti, what can you do?', 'Hopsti')).toBe('what can you do');
	});

	it('tolerates mishearings and split words', () => {
		expect(findWakeWord('hopstee help', 'Hopsti')).toBe('help');
		expect(findWakeWord('hop sti help', 'Hopsti')).toBe('help');
	});

	it('returns an empty command for the wake word alone', () => {
		expect(findWakeWord('Hopsti', 'Hopsti')).toBe('');
	});

	it('returns null without the wake word', () => {
		expect(findWakeWord('what can you do', 'Hopsti')).toBeNull();
		expect(findWakeWord('anything', '')).toBeNull();
	});

	it('supports a custom multi-word wake word', () => {
		expect(findWakeWord('hey computer help', 'Hey Computer')).toBe('help');
	});
});

describe('matchIntent', () => {
	it('maps phrases to intents', () => {
		expect(matchIntent('')).toBe('wake');
		expect(matchIntent('what can you do')).toBe('help');
		expect(matchIntent('mida sa oskad')).toBe('help');
		expect(matchIntent('order a pizza')).toBe('unknown');
	});
});

describe('speechLang', () => {
	it('maps app locales to speech tags', () => {
		expect(speechLang('et')).toBe('et-EE');
		expect(speechLang('en')).toBe('en-US');
		expect(speechLang('xx')).toBe('en-US');
	});
});
