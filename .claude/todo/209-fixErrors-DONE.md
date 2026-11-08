> Run with: Opus 5.5 / xhigh
> Machine: dell

# Fix errors

## Original Requirement

[NEVER REMOVE]

See latest errors and fix them

_From Kanban card `7bc8ece2-375f-4c20-ac54-2de682a04ecd`, moved to the agent list._

_GitHub issue #209 — end the commit subject with `(#209)`._

---

## Plan

1. Pull production `logs` (warn/error) since the last error sweep (#206, 2026-10-02) via the Hasura admin API and group them.
2. Find the root cause of each actionable error class (code, not guesses); separate real bugs from expected/user outcomes.
3. Fix them, with tests where the bug is reproducible in a unit test.
4. `npm run check`, `npm test` (and `fallow`) green.
5. Log results here, commit to `main` with `(#209)`, push.

## Log

### 1. Production logs (2026-10-02 17:30 UTC → 2026-11-08, 6038 warn/error rows)

| Count | Level | Component / message | Root cause |
|---|---|---|---|
| 2737 / 692 / 570 | warn | GraphQLClient `Slow query: GetTodos/GetBoards/GetLists` | 80% from board `tekdok`: the 30 s poll re-downloads the **whole board with full `TodoFields`** — measured **2.3 MB / ~6.5 s** for its 334 active cards (comments 932 KB, content 812 KB), plus 200 completed. GetBoards/GetLists are tiny but share the pipe. |
| 457 | warn | `Slow mutation: UpdateTodos` | Drag/keyboard reorder sends one `UpdateTodos` (returning full `TodoFields`) **per card in the list**, in parallel — bursts of 100 at ~20 ms spacing — even for cards whose `sort_order` did not change. |
| 224 | error | ErrorBoundary `Unhandled promise rejection` | All 220 production rows have browser extension `pphgdbgldlmicfdkhondlafkiomnelnk` in the stack (its `fetch` wrapper leaves its own copy of the promise unhandled); 208/220 pair within 1 s with the network failure `request()` already logged. Sessions without the extension: 417 `Failed to fetch` logs, 0 unhandled. The other 4 are Playwright `evaluate` on localhost. |
| 256 | error | GraphQLClient `query/mutation failed: …` `Load failed` | Safari's wording for a network failure — not matched by the `network`/`fetch` check, so logged as **error** instead of warn. |
| 217 + 115 | warn/error | `mutation failed: CreateLog` | Feedback loop: a failed log flush is logged by `request()` → new `CreateLog` → fails too… 1 DB outage (3 failed queries 2026-10-05 22:48) produced 111 CreateLog error rows. Each flush also called `/api/auth/token` just to check sign-in. |
| 134 + 5 | error | `connection error` (postgres-error) / `database query error` | Hasura could not reach Postgres: 2026-10-05 22:48, 10-08 22:42, 10-09 18:30 (minutes each). Server-side outage, not app code — the noise it caused is the CreateLog loop above. |
| 436 | warn | `query failed: GetTodos/GetLists/GetBoards` `Failed to fetch` | Real transient network drops (`online: true`, 60 ms). Correctly warn-level since #206. |
| 207 | warn | `Slow token fetch` | p50 1.7 s, max 11.8 s on `/api/auth/token`. |
| 7 | error | `UpdateTodos` `invalid input syntax for type uuid: "temp-…"` | Editing a card before its optimistic insert returned (e2e on 2026-10-02) → `updateTodo` sent the placeholder id. Also `updateTodo` wrote the server row back to the index captured *before* the await — a poll replacing `state.todos` meanwhile overwrites a different card. |
| 3 | error | UserStore `Failed to update user` | `Load failed` / `Failed to fetch` — network, logged as error. |
| 4 | error | VoiceInput `audio-capture` | No microphone available — a device outcome like `not-allowed` (#206), not an app error. |

### 2. Fix plan
1. `src/lib/utils/networkError.ts`: one `isNetworkError()` (Chrome/Safari/Firefox wording, AbortError, never a GraphQL response) + `isExtensionStack()`; use in `client.ts`, `ErrorBoundary`, `UserStore`.
2. ErrorBoundary: network rejection → `debug` when an extension is in the stack (duplicate), `warn` otherwise.
3. Logger: `request()` never logs `CreateLog` failures; flush drops the `/api/auth/token` pre-check (`request()` already throws `AuthenticationError`); a re-queued log retries with backoff, max 3 attempts.
4. Board poll: cheap fingerprint query (ids + timestamps of todos/comments/labels/uploads/assignees/subscribers) → full refetch only when it changed (forced every 5 min as a safety net).
5. Reorder: only send `UpdateTodos` for cards whose `sort_order`/`list_id` actually changes.
6. `updateTodo`/`deleteTodo`: wait for a pending optimistic create (temp id → real id); re-find the index after the await.
7. VoiceInput `audio-capture` → info.

### 3. Verification of the two biggest causes (before fixing)
- **Unhandled rejections**: production chunk stack `…/chunks/BDrpiVIV.js:52:3276` maps (local build, same deps) to graphql-request's
  `yield fetch(url, init)`; above it in every production row sit `chrome-extension://pphgdbgl…/executors/200.js` and `libs/requests.js`
  (the extension's fetch wrapper), then SvelteKit's `window.fetch`. The app's own chain is handled (`request()` logs the warn).
- **Board poll payload** (as role `user`, production Hasura): active GetTodos 334 rows **2.25 MB / 6.6 s**, completed 187 rows
  **1.27 MB / 3.5 s**; the new fingerprint query 521 rows **171 KB / 0.5–0.7 s** (≈20× less, before gzip); GetLists 2.5 KB / 62 ms,
  GetBoards 41 KB / 179 ms.

### 4. Changes
- `src/lib/utils/networkError.ts` (new): `isNetworkError()` (Chrome/Safari/Firefox wording, AbortError; false when the error carries
  a server response) and `isExtensionStack()`.
- `src/lib/graphql/client.ts`: network classification via `isNetworkError()` → Safari `Load failed` is a warn now. `CreateLog`
  (`UNLOGGED_OPERATIONS`) logs neither slow nor failed — no more self-feeding loop.
- `src/lib/components/ErrorBoundary.svelte`: network rejection with an extension in the stack → `debug` (console only); other
  network rejection → `warn`; everything else stays `error` + error UI as before.
- `src/lib/stores/logging.svelte.ts`: removed the per-flush `/api/auth/token` pre-check (`request()` already throws
  `AuthenticationError`, which drops the log); a failed log is re-queued with `attempts` and retried after 30 s × attempts, at most
  5 attempts (before: re-queued forever and only retried when another log arrived). `LogEntry.attempts` added.
- `src/lib/stores/user.svelte.ts`: network failures of hydrate/update → warn.
- `src/lib/components/todo/VoiceInput.svelte`: `audio-capture` (no mic) → info, `network` → warn.
- `src/lib/graphql/documents.ts`: `GET_BOARD_TODOS_FINGERPRINT` (+ `npm run generate`: only the new query in generated files).
- `src/lib/stores/todos.svelte.ts`:
  - `refreshBoardTodosIfChanged(boardId)`: fingerprint → full `refreshBoardTodos()` only on a change, or when the last full refresh
    is older than 5 min (catches a comment edited in place, which the fingerprint can't see). `refreshBoardTodos` returns `boolean`.
  - Optimistic creates register in `pendingCreates`; `updateTodo` (sync fast path for normal ids), `deleteTodo`, `assignUser`,
    `unassignUser` wait for the real id instead of sending `temp-…`, and give up cleanly if the create failed.
  - `replaceTodo(id, …)`: every write-back after an await looks the card up by id (was a stale index → could overwrite another card).
- `src/routes/[lang]/[username]/[board]/+page.svelte`: poll/visibility/online refresh uses `refreshBoardTodosIfChanged`.
- `src/lib/utils/cardDrag.ts` `sortOrderChanges()` + `TodoKanban.svelte`: drag and Ctrl/Cmd+arrow reorder send `UpdateTodos` only for
  cards whose `sort_order` changes (the card changing list is always sent).
- fallow (failing on `main` too): un-exported local-only `draftPathFor` (`server/unqueue.ts`), removed a stale suppression in
  `documents.ts`.

### 5. Tests added
- `utils/__tests__/networkError.test.ts` (10), `cardDrag.test.ts` +3 `sortOrderChanges`.
- `stores/__tests__/todosConcurrency.svelte.test.ts` (5): temp-id edit waits for the real id; edit of a failed create isn't sent;
  write-back by id after the array was replaced; fingerprint skips/forces full refresh; 5-min forced refresh.
- `stores/__tests__/loggingRetry.test.ts` (3): backoff 30/60/90/120 s and stop after 5; no `/api/auth/token`; auth failure dropped.
- `graphql/__tests__/clientLogging.svelte.test.ts` (4): Chrome/Safari/Firefox network wording → warn; failed `CreateLog` not logged.
- `components/__tests__/ErrorBoundary.svelte.test.ts` (3): extension duplicate → debug; app network failure → warn; real bug → error.

### 6. Gates
- `npm run check`: **0 errors, 0 warnings**
- vitest (server + chromium): **39 files / 415 tests passed**
- `npx fallow`: **exit 0** (`main` exits 1: 2 dead-code issues); clone groups 73 → 72; health findings 328 → 327
- e2e (Playwright, against production Hasura with the test user): **19 passed / 33 failed**. Baseline on unmodified `main`
  (scratch worktree, same session): **18 passed / 34 failed** — the same 33 plus
  `todo-drag-reorder.spec.ts › reorders a card to the top with a mouse drag` (top card stayed "Bravo"), which passes with this change.
  So no regressions. The 33 are pre-existing harness/spec rot: missing `e2e/.auth/user.json` (6), strict-mode clashes on /signin
  (email + password textboxes, two `h1`s), `locator.fill` timeouts while signing in (14).

## Results
- What changes in the logs: Safari network drops → warn (−256 error rows/5 wk); extension duplicates → console only (−220);
  no CreateLog self-logging (−332, and no amplification during a DB outage); UserStore/VoiceInput outcomes → warn/info.
- Real bugs fixed: edits/deletes/assignments on a just-created card sent its `temp-…` id; write-backs after an await used a stale
  index (could overwrite a different card); reorder fanned out one request per card; failed logs were retried only when
  another log came in.
- Load: the 30 s poll / tab focus now fetches ~170 KB fingerprint and the 3.5 MB board only when something changed (or every 5 min).
- Known / follow-ups (not done here):
  - The 3 Postgres `connection error` windows (2026-10-05 22:48, 10-08 22:42, 10-09 18:30 UTC) are a Hasura↔Postgres outage on the
    server — worth checking the DB host's logs/connection limits.
  - The full board query is still 3.5 MB when it does run (comments + content of every card); a lighter list fragment with comments
    loaded on card open would cut it further.
  - `comments.updated_at` has no trigger, so a comment edited in place by someone else shows within the 5-min full refresh, not 30 s.
  - `Slow token fetch` (p50 1.7 s on `/api/auth/token`) is untouched; the logger no longer calls it per flush.
  - The 33 stale e2e specs above.

## Follow-ups created (2026-11-08)
- **server** repo: `.claude/todo/031-todzzPostgresOutagesOn.md` + Server board › Backlog card `da6477fd` — the three
  Postgres outages on the Hetzner CapRover box (OOM link, memory limit, a probe that catches "Hasura up, Postgres down").
- **#211** `211-lightBoardQueryLoad.md` — light board fragment, comments/content on card open, `comments.updated_at` trigger.
- **#212** `212-fixStalePlaywrightE2e.md` — the 33 stale e2e specs (+ the flaky drag test).
- **#213** `213-speedUpAuthToken.md` — `/api/auth/token` p50 1.7 s.
All three are Todzz board › Backlog cards (auto model/effort), not queued for the runner.
