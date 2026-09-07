# Drag'n'drop crap

## Original Requirement

[NEVER REMOVE]

In task 154 the drag'n'drop was already tried to be fixed but still terrible compared to  ../../CodeNew/timetrack

Maybe slightly better compared before 154 on mobile but worse on desktop. When drag'n'drop to empty list - not working always etc. May unconfortable things. Plan full from scratch refactor and make the card draggale from anywhere not just handler. Proper. Like Trello. Create followup todo(s) if too big for one session.

_From Kanban card `951ba857-ccf1-4cfa-9e97-cb85420071a0`, moved to the agent list._

## Investigation

Current implementation is a custom pointer-events drag system:
- `TodoKanban.svelte` — owns `draggedTodo`/`dropTarget` state, global pointermove/up/cancel listeners, `elementsFromPoint`-based drop-target detection, auto-scroll near board edges, and the reorder/move mutation logic on drop.
- `KanbanColumn.svelte` — renders cards, drop-indicator line, empty-list placeholder (no drop indicator shown for empty lists — one of the "not working" symptoms).
- `TodoItem.svelte` — drag can **only** be started from a small `GripVertical` handle button (`onpointerdown` on that one button). Rest of card is wrapped in an `<a>` for navigation to the todo detail page.
- `DragHandle.svelte` + `DragHandleProps` type — dead code, not imported anywhere except itself. Removing.

A true from-scratch rewrite onto a dedicated DnD library (e.g. sortable/dnd-kit-style) is a much bigger, higher-risk change (new dependency, full interaction-model rewrite, needs extensive manual browser testing on real touch devices) than fits safely in one non-interactive session. Splitting into:

1. **This session**: make the whole card draggable (not just the handle), fix missing empty-list drop indicator, keep the existing (already reasonably solid) drop-target/auto-scroll/reorder logic in `TodoKanban.svelte`.
2. **Followup todo** (created below) for deeper polish: drag preview/ghost element, keyboard-accessible reordering, smoother mobile long-press tuning after real-device testing, possible library-based rewrite.

## Plan (this session)

- `TodoItem.svelte`: replace the grip-handle-only `pointerdown` drag trigger with a card-wide trigger that:
  - ignores clicks on real interactive elements (delete/edit/checkbox buttons, the GitHub link) so those keep working,
  - starts immediately past a small movement threshold for mouse/pen,
  - uses a short long-press delay (with movement tolerance) for touch, so page/board scrolling on mobile still works when the user is actually trying to scroll, not drag — this is the Trello-like "anywhere is a handle" behavior.
  - suppresses the subsequent `<a>` click/navigation only when a drag actually happened.
- Turn the `GripVertical` icon into a purely visual affordance (no longer the exclusive drag trigger).
- Delete dead `DragHandle.svelte` component + `DragHandleProps` type (unused).
- `KanbanColumn.svelte`: show the drop-indicator styling on the empty-list placeholder too, so dropping into an empty list gives visible feedback (the underlying drop-target math already handles it — this was a display-only gap).
- Manual verification: `npm run check`, then exercise drag reorder within a list, across lists, into an empty list, and plain-click-to-open-card still works, via browser.

## Log

- Read current implementation across TodoKanban/KanbanColumn/TodoItem/DragHandle.
- Confirmed DragHandle.svelte + DragHandleProps are dead code (only self-referencing).
- Implemented card-wide drag trigger with mouse-threshold / touch-long-press activation in
  `TodoItem.svelte`: `handleCardPointerDown`/`handleCardPointerMove`/`endLocalDrag` now live on
  the card's outer wrapper div instead of the grip button. Mouse activates a drag past a 6px
  movement threshold; touch/pen waits a 180ms long-press (cancelled if the finger moves past
  10px first, so board/page scrolling on mobile keeps working). `isInteractiveTarget()` skips
  drag-start when the pointerdown lands on a real button/link/input so delete, edit, the
  complete-checkbox and the GitHub link are unaffected. `suppressNextClick` prevents the
  card's wrapping `<a>` from navigating to the todo detail page when a drag actually happened,
  while a plain tap still opens it. The `GripVertical` icon is now a purely visual affordance
  (`aria-hidden` div, no handlers) rather than the exclusive handle.
- `KanbanColumn.svelte`: empty-list placeholder now gets a highlighted ring/background when
  it is the active drop target — the drop-target math already worked for empty lists, this
  was a missing visual-feedback gap that likely explained the "not working always" perception.
- Deleted dead `DragHandle.svelte` + unused `DragHandleProps` type from `types/todo.ts`.
- `npm run check`: same 9 pre-existing errors/4 warnings as a `git stash` baseline (all in
  unrelated files — `api/og-image/+server.ts`, `charts/Line.svelte`,
  `TodoFiltersSidebar.svelte`), none in files touched by this task.
- `npx vitest run --project=server`: 163/163 pass. The `client` (browser) test project and
  `npm run test:e2e` could not run in this environment — Playwright's cached Chromium build
  (`chromium_headless_shell-1187`/`1228`) doesn't match the version vitest-browser wants
  (`1193`); this is a pre-existing environment gap (also called out in task 161's log), not
  something this task introduced. `npx playwright install` would fix it for a future session.
- Could not do live browser drag-and-drop verification end-to-end: the app requires signed-in
  auth (no dev/test login shortcut found) and the Chrome extension (claude-in-chrome) wasn't
  connected in this environment either. Verified the interaction logic by careful code reading
  instead. **Flagging this as unverified in a real browser — recommend the user click-test drag
  reorder (same list, across lists, into an empty list) and plain-click-to-open on both desktop
  and a real mobile device before considering this fully done.**
- Filed followup `.claude/todo/164-dragNDropPolish.md` for the deeper polish this session
  intentionally left out (drag ghost/preview element, keyboard-accessible reordering, tuning
  the long-press timings against real touch devices, evaluating a proper DnD library instead
  of the hand-rolled pointer-events system).

## Status

Renamed to `-DONE` since the scoped plan above is implemented and checks/unit-tests pass, but
see the unverified-in-browser note above — this is code-review-level confidence, not
click-tested confidence.
