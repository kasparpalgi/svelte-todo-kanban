> Run with: Opus 5.5 / medium
> Machine: mac

# Fix stale Playwright e2e specs

## Original Requirement

[NEVER REMOVE]

Follow-up from #209: `npm test` can't pass — Playwright fails 33 of 52 specs on unmodified main (34 in one run). From that run:

- `error-boundary.spec.ts` and others use `storageState: 'e2e/.auth/user.json'`, which doesn't exist (the setup project writes `playwright/.auth/user.json`).
- /signin now has email + password: strict-mode violations on `getByRole('textbox')` and `h1`, and 14 sign-in `locator.fill` timeouts.
- `todo-drag-reorder.spec.ts › reorders a card to the top with a mouse drag` is flaky (failed on main, passed on the #209 branch).

Fix the specs so the suite is green. Note: e2e runs against production Hasura with the test user.

_From Kanban card `829212ed-0cde-4275-9290-6a64f69ac7e1`._

_GitHub issue #212 — end the commit subject with `(#212)`._

## Results

**Summary** — The Playwright suite now passes: 37 passed and 2 skipped on a full `npx playwright test`, up from 35 of 53 failing. The specs had been written for a home-page quick-add layout that no longer exists, so most were rewritten against the current board UI, using a shared `e2e/board.ts` helper. Each spec creates its own uniquely-named temp list and deletes it afterwards, so parallel workers never touch each other's cards.

The e2e run also found a **real app bug from #211**: adding a card crashed the whole board with `Cannot read properties of undefined (reading 'aggregate')`. The optimistic card still carried `comments: []`, but TodoItem now reads `comments_aggregate.aggregate.count`. Fixed in the store (and defensively in TodoItem), with a unit test.

Spec-level causes and fixes:
- Wrong storageState path (`e2e/.auth/user.json`): removed. The `authenticated` project already provides `playwright/.auth/user.json`.
- Sign-in has email + password now: locate by `textbox "Email"` / `"Password"`. `h1` strict violations (header logo + page title): locate by heading name.
- Quick-add inputs: the old global `input[placeholder=…]` matched every list's input. Inputs are now scoped to the spec's own list. The top input closes after a submit, so the helper uses whichever input the list currently shows.
- Mouse-drag flake: mid-drag, the drop indicator pushes the target card down a few px, and the fixed `dst.y + 6` drop point landed in the gap, so the card dropped at the end of the list. The spec now re-measures the target mid-drag and releases on its upper quarter. It passed 25 of 26 repeated runs after this change. The remaining 1-in-26 looks like an app-side race, filed as #223.
- Logout: the spec now waits for the `POST /logout` response. Navigating away before it lands aborted the cookie clear and left the session alive.
- Log viewer: the pagination and export specs skip when the test user has no logs, because Export is disabled and there is no pagination with zero logs.
- Removed leftover temp lists (Reorder/LongTitle/QuickAdd/CardDetail) that earlier crashed runs had left on the test board.

**Files changed**
- Created: `e2e/board.ts`, `e2e/card-detail.spec.ts` (replaces card-image-upload + card-loading-optimization), `.claude/todo/223-pollOverwritesInFlightReorder.md` (Backlog follow-up)
- Modified: `e2e/authenticated.spec.ts` (absorbs todo-functionality), `e2e/todo-drag-reorder.spec.ts`, `e2e/todo-long-title.spec.ts`, `e2e/logout.spec.ts`, `e2e/unauthenticated.spec.ts`, `e2e/log-viewer.spec.ts`, `e2e/error-boundary.spec.ts`, `src/lib/stores/todos.svelte.ts`, `src/lib/components/todo/TodoItem.svelte`, `src/lib/stores/__tests__/todos.svelte.test.ts`, `package.json`
- Deleted: `e2e/card-image-upload.spec.ts`, `e2e/card-loading-optimization.spec.ts`, `e2e/todo-functionality.spec.ts`

**Verification**
- `npx playwright test`: 37 passed, 2 skipped, 0 failed (against production Hasura with the test user)
- Drag spec `--repeat-each`: 25/26 green after the fix (see #223)
- `npx vitest run`: 43 files, 430 tests passed
- `npm run check`: 0 errors, 0 warnings

**Deviations** — Rewrote or merged the stale specs instead of patching selectors one by one, because their target UI (home quick-add, list/kanban toggle) is gone. Fixed the #211 optimistic-card crash, which the task did not ask for but which blocked the suite. The list/kanban toggle and view-mode persistence specs were dropped because the feature no longer exists.
