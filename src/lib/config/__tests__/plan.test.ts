/** @file src/lib/config/__tests__/plan.test.ts */
import { describe, it, expect } from 'vitest';
import { isPaid, FREE_LIMITS, PAID_PRICE_EUR } from '../plan';

describe('isPaid', () => {
	it('treats missing/null user as free', () => {
		expect(isPaid(null)).toBe(false);
		expect(isPaid(undefined)).toBe(false);
		expect(isPaid({})).toBe(false);
	});

	it('treats plan="free" as not paid', () => {
		expect(isPaid({ plan: 'free' })).toBe(false);
		expect(isPaid({ plan: 'free', plan_expires_at: null })).toBe(false);
	});

	it('treats plan="paid" with no expiry as paid', () => {
		expect(isPaid({ plan: 'paid' })).toBe(true);
		expect(isPaid({ plan: 'paid', plan_expires_at: null })).toBe(true);
	});

	it('treats a future expiry as paid', () => {
		const future = new Date(Date.now() + 86_400_000).toISOString();
		expect(isPaid({ plan: 'paid', plan_expires_at: future })).toBe(true);
	});

	it('treats a past expiry as lapsed (free)', () => {
		const past = new Date(Date.now() - 86_400_000).toISOString();
		expect(isPaid({ plan: 'paid', plan_expires_at: past })).toBe(false);
	});

	it('ignores an unknown plan value', () => {
		expect(isPaid({ plan: 'enterprise' })).toBe(false);
	});
});

describe('plan constants', () => {
	it('matches the product spec (#194)', () => {
		expect(FREE_LIMITS.boards).toBe(7);
		expect(FREE_LIMITS.uncompletedCardsPerBoard).toBe(40);
		expect(FREE_LIMITS.collaboratorsPerBoard).toBe(4);
		expect(FREE_LIMITS.uploads).toBe(10);
		expect(PAID_PRICE_EUR).toBe(12);
	});
});
