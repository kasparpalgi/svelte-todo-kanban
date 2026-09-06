/** @file src/lib/utils/cardDrag.ts */

/** Mouse has to travel this far before a click turns into a drag. */
export const DRAG_DISTANCE_THRESHOLD = 6;

/** How long a finger has to rest on a card before the drag takes over from scrolling. */
export const TOUCH_HOLD_DELAY = 180;

/**
 * How far a finger may drift during {@link TOUCH_HOLD_DELAY} and still count as a hold.
 * Deliberately larger than the mouse threshold: fingers are imprecise, and anything
 * beyond this is the user scrolling the board, not trying to pick a card up.
 */
export const TOUCH_MOVE_TOLERANCE = 14;

export type PointerKind = 'mouse' | 'touch';

/** Pointer types that get the immediate distance-based drag rather than a long press. */
export function pointerKind(pointerType: string): PointerKind {
	return pointerType === 'mouse' ? 'mouse' : 'touch';
}

export function distance(dx: number, dy: number): number {
	return Math.hypot(dx, dy);
}

/** A mouse drag starts as soon as the pointer leaves the click slop area. */
export function shouldActivateMouseDrag(dx: number, dy: number): boolean {
	return distance(dx, dy) > DRAG_DISTANCE_THRESHOLD;
}

/** A finger that moves this much before the hold timer fires is scrolling, not dragging. */
export function shouldCancelTouchHold(dx: number, dy: number): boolean {
	return distance(dx, dy) > TOUCH_MOVE_TOLERANCE;
}

/** Buttons, inputs and links other than the card link itself must keep their own behaviour. */
export function isInteractiveTarget(
	target: EventTarget | null,
	cardLink?: Element | null
): boolean {
	if (!(target instanceof Element)) return false;
	if (target.closest('button, [role="button"], input, textarea, select, [contenteditable]')) {
		return true;
	}
	const link = target.closest('a[href]');
	return !!link && link !== cardLink;
}

export type ScrollIntent = -1 | 0 | 1;

/**
 * Which way an axis should auto-scroll while a card is held near the edge of its container.
 * Returns -1 (towards the start), 1 (towards the end) or 0 (no scrolling).
 */
export function autoScrollIntent(
	position: number,
	start: number,
	end: number,
	hotZone: number
): ScrollIntent {
	if (end - start < hotZone * 2) return 0;
	if (position < start + hotZone) return -1;
	if (position > end - hotZone) return 1;
	return 0;
}
