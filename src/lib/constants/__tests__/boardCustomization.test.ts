/** @file src/lib/constants/__tests__/boardCustomization.test.ts */
import { describe, it, expect } from 'vitest';
import {
	getBoardCustomization,
	DEFAULT_CUSTOMIZATION,
	COLOR_PRESETS,
	BACKGROUND_PRESETS
} from '../boardCustomization';

describe('getBoardCustomization', () => {
	it('returns defaults for null/undefined board', () => {
		expect(getBoardCustomization(null)).toEqual(DEFAULT_CUSTOMIZATION);
		expect(getBoardCustomization(undefined)).toEqual(DEFAULT_CUSTOMIZATION);
	});

	it('returns defaults when settings is null', () => {
		expect(getBoardCustomization({ settings: null })).toEqual(DEFAULT_CUSTOMIZATION);
	});

	it('reads icon, color and background from an object settings blob', () => {
		const color = COLOR_PRESETS[3].value;
		const result = getBoardCustomization({
			settings: { icon: '🚀', color, background: 'ocean' }
		});
		expect(result.icon).toBe('🚀');
		expect(result.color).toBe(color);
		expect(result.backgroundId).toBe('ocean');
		expect(result.backgroundStyle).toBe(BACKGROUND_PRESETS.find((b) => b.id === 'ocean')?.style);
	});

	it('parses a JSON string settings blob', () => {
		const result = getBoardCustomization({
			settings: JSON.stringify({ icon: '🎨', color: COLOR_PRESETS[0].value, background: 'forest' })
		});
		expect(result.icon).toBe('🎨');
		expect(result.color).toBe(COLOR_PRESETS[0].value);
		expect(result.backgroundId).toBe('forest');
	});

	it('tolerates malformed JSON string settings', () => {
		expect(getBoardCustomization({ settings: '{not valid json' })).toEqual(DEFAULT_CUSTOMIZATION);
	});

	it('ignores an unknown color not in the preset list', () => {
		const result = getBoardCustomization({ settings: { color: '#123456' } });
		expect(result.color).toBe('');
	});

	it('ignores an unknown background id and falls back to none', () => {
		const result = getBoardCustomization({ settings: { background: 'bogus' } });
		expect(result.backgroundId).toBe('none');
		expect(result.backgroundStyle).toBe('');
	});

	it('trims whitespace-only icon to empty', () => {
		expect(getBoardCustomization({ settings: { icon: '   ' } }).icon).toBe('');
	});

	it('preserves unrelated settings without affecting customization', () => {
		const result = getBoardCustomization({
			settings: { agent_list_id: 'list-1', enable_hour_tracking: true, icon: '🔥' }
		});
		expect(result.icon).toBe('🔥');
		expect(result.color).toBe('');
		expect(result.backgroundId).toBe('none');
	});

	it('maps the "none" background to an empty style', () => {
		const result = getBoardCustomization({ settings: { background: 'none' } });
		expect(result.backgroundId).toBe('none');
		expect(result.backgroundStyle).toBe('');
	});
});
