/** @file src/lib/utils/__tests__/shortcutAlias.test.ts */
import { describe, it, expect } from 'vitest';
import {
	RESERVED_ALIASES,
	generateRandomAlias,
	normalizeTargetUrl,
	validateAlias
} from '../shortcutAlias';

describe('shortcutAlias', () => {
	describe('validateAlias', () => {
		it('accepts a normal alphanumeric alias', () => {
			expect(validateAlias('mytest')).toEqual({ ok: true });
		});

		it('accepts alias with dots, underscores, dashes', () => {
			expect(validateAlias('my.test_one-2')).toEqual({ ok: true });
		});

		it('rejects empty input', () => {
			expect(validateAlias('   ')).toEqual({ ok: false, error: 'empty' });
		});

		it('rejects invalid characters', () => {
			expect(validateAlias('hello world')).toEqual({ ok: false, error: 'invalid_chars' });
			expect(validateAlias('hello/world')).toEqual({ ok: false, error: 'invalid_chars' });
		});

		it('rejects each reserved language alias', () => {
			for (const a of ['en', 'cs', 'et']) {
				expect(validateAlias(a)).toEqual({ ok: false, error: 'reserved' });
			}
		});

		it('rejects reserved top-level routes regardless of case', () => {
			expect(validateAlias('Settings')).toEqual({ ok: false, error: 'reserved' });
			expect(validateAlias('API')).toEqual({ ok: false, error: 'reserved' });
			expect(validateAlias('shortener')).toEqual({ ok: false, error: 'reserved' });
			expect(validateAlias('splitwise')).toEqual({ ok: false, error: 'reserved' });
		});
	});

	describe('generateRandomAlias', () => {
		it('produces 8-char [a-z0-9] string by default', () => {
			const alias = generateRandomAlias();
			expect(alias).toMatch(/^[a-z0-9]{8}$/);
		});

		it('honors custom length', () => {
			expect(generateRandomAlias(12)).toMatch(/^[a-z0-9]{12}$/);
		});

		it('does not collide with reserved words on short lengths', () => {
			// Sanity: reserved alias set still defined
			expect(RESERVED_ALIASES.has('en')).toBe(true);
		});
	});

	describe('normalizeTargetUrl', () => {
		it('keeps existing http/https schemes', () => {
			expect(normalizeTargetUrl('https://example.com')).toBe('https://example.com');
			expect(normalizeTargetUrl('HTTP://example.com')).toBe('HTTP://example.com');
		});

		it('prepends http:// if scheme missing', () => {
			expect(normalizeTargetUrl('example.com/path')).toBe('http://example.com/path');
		});

		it('returns empty string when input is whitespace', () => {
			expect(normalizeTargetUrl('   ')).toBe('');
		});
	});
});
