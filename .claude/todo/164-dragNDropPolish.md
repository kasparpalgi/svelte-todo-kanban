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

## Log

_Not started — filed as a followup by task 163._

----

Manual test results: on computer pretty nice already but on mobile when I tap and hold the card it slighly goes tilt indicating 