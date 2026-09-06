/** @file src/lib/utils/cardDrag.svelte.ts */
import { browser } from '$app/environment';
import type { Attachment } from 'svelte/attachments';
import {
	TOUCH_HOLD_DELAY,
	isInteractiveTarget,
	pointerKind,
	shouldActivateMouseDrag,
	shouldCancelTouchHold
} from './cardDrag';

export interface CardDragOptions {
	/** Fires once the pointer/finger has committed to a drag. */
	onStart: () => void;
	/** Fires when a committed drag is released or cancelled. */
	onEnd: () => void;
	/** Return true to ignore pointers entirely (e.g. the card is in edit mode). */
	isDisabled?: () => boolean;
	/** The card's own link — clicks on *other* links must not start a drag. */
	getCardLink?: () => Element | null | undefined;
}

/**
 * Pointer-driven card dragging.
 *
 * Mouse drags start after a few pixels of travel; touch drags start after a short hold so
 * that swiping over a card still scrolls the board. Once a touch drag is committed we have
 * to cancel the browser's own pan gesture, and the only thing that does that is
 * `preventDefault()` on a cancelable `touchmove`. The listener therefore has to exist from
 * mount — registering it when the hold timer fires is too late, because by then Chrome has
 * already handed the gesture to the compositor and delivers non-cancelable touchmoves.
 */
export function createCardDrag(options: CardDragOptions) {
	const state = $state({ dragging: false, offsetX: 0, offsetY: 0 });

	let node: HTMLElement | null = null;
	let activePointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let activated = false;
	let suppressNextClick = false;
	let holdTimer: ReturnType<typeof setTimeout> | null = null;
	let lastClientX = 0;
	let lastClientY = 0;
	let scrollOrigin = { x: 0, y: 0 };

	/**
	 * Total scroll offset applied to an element by the window and every scrollable ancestor.
	 * The card is translated in viewport coordinates, so any scrolling that happens mid-drag
	 * (the board auto-scrolling sideways, the page auto-scrolling down) has to be added back
	 * in or the card slides out from under the finger.
	 */
	function scrollSnapshot(element: HTMLElement) {
		let x = window.scrollX;
		let y = window.scrollY;
		for (let p = element.parentElement; p; p = p.parentElement) {
			x += p.scrollLeft;
			y += p.scrollTop;
		}
		return { x, y };
	}

	function clearHoldTimer() {
		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}
	}

	function updateOffset() {
		if (!node) return;
		const scroll = scrollSnapshot(node);
		state.offsetX = lastClientX - startX + (scroll.x - scrollOrigin.x);
		state.offsetY = lastClientY - startY + (scroll.y - scrollOrigin.y);
	}

	function handleScroll() {
		if (activated) updateOffset();
	}

	function capturePointer(pointerId: number) {
		try {
			node?.setPointerCapture(pointerId);
		} catch {
			// The pointer may already be gone; the drag still works via bubbling.
		}
	}

	function activate(pointerId: number) {
		activated = true;
		state.dragging = true;
		if (node) scrollOrigin = scrollSnapshot(node);
		window.addEventListener('scroll', handleScroll, true);
		// Capture only once the drag is committed: capturing on pointerdown would retarget the
		// click that follows a plain tap away from the card's link, and the card would never open.
		capturePointer(pointerId);
		document.body.style.userSelect = 'none';
		options.onStart();
	}

	function handlePointerDown(event: PointerEvent) {
		if (options.isDisabled?.()) return;
		if (event.button === 2) return;
		if (isInteractiveTarget(event.target, options.getCardLink?.())) return;

		clearHoldTimer();
		activated = false;
		activePointerId = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		scrollOrigin = node ? scrollSnapshot(node) : { x: 0, y: 0 };
		state.offsetX = 0;
		state.offsetY = 0;

		if (pointerKind(event.pointerType) === 'touch') {
			holdTimer = setTimeout(() => {
				holdTimer = null;
				if (activePointerId === event.pointerId) activate(event.pointerId);
			}, TOUCH_HOLD_DELAY);
		}
	}

	function handlePointerMove(event: PointerEvent) {
		if (event.pointerId !== activePointerId) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;

		if (!activated) {
			if (pointerKind(event.pointerType) === 'mouse') {
				if (!shouldActivateMouseDrag(dx, dy)) return;
				activate(event.pointerId);
			} else {
				// Finger moved before the hold fired — that is a scroll, not a drag.
				if (shouldCancelTouchHold(dx, dy)) {
					clearHoldTimer();
					activePointerId = null;
				}
				return;
			}
		}

		event.preventDefault();
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		updateOffset();
	}

	function handlePointerEnd(event: PointerEvent) {
		if (event.pointerId !== activePointerId) return;
		clearHoldTimer();

		const wasDragging = activated;
		if (node?.hasPointerCapture(event.pointerId)) {
			node.releasePointerCapture(event.pointerId);
		}

		activePointerId = null;
		activated = false;
		state.dragging = false;
		window.removeEventListener('scroll', handleScroll, true);
		state.offsetX = 0;
		state.offsetY = 0;
		document.body.style.userSelect = '';

		if (wasDragging) {
			suppressNextClick = true;
			options.onEnd();
		}
	}

	/**
	 * The whole point of this listener: while a touch drag is committed, cancel the pan
	 * gesture so the board stops scrolling out from under the card.
	 */
	function handleTouchMove(event: TouchEvent) {
		if (!activated) return;
		if (event.cancelable) event.preventDefault();
	}

	function handleContextMenu(event: Event) {
		if (activated) event.preventDefault();
	}

	/**
	 * The card is wrapped in an `<a>`, which the browser treats as natively draggable. Left
	 * alone, Chrome starts an HTML5 link drag a few pixels in, steals the pointer capture and
	 * the card never moves — so the native drag has to go.
	 */
	function handleNativeDragStart(event: DragEvent) {
		event.preventDefault();
	}

	const attach: Attachment<HTMLElement> = (element) => {
		if (!browser) return;
		node = element;

		element.addEventListener('pointerdown', handlePointerDown);
		element.addEventListener('pointermove', handlePointerMove);
		element.addEventListener('pointerup', handlePointerEnd);
		element.addEventListener('pointercancel', handlePointerEnd);
		element.addEventListener('touchmove', handleTouchMove, { passive: false });
		element.addEventListener('contextmenu', handleContextMenu);
		element.addEventListener('dragstart', handleNativeDragStart);

		return () => {
			clearHoldTimer();
			element.removeEventListener('pointerdown', handlePointerDown);
			element.removeEventListener('pointermove', handlePointerMove);
			element.removeEventListener('pointerup', handlePointerEnd);
			element.removeEventListener('pointercancel', handlePointerEnd);
			element.removeEventListener('touchmove', handleTouchMove);
			element.removeEventListener('contextmenu', handleContextMenu);
			element.removeEventListener('dragstart', handleNativeDragStart);
			window.removeEventListener('scroll', handleScroll, true);
			if (state.dragging) document.body.style.userSelect = '';
			node = null;
		};
	};

	return {
		get dragging() {
			return state.dragging;
		},
		get offsetX() {
			return state.offsetX;
		},
		get offsetY() {
			return state.offsetY;
		},
		/** True once for the synthetic click the browser fires after a drag. */
		consumeClickSuppression() {
			if (!suppressNextClick) return false;
			suppressNextClick = false;
			return true;
		},
		attach
	};
}
