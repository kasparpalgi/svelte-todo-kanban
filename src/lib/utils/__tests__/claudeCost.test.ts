import { describe, it, expect } from 'vitest';
import { effectiveRatio, currentMonthBounds } from '../claudeCost';

describe('effectiveRatio', () => {
	it('is 1 for no plan (pay list price)', () => {
		expect(effectiveRatio(null, null, 100)).toBe(1);
	});

	it('is 1 for the api plan', () => {
		expect(effectiveRatio('api', null, 100)).toBe(1);
	});

	it('is null when the plan has no monthly amount set', () => {
		expect(effectiveRatio('pro', null, 100)).toBeNull();
		expect(effectiveRatio('pro', 0, 100)).toBeNull();
	});

	it('is null when the period has no usage yet', () => {
		expect(effectiveRatio('pro', 20, 0)).toBeNull();
		expect(effectiveRatio('pro', 20, null)).toBeNull();
	});

	it('amortizes the flat plan over the period list cost', () => {
		expect(effectiveRatio('pro', 18, 200)).toBeCloseTo(0.09);
		expect(effectiveRatio('max20x', 180, 900)).toBeCloseTo(0.2);
	});
});

describe('currentMonthBounds', () => {
	it('returns a from strictly before to', () => {
		const { from, to } = currentMonthBounds();
		expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
	});

	it('spans exactly one calendar month', () => {
		const { from, to } = currentMonthBounds();
		const fromDate = new Date(from);
		const toDate = new Date(to);
		expect(fromDate.getUTCDate()).toBe(1);
		expect(toDate.getUTCDate()).toBe(1);
		expect(fromDate.getUTCHours()).toBe(0);
	});
});
