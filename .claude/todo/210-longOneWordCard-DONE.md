> Run with: Opus 5.5 / high
> Machine: mac

# Long one word card title

## Original Requirement

[NEVER REMOVE]

Shall be cut so it doesn't go outside card area

_From Kanban card `31a47bf6-8fe2-46f1-a0b4-e26195c4120e`, moved to the agent list._

_GitHub issue #210 — end the commit subject with `(#210)`._

## Results

**Summary** — A card title that is one long unbroken word used to run out of the card on the
board (measured 605px past the edge). The card title `<h3>` and its content preview `<p>` in
`TodoItem.svelte` now use `overflow-wrap: anywhere` (Tailwind `[overflow-wrap:anywhere]`), so a
long word breaks onto the next line inside the card. Normal titles look the same: the text
column was already `min-w-0 flex-1`, so only words wider than the card are affected. The full
title is still shown (wrapped, not cut off with "…").

**Files changed**
- modified `src/lib/components/todo/TodoItem.svelte` — wrap long words in card title + preview
- created `e2e/todo-long-title.spec.ts` — creates a temp list on the test board, adds a card
  with a ~130-char one-word title, checks the title has no horizontal overflow and stays inside
  the card, then deletes the list
- modified `package.json` / `package-lock.json` — 0.27.0 → 0.27.1

**Verification**
- `npm run check` — 0 errors, 0 warnings
- Unit tests (`vitest --run`) — 42 files, 426 tests pass
- New e2e `todo-long-title.spec.ts` (signed in as the test user) — passes with the fix; without
  the fix it fails (`scrollWidth − clientWidth` = 605px), so it does catch the bug
- Full `npm test` e2e — 33 tests in other specs (authenticated / logout / todo-functionality /
  unauthenticated) fail. They also fail on the untouched code (`authenticated.spec.ts` fails the
  same way without this change: strict-mode `getByRole('textbox')` matches 2 elements, plus
  visibility timeouts), so they are old breakage, not caused by this change.
  `todo-drag-reorder.spec.ts` passes.
- prettier / eslint clean on the changed lines (the 3 eslint `no-navigation-without-resolve`
  errors in `TodoItem.svelte` were already there)

**Deviations** — Wrapped the long word rather than cutting it off with an ellipsis, so the whole
title stays readable. Also applied the same wrapping to the content preview line under the
title. Three temp lists left by early runs of the new spec were deleted from the test board.
