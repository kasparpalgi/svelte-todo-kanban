> Run with: Opus 5.5 / high
> Machine: mac

# Board poll can overwrite an in-flight card reorder

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Board poll can overwrite an in-flight card reorder

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #212. `todo-drag-reorder.spec.ts › reorders a card to the top with a mouse drag`still failed about 1 in 26 runs after the spec was fixed. Each time the drop looked complete in the UI, but the list came back in its pre-drag order.

Suspected cause (not yet proven): `refreshBoardTodosIfChanged` → `refreshBoardTodos` in `src/lib/stores/todos.svelte.ts` replaces `state.todos` with the server's copy, even while `updateTodo(sort_order)` writes from a drag or Ctrl+Arrow move are in flight. If a poll (30 s, or on visibilitychange) fetches before those writes commit and lands after the optimistic update, the card jumps back to where it was until the next poll. Parallel e2e workers change the board fingerprint all the time, so they hit this more often than real use does.

Confirm the race (for example, delay one `updateTodo` response in a unit test while a refresh resolves). If it is real, skip or merge a refresh while card writes are pending, the way `pendingCreates` already guards creates. Then run the drag spec with `--repeat-each=20`.

*GitHub issue #223 — end the commit subject with* `(#223)`*.*

_From Kanban card `5018cc13-db8a-475a-8552-05fa9e223920`, moved to the agent list._

_GitHub issue #223 — end the commit subject with `(#223)`._

## Results

**Summary** — Race confirmed and fixed. A unit test showed that
`refreshBoardTodosIfChanged` → `refreshBoardTodos` replaced `state.todos` with the server's
pre-write rows in two cases: (a) a `sort_order` write was still in flight when the poll
landed, and (b) the poll's fetch started before a write committed and landed after it. The
store now counts single-card writes (`trackWrite` around the CREATE/UPDATE/DELETE requests
in `addTodo`, `updateTodo` and `deleteTodo`). A refresh that lands while a write is pending,
or after a write started during its fetch, is dropped. It returns `false`, so the fingerprint
isn't recorded and the next poll refreshes.

The e2e spec used one module-level `stamp`, so every `--repeat-each` run in a worker
shared one list name, and one failed cleanup broke the next run. The list is now named per
run in `beforeAll`.

**Files changed**
- modified `src/lib/stores/todos.svelte.ts`: `trackWrite`, plus the guard in `refreshBoardTodos`
- modified `src/lib/stores/__tests__/todosConcurrency.svelte.test.ts`: 2 race tests (both failed before the fix)
- modified `e2e/todo-drag-reorder.spec.ts`: list and card names unique per repeat
- modified `package.json` / `package-lock.json`: 0.27.4 → 0.27.5
- created `.claude/todo/225-boardBlanksDuringE2e.md` (Backlog follow-up)

**Verification**
- `npm run check`: 0 errors, 0 warnings
- `npm test`: 435/435. One run had `client-ssr.test.ts` fail under full-suite load; it passes on its own and on the rerun.
- e2e `todo-drag-reorder.spec.ts --repeat-each=20`, run 4 times (4 workers, shared test board):
  - mouse drag: 77/80
  - Ctrl+ArrowDown: 79/80
  - last two runs: 41/41 each
  - The 4 failures: a duplicate list name (fixed in the spec), the whole board rendering blank, quick-add Enter ignored, and one drop that left `Bravo` first (snapshot taken after cleanup, so the cause is unknown). They are filed as #225.

**Deviations** — Creates and deletes are guarded too, not just reorders: a stale poll could
also drop a just-created card or bring back a just-deleted one. The drag spec still isn't
100% at `--repeat-each=20`; the remaining failures are filed as follow-up #225.
