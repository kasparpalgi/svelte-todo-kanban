> Run with: Opus 5.5 / high
> Machine: mac

# Board query: send the board once, not on every card

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Board query: send the board once, not on every card

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #211.

After #211 the tekdok board load (349 active + 188 completed cards) is 669 KB + 380 KB. The biggest remaining field is `list { board { … github settings user { claude_plan … } } }`inside `TodoFields`: the same board JSON repeated on every card — 193 KB of the 669 KB. `content_preview` (first 300 chars) is next at 104 KB.

- Drop `list.board` from `TodoFields`; read the board from `listsStore` (it already holds the boards) where code uses `todo.list.board` — the filter (`todoFiltering`), GitHub sync in `todos.svelte.ts`, `CardCostBadge` (claude plan), and anything else `npm run check`flags once the field is gone.
- Consider trimming `content_preview` to \~150 chars if the card preview still reads the same.

Measure before/after on tekdok the same way #211 did (GetTodos as the board owner).

*GitHub issue #222 — end the commit subject with* `(#222)`*.*

_From Kanban card `41192e33-10e1-4e81-84b2-c750909f1657`, moved to the agent list._

_GitHub issue #222 — end the commit subject with `(#222)`._

## Results

**Summary** — Cards no longer carry their board. `TodoFields` now asks only `list { id name sort_order board { id } }`;
the board (GitHub, settings, owner's Claude plan) is read once from `listsStore` through a new
`listsStore.boardById(id)` (selected board first, so a viewed public board is found too, then the
switcher boards, then archived). `BoardFields.user` gained `claude_plan`, `claude_plan_monthly` and
`claude_plan_currency` for `CardCostBadge`. Every reader of the old fields was moved over: GitHub sync,
the draft-file write after create and the delete sync in `todos.svelte.ts`, the comment add/delete
GitHub sync in `comments.svelte.ts` (these were `any`-typed, so `npm run check` would not have flagged
them), `CardCostBadge` and `CardDetailView` (task-file link, model/effort and hour-tracking toggles).
The filter and other `board.id` readers keep working unchanged because `board { id }` stays.

`content_preview` is now 150 characters (migration `1812000000000_shorter_content_preview`). On all 537
tekdok cards, the card face (`shortenText(toPlainText(…))`) is identical at 150 and 300. At 100, one card
would change.

**Measured on tekdok** — GetTodos as the board owner, active + completed, as `refreshBoardTodos` runs it
(same headers and variables as #211):

| | active (349) | completed (188) | total | `list` | `content_preview` |
| --- | --- | --- | --- | --- | --- |
| before | 670 KB | 381 KB | 1051 KB | 295 KB | 145 KB |
| after | 473 KB | 278 KB | 751 KB (−29 %) | 68 KB | 77 KB |

**Files changed**
- Created: `hasura/migrations/default/1812000000000_shorter_content_preview/{up,down}.sql`
- Modified: `src/lib/graphql/documents.ts` (+ generated), `src/lib/stores/listsBoards.svelte.ts`,
  `src/lib/stores/todos.svelte.ts`, `src/lib/stores/comments.svelte.ts`,
  `src/lib/components/todo/CardCostBadge.svelte`, `src/lib/components/todo/CardDetailView.svelte`,
  tests `todos.svelte.test.ts`, `todoFiltering.svelte.test.ts`, `listsBoards-archive.test.ts`,
  `package.json` (0.27.6)

**Verification**
- `npm run check`: 0 errors, 0 warnings
- `vitest run` (all projects): 44 files, 436 tests pass. New: `boardById` finds a viewed public board
  and returns undefined for unknown/null ids. The draft-file test now gets the board's GitHub from
  `listsStore`. Playwright e2e was not run (stale suite, #212).
- Svelte autofixer on `CardCostBadge`: no issues. Its one suggestion is about the existing `$effect`
  that loads the month cost, which this task didn't change.
- Migration applied to the live Hasura by version only (`--version 1812000000000`). It is a
  `CREATE OR REPLACE` of the preview function and is safe for the code currently deployed.
- Live check on the dev server, signed in as the test user, with a temporary list and card on
  `tests-board` (deleted afterwards). The card face showed the shortened preview. The open card
  showed model/effort. After the board's `enable_hour_tracking` was switched on, a reload showed the
  hour-estimate section, so the setting now comes from `listsStore`. The setting was switched back off.
- `users` select permissions: role `user` already has the `claude_plan*` columns. `anonymous` can't
  read boards at all, so adding them to `BoardFields` changes nothing for anonymous viewers.

**Deviations**
- `list.board { id }` is kept instead of dropping `list.board` entirely. It costs about 50 bytes a card
  (same as `board_id`) and keeps the many `todo.list.board.id` readers (filter, kanban, labels,
  assignees, subscribers) unchanged. The 193 KB was the repeated GitHub/settings/owner JSON, which is gone.
