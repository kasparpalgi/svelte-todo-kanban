/** @file src/lib/utils/__tests__/cardDrag.svelte.test.ts */
// Runs in the real-chromium `client` vitest project so touch events, cancelability and
// preventDefault behave like a browser. Guards the touch-scroll fix: the board must not pan out
// from under a card once the long-press has committed a drag.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCardDrag } from '../cardDrag.svelte';
import { TOUCH_HOLD_DELAY, TOUCH_MOVE_TOLERANCE } from '../cardDrag';

function pointerDownTouch(el: HTMLElement, clientX: number, clientY: number) {
	el.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerId: 1,
			pointerType: 'touch',
			clientX,
			clientY,
			button: 0,
			bubbles: true,
			cancelable: true
		})
	);
}

function touchMove(el: HTMLElement, points: Array<[number, number]>) {
	const touches = points.map(
		([clientX, clientY], i) => new Touch({ identifier: i, target: el, clientX, clientY })
	);
	const event = new TouchEvent('touchmove', {
		cancelable: true,
		bubbles: true,
		touches,
		targetTouches: touches,
		changedTouches: touches
	});
	el.dispatchEvent(event);
	return event;
}

describe('createCardDrag touch gesture', () => {
	let el: HTMLElement;
	let onStart: ReturnType<typeof vi.fn>;
	let onEnd: ReturnType<typeof vi.fn>;
	let cleanup: (() => void) | void;

	beforeEach(() => {
		el = document.createElement('div');
		document.body.appendChild(el);
		onStart = vi.fn();
		onEnd = vi.fn();
		cleanup = createCardDrag({ onStart, onEnd }).attach(el);
	});

	afterEach(() => {
		cleanup?.();
		el.remove();
		vi.useRealTimers();
	});

	it('swallows finger drift during the hold so the browser cannot start a scroll', () => {
		pointerDownTouch(el, 100, 100);
		const event = touchMove(el, [[103, 104]]); // < TOUCH_MOVE_TOLERANCE
		expect(event.defaultPrevented).toBe(true);
		expect(onStart).not.toHaveBeenCalled();
	});

	it('hands the gesture to native scroll once the finger clearly moves', () => {
		pointerDownTouch(el, 100, 100);
		const scroll = touchMove(el, [[100 + TOUCH_MOVE_TOLERANCE + 5, 100]]);
		expect(scroll.defaultPrevented).toBe(false);
		expect(onStart).not.toHaveBeenCalled();

		// The pending drag is abandoned: later moves stay un-prevented too, so scrolling is smooth.
		const later = touchMove(el, [[220, 100]]);
		expect(later.defaultPrevented).toBe(false);
	});

	it('commits a drag after the hold and then cancels the pan on every move', () => {
		vi.useFakeTimers();
		pointerDownTouch(el, 100, 100);
		vi.advanceTimersByTime(TOUCH_HOLD_DELAY + 20);

		expect(onStart).toHaveBeenCalledTimes(1);
		const dragMove = touchMove(el, [[150, 130]]);
		expect(dragMove.defaultPrevented).toBe(true);
	});

	it('ignores multi-touch while pending so pinch-zoom still works', () => {
		pointerDownTouch(el, 100, 100);
		const pinch = touchMove(el, [
			[100, 100],
			[160, 160]
		]);
		expect(pinch.defaultPrevented).toBe(false);
		expect(onStart).not.toHaveBeenCalled();
	});
});
