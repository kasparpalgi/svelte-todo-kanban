# Drag'n'drop polish (followup to 163)

## Original Requirement

[NEVER REMOVE]

Split off from task 163 ("Drag'n'drop crap") — that task made the whole card draggable
(not just the grip handle) and fixed the missing empty-list drop indicator, but explicitly
deferred the deeper "make it as good as Trello" polish work since a full library-based
rewrite plus real-device tuning didn't fit safely in one non-interactive session.

_Original card requirement (from Kanban card `951ba857-ccf1-4cfa-9e97-cb85420071a0`):_
> In task 154 the drag'n'drop was already tried to be fixed but still terrible compared to
> ../../CodeNew/timetrack. Maybe slightly better compared before 154 on mobile but worse on
> desktop. When drag'n'drop to empty list - not working always etc. May unconfortable things.
> Plan full from scratch refactor and make the card draggale from anywhere not just handler.
> Proper. Like Trello.

## What's left

1. **Real-device verification of task 163's change.** It shipped without live browser
   testing (no dev/test login shortcut in this repo, and no browser automation tool was
   connected in that session). Before doing anything else here: click-test on desktop
   (Chrome/Firefox/Safari) and a real phone — drag within a list, across lists, into an
   empty list, plain single-tap still opens the card, and the long-press-then-drag timing on
   touch doesn't feel laggy or trigger accidentally while scrolling.
2. **Drag ghost/preview.** Trello shows a floating card preview under the cursor/finger and
   leaves a placeholder gap in the original spot. Current implementation just translates the
   dragged card itself (`translate: Npx Mpx`) and relies on `opacity-50` — works but is
   visually rougher than a dedicated drag layer would be.
3. **Tune the touch activation constants** (`TOUCH_HOLD_DELAY` = 180ms, `TOUCH_MOVE_TOLERANCE`
   = 10px, `DRAG_DISTANCE_THRESHOLD` = 6px for mouse, all in `TodoItem.svelte`) against
   feedback from real touch devices — these were chosen from general dnd-kit-style
   conventions, not measured against this app's actual card density/spacing.
4. **Keyboard-accessible reordering.** No keyboard path to reorder cards today. Consider
   arrow-key-based move-while-focused, or at minimum a "move to..." menu action as a
   non-pointer fallback.
5. **Consider a real DnD library** instead of the hand-rolled `elementsFromPoint` +
   pointer-events system in `TodoKanban.svelte`/`TodoItem.svelte`/`KanbanColumn.svelte` if
   the above tuning still doesn't feel solid. `@neodrag/svelte` (already a dependency, used
   in `NoteItem.svelte`) is a free-drag library, not a sortable-list one, so it would need
   real evaluation, not just importing what's already there — check Svelte-5 compatibility
   and touch support carefully before committing to a library swap.
6. Re-check `npm run test:e2e` / the `client` vitest project once the Playwright Chromium
   cache mismatch is fixed (`npx playwright install`) — flagged as a pre-existing environment
   gap in both task 161 and 163's logs, not fixed by either.

## Plan

**Primary bug (from the manual test below): touch drag activates but the finger scrolls the
board instead of moving the card.**

Root cause: nothing ever stops the browser's native pan gesture. `handleCardPointerMove`
calls `event.preventDefault()` on the *pointermove*, which does not cancel scrolling —
for touch, scrolling is cancelled only by `preventDefault()` on a **cancelable, non-passive
`touchmove`**. As soon as the finger moves, the compositor starts panning and Chrome fires
`pointercancel`, which runs `endLocalDrag` → the card snaps back and the board scrolls.

Two extra traps to avoid:
- The non-passive `touchmove` listener must be registered **before** `touchstart` (at mount),
  not when the long-press fires. Chrome decides at touchstart whether the region can be
  scrolled on the compositor fast path; a listener added mid-gesture gets `cancelable=false`
  touchmoves and its `preventDefault()` is ignored.
- Svelte's `ontouchmove` attribute may be registered passive, so the listener has to be
  attached manually with `{ passive: false }`.

### Steps

1. **Extract the pointer/drag logic out of `TodoItem.svelte`** (732 lines, way over the
   200–300 rule) into `src/lib/utils/cardDrag.svelte.ts` — a `createCardDrag()` factory
   used via a Svelte 5 `{@attach}`. Pure activation helpers go in `src/lib/utils/cardDrag.ts`
   so they are unit-testable in the node (`server`) vitest project.
