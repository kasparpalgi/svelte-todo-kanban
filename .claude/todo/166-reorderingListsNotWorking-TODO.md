# Reordering lists not working

## Original Requirement

[NEVER REMOVE]

make it work

_From Kanban card `a4520c40-ce2d-4e38-ace1-c3834dedc0d8`._

_GitHub issue #166 — end the commit subject with `(#166)`._

## Plan

Root cause found: `src/lib/components/listBoard/ListManagement.svelte` (the "manage
lists" modal, opened via `actionState.edit === 'showListManagement'`) renders a
`GripVertical` icon next to every list row implying it's a drag handle, but no drag
logic was ever wired up — no `draggable`, no drag/drop handlers, nothing that touches
`sort_order`. There is also no reordering UI anywhere else for lists (columns on the
kanban board itself are rendered in a plain `#each` with no drag support). So "make it
work" = implement drag-to-reorder for lists in this modal, persisting the new order via
`listsStore.updateList(id, { sort_order })`.

Approach: native HTML5 drag-and-drop on each list row (modal context, not touch-drag
critical like cards), following the existing `updateList` optimistic-update pattern
already in `listsStore`. On drop, recompute sort_order for all affected rows in the
current board's list and persist each via `listsStore.updateList`.

## Actions Log

- Investigated `listsStore.updateList`, `TodoKanban.svelte`/`KanbanColumn.svelte` (card
  reordering, for reference pattern) and `ListManagement.svelte` (found the dead grip
  handle).
- Implemented native HTML5 drag-and-drop reordering on the list rows in
  `ListManagement.svelte`: `draggable`, `dragstart/dragover/dragleave/drop/dragend`
  handlers, drop-target/dragging visual state, and `listsStore.updateList(id,
  { sort_order })` persisted for every row in the affected board's list on drop
  (store already does optimistic update + rollback on failure).
- `npm run check`: 9 pre-existing errors/4 warnings, none in the touched file — clean.
- `npm test`: fails at collection with a pre-existing/unrelated environment issue
  (missing Playwright `headless_shell` browser binary — `npx playwright install` not
  run in this environment), not caused by this change.
- Done. Committing to `main` per project rules.
