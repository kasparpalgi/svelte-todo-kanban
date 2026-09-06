/** @file src/lib/utils/__tests__/cardDrag.test.ts */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
	DRAG_DISTANCE_THRESHOLD,
	TOUCH_MOVE_TOLERANCE,
	autoScrollIntent,
	isInteractiveTarget,
	pointerKind,
	shouldActivateMouseDrag,
	shouldCancelTouchHold
} from '../cardDrag';

describe('pointerKind', () => {
	it('treats a mouse as a mouse and everything else as touch', () => {
		expect(pointerKind('mouse')).toBe('mouse');
		expect(pointerKind('touch')).toBe('touch');
		expect(pointerKind('pen')).toBe('touch');
	});
});

describe('shouldActivateMouseDrag', () => {
	it('ignores movement inside the click slop area', () => {
		expect(shouldActivateMouseDrag(0, 0)).toBe(false);
		expect(shouldActivateMouseDrag(DRAG_DISTANCE_THRESHOLD, 0)).toBe(false);
	});

	it('activates once the pointer travels further than the threshold', () => {
		expect(shouldActivateMouseDrag(DRAG_DISTANCE_THRESHOLD + 1, 0)).toBe(true);
		expect(shouldActivateMouseDrag(-10, 0)).toBe(true);
	});

	it('measures diagonal travel, not per-axis travel', () => {
		expect(shouldActivateMouseDrag(5, 5)).toBe(true);
		expect(shouldActivateMouseDrag(3, 3)).toBe(false);
	});
});

describe('shouldCancelTouchHold', () => {
	it('keeps the hold alive while the finger only drifts', () => {
		expect(shouldCancelTouchHold(0, 0)).toBe(false);
		expect(shouldCancelTouchHold(0, TOUCH_MOVE_TOLERANCE)).toBe(false);
	});

	it('cancels the hold once the finger is clearly scrolling', () => {
		expect(shouldCancelTouchHold(0, TOUCH_MOVE_TOLERANCE + 1)).toBe(true);
		expect(shouldCancelTouchHold(-40, 0)).toBe(true);
	});

	it('tolerates more drift than a mouse does', () => {
		expect(TOUCH_MOVE_TOLERANCE).toBeGreaterThan(DRAG_DISTANCE_THRESHOLD);
	});
});

describe('autoScrollIntent', () => {
	const hotZone = 72;

	it('does not scroll while the pointer is in the middle', () => {
		expect(autoScrollIntent(500, 0, 1000, hotZone)).toBe(0);
	});

	it('scrolls towards the start near the leading edge', () => {
		expect(autoScrollIntent(10, 0, 1000, hotZone)).toBe(-1);
	});

	it('scrolls towards the end near the trailing edge', () => {
		expect(autoScrollIntent(990, 0, 1000, hotZone)).toBe(1);
	});

	it('respects a container that does not start at zero', () => {
		expect(autoScrollIntent(310, 300, 1000, hotZone)).toBe(-1);
		expect(autoScrollIntent(400, 300, 1000, hotZone)).toBe(0);
	});

	it('refuses to scroll a container too narrow for two hot zones', () => {
		expect(autoScrollIntent(50, 0, 100, hotZone)).toBe(0);
	});
});

describe('isInteractiveTarget', () => {
	function el(html: string): Element {
		const host = document.createElement('div');
		host.innerHTML = html;
		return host.firstElementChild!;
	}

	it('ignores non-element targets', () => {
		expect(isInteractiveTarget(null)).toBe(false);
	});

	it('protects buttons and form controls', () => {
		expect(isInteractiveTarget(el('<button>x</button>'))).toBe(true);
		expect(isInteractiveTarget(el('<input />'))).toBe(true);
		expect(isInteractiveTarget(el('<div role="button">x</div>'))).toBe(true);
	});

	it('protects controls the pointer landed on via a child element', () => {
		const button = el('<button><span>label</span></button>');
		expect(isInteractiveTarget(button.firstElementChild)).toBe(true);
	});

	it('lets plain card content start a drag', () => {
		expect(isInteractiveTarget(el('<h3>Card title</h3>'))).toBe(false);
	});

	it('protects other links but not the card link itself', () => {
		const cardLink = el('<a href="/card"><h3>Title</h3></a>');
		expect(isInteractiveTarget(cardLink.firstElementChild, cardLink)).toBe(false);
		expect(isInteractiveTarget(el('<a href="https://github.com">#1</a>'), cardLink)).toBe(true);
	});
});