2. **Fix the touch scroll bug** in that factory:
   - permanent non-passive `touchmove` listener that `preventDefault()`s while a drag is active,
   - `touch-action: none` on the card while dragging,
   - `contextmenu` suppressed while dragging (Android long-press selection/callout),
   - `-webkit-touch-callout: none` + `user-select: none` during drag.
3. **Drag ghost / placeholder** (item 2): stop dimming the moving card — render it at full
   opacity, tilted, with a big shadow, and draw a dashed placeholder in the gap it left.
4. **Auto-scroll while dragging** (needed now that native scrolling is blocked): keep the
   horizontal board auto-scroll but move it to `requestAnimationFrame`, and add **vertical
   window auto-scroll**, otherwise a touch drag can no longer reach off-screen lists/cards.
5. **Keyboard reordering** (item 4): `Ctrl/Cmd + Arrow` on a focused card — up/down reorders
   within the list, left/right moves it to the adjacent list. New `onMoveCard` callback
   threaded `TodoKanban` → `KanbanColumn` → `TodoItem`, with i18n'd sr-only hint.
6. **Touch constants** (item 3): keep the long-press at 180 ms but raise the pre-activation
   move tolerance so a scroll started from a card is not mistaken for a drag, and drop the
   mouse threshold logic into the tested pure helpers.
7. Tests + `npm run check` + server vitest; try `npx playwright install` for item 6.

Deliberately **not** doing item 5 (swap in a DnD library). The hand-rolled system is only
broken in one identifiable place (native scroll not cancelled); a library swap would be a
much larger, riskier change and `@neodrag/svelte` is a free-drag lib, not a sortable one.

## Log

**2026-09-06 — done.**

### Root cause of the reported mobile bug

Confirmed and fixed. Nothing in task 163's implementation ever cancelled the browser's own
pan gesture. `handleCardPointerMove` called `event.preventDefault()` on the *pointermove*,
which does nothing for scrolling — a touch pan is only cancelled by `preventDefault()` on a
cancelable `touchmove`. So the long-press committed the drag (hence the tilt the user saw),
the first finger movement handed the gesture to Chrome's compositor, Chrome fired
`pointercancel`, `endLocalDrag` ran, and the board scrolled instead.

Two more real bugs surfaced while verifying, both pre-existing:

- **Native link drag stole the gesture on desktop.** The card is wrapped in an `<a>`, which
  is natively draggable. A few pixels in, Chrome started an HTML5 link drag, fired
  `lostpointercapture`, and stopped delivering pointermoves — a fast mouse drag never
  activated. Fixed by `preventDefault()` on `dragstart`.
- **The card drifted out from under the finger whenever anything scrolled mid-drag.** The
  translate was a pure `client - start` delta, so board auto-scroll moved the card away from
  the pointer. Fixed by compensating for window + ancestor scroll (`scrollSnapshot`), plus a
  capture-phase `scroll` listener so the card keeps up while auto-scrolling with a still finger.

One thing tried and reverted: taking pointer capture on `pointerdown` (for robustness against
a single huge pointermove). It retargets the following `click` to the card `<div>`, so the
`<a>` is no longer in the target chain and a plain click stops opening the card. Capture is
taken on activation only, as before; the `dragstart` fix covers the robustness case.

### Changes

- **`src/lib/utils/cardDrag.ts`** (new) — pure, unit-tested helpers: activation thresholds,
  `isInteractiveTarget`, `autoScrollIntent`.
- **`src/lib/utils/cardDrag.svelte.ts`** (new) — `createCardDrag()` factory used via a Svelte 5
  `{@attach}`. Owns the whole pointer lifecycle: non-passive `touchmove` registered **at mount**
  (registering it when the hold timer fires is too late — Chrome has already committed the
  gesture to the compositor and delivers non-cancelable touchmoves), `dragstart` suppression,
  `contextmenu` suppression while dragging, `touch-action: none` + `-webkit-touch-callout: none`,
  and scroll compensation.
- **`TodoItem.svelte`** — uses the factory; 732 → 671 lines. Drag ghost (item 2): the moving card
  is now full-opacity, tilted and shadowed with a dashed placeholder in the gap it left, instead
  of a dimmed card. Dropped `transition-transform` during the drag — it was easing every
  translate by 150 ms, which is part of why dragging felt laggy. Added `Ctrl/Cmd + arrow`
  keyboard reordering (item 4) with `aria-keyshortcuts` and an sr-only hint.
- **`TodoKanban.svelte`** — auto-scroll moved from `setInterval(20ms)` to `requestAnimationFrame`
  and given a **vertical** axis. This is not optional any more: native panning is suppressed
  during a touch drag, so without it a card could never reach an off-screen list. Added
  `handleMoveCard` (keyboard reordering across positions and lists, with focus restored after
  the move).
- **`KanbanColumn.svelte`**, **`types/todo.ts`** — thread `onMoveCard` through.
- **Locales** (en/et/cs) — `todo.move_card_keyboard_hint`, `todo.card_moved_to`.
- **Touch constants (item 3)**: hold stays at 180 ms; `TOUCH_MOVE_TOLERANCE` 10 → 14 px, so a
  scroll started from a card is not mistaken for a drag on an imprecise finger.

### Verification

`npm run check`: 9 errors, 4 warnings — **identical to the baseline on a clean tree** (og-image
`Buffer`/`BodyInit` typings, a test mock, `charts/Line.svelte`); none in the files touched here.
Server vitest: **180/180 pass** (163 before + 17 new for `cardDrag.ts`).

Browser-verified in real mobile Chrome (Pixel 5 emulation, real CDP `Input.dispatchTouchEvent`
touches — not synthetic clicks) against a throwaway `/dev-dnd` route that mounted the real
`createCardDrag` module in a scrollable board. All seven scenarios pass:

1. long-press then slide 150 px left → card translates `-150px`, `board.scrollLeft` stays `0`
   (**before the fix: translate `none`, scrollLeft `135`** — the exact reported bug)
2. quick swipe without holding → board scrolls, no drag starts
3. plain tap → navigates to the card
4. mouse: no drag inside the 6 px slop, drags past it
5. plain desktop click → navigates
6. vertical finger drag → page does not scroll, card follows
7. board scrolled 200 px mid-drag → card stays under the finger (x: 30 → 30)

The throwaway route was deleted; the driver script is not committed.

### Not done, and why

- **Item 1 (real-device pass) is only partly closed.** The mobile bug is reproduced and fixed
  under real touch events in mobile Chrome, but not on physical iOS/Android hardware, and not
  end-to-end through the actual kanban board. Signing in would have meant forging an Auth.js
  session against the **live** Hasura backend and running real reorder mutations on the user's
  own board data — not something to do unasked. **Please do one pass on a real phone**;
  iOS Safari especially, since its long-press/callout behaviour is the least like Chrome's.
- **Item 5 (swap in a DnD library)** — deliberately skipped. The hand-rolled system had three
  identifiable bugs, all now fixed and covered; a library swap would be a much larger, riskier
  change, and `@neodrag/svelte` is a free-drag library, not a sortable-list one.
- **Item 6 is still open, for two reasons, neither fixable here:**
  1. `npx playwright install chromium` **hangs** in this environment — 30 minutes, 0 bytes
     downloaded, `chromium-1193` still a 624 KB stub. Not a cache mismatch; the download itself
     never starts. Workaround that does work: `channel: 'chrome'` uses the installed Google
     Chrome, which is how the verification above was run. Worth considering for
     `playwright.config.ts`.
  2. Even with a browser, **`e2e/auth.setup.ts` is stale**. It waits for an Auth.js
     `div.provider` block reading "Sign in with Test Login"; the signin page has since been
     redesigned and now renders only Google, email+password and magic link. The Test Login
     credentials provider is still registered server-side (`/auth/providers` lists id
     `166ca52b-…`), it just has no button any more — so e2e auth needs rewriting against the
     new page. Out of scope here.

### Incidental finding

`PUBLIC_FULL_CARD_DRAGGABLE` exists in `.env` (`"false"`) and `.env.test` with the comment
"true = full card (I have compute power); false = handle only (performance)", but **nothing in
`src/` reads it** — it is a dead flag. Task 163 made full-card dragging unconditional. Left
alone rather than wired up, since the manual test says the full-card behaviour is the wanted
one; delete the flag or implement it as a follow-up.

----

Manual test results: on computer pretty nice already but on mobile when I tap and hold the card it slighly goes tilt indicating it is droppable now bit now when I start sliding finder eg. to left then the card remains where it is and I start scolling to the left.