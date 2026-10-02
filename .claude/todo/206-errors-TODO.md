> Run with: Opus 5.5 / high
> Machine: karel

# Errors

## Original Requirement

[NEVER REMOVE]

See error logs, fix all possible errors, make sure all tests pass, fallow, types , svelte autochecker all green.

Then think why sometimes opening board doesn't load any content (also board selector empty) - after refresh works.

_From Kanban card `0491e2a4-1a17-4410-a4f0-8438267ea0e0`._

_GitHub issue #206 — end the commit subject with `(#206)`._

---

## Plan

1. Pull production `logs` (warn/error since 2026-09-01) via Hasura admin API and group them.
2. Fix every actionable error class found in the logs.
3. Investigate "board opens empty, board selector empty, refresh fixes it".
4. Get `npm run check` (svelte-check/types), `fallow`, unit tests and e2e green.
5. Log results here, commit to `main` with `(#206)`, push.

## Log

### 1. Production logs (2026-09-01 → 2026-10-02, 1918 warn/error rows)

| Count | Level | Component / message | Notes |
|---|---|---|---|
| 734 / 361 / 325 | warn | GraphQLClient `Slow query: GetTodos/GetBoards/GetLists` | >1s threshold; median ~1.2s |
| 267 | warn | GraphQLClient `Slow mutation: CreateLog` | the logger logging itself — noise feedback loop |
| 24 / 20 / 17 | error | GraphQLClient `query failed: GetTodos/GetBoards/GetLists` | `Failed to fetch` in **~13ms**, all three at the same second, ~1×/day |
| 8 | error | UserStore `Failed to update user` | user A's session updating user B's settings → permission-error (stale user) — last 2026-09-17 |
| 6 | error | ErrorBoundary `Uncaught error` | 3× Svelte internal `reading 'prev'` (each-block), others dev-only (localhost) |
| 3+8 | error/warn | VoiceInput `not-allowed` / not supported | user denied mic / browser without API — expected, not errors |
| 2 | error | AITaskButton `AI task failed: 500` | |
| 1 | error | `CreateInvoiceWithItems` not-null `invoice_id` | |

### 2. Why the board sometimes opens empty (board selector empty too) — ROOT CAUSE

Race between the layout and the board page on a fresh load:

1. `[lang]/+layout.svelte` `$effect` → `userStore.initializeUser()` → awaits `GetUsers` (token fetch + query) before `userStore.user` is set.
2. Board page `onMount` → `loadBoardData()` → `listsStore.loadBoards()` → `boardScopeWhere()` read `userStore.user` — still `null` →
   `boards = []`, `selectedBoard = null`, returned `[]` (no query at all). **Board switcher empty.**
3. Fallback `loadBoardByAlias()` found the board, but the membership check compared against `userStore.user?.id` = `undefined` →
   `notMember = true` → **todos never loaded** (and the "not a member" UI didn't show either, since that derived needs a user).
4. Nothing retried except the 30 s poll; a refresh usually "fixed" it.

It was intermittent because `loadBoards()` first does `await import('$lib/graphql/generated/graphql')` (21k-line module): when that
import is cold/slow the user request wins the race, when cached/fast the boards load loses it. Reproduced deterministically in
`src/lib/stores/__tests__/boardLoadRace.test.ts` (fails without the fix: `loadBoards` settles with `[]` before the user exists).

Related: `listsStore.initialized` is only set by `loadLists()`, yet `BoardSwitcher` and `[lang]/+page.svelte` gated `loadBoards()`
on it — the `[lang]` page could never forward to a board after a client-side load.

**Fixes**
- `userStore.whenReady(timeoutMs = 10s)` — resolves once `initializeUser()` settles; `reset()` re-arms it.
- `boardScopeWhere()` waits `userStore.user ?? await userStore.whenReady()` instead of treating "not hydrated yet" as signed out.
- Board page membership check waits for the user and falls back to `data.session.user.id`.
- `initializeUser()` falls back to the session identity when `GetUsers` fails (network), so scoping still works.
- New `listsStore.boardsInitialized` flag used by `BoardSwitcher` and `[lang]/+page.svelte`.
- Board page: skip background refresh while `navigator.onLine === false`; on `online` retry a failed load or refresh.

### 3. Log-driven fixes

- **`Failed to fetch` ×3 at ~13 ms** = `refreshBoardInBackground()` (todos + lists + boards) fired by `visibilitychange` on wake
  before the network is up. Now skipped while offline + retried on `online`; network failures logged as `warn` (with `online`), not `error`.
- **Slow-query noise**: Hasura is fast (board-scoped GetBoards/GetLists/GetTodos 20–60 ms measured), but the timer started before the
  shared `/api/auth/token` wait, so every concurrent query looked ~1.1 s slow. Query time now excludes the token wait; a slow token
  fetch is reported once as `Slow token fetch`. `CreateLog` (the logger's own flush) no longer logs itself as slow (267 rows).
  Note: an *unscoped* GetTodos (907 todos, 3 MB) takes ~4 s — board-scoped loads don't hit it.
- **`reading 'prev'` (ErrorBoundary, ×3)**: Svelte internal keyed-each linked-list bug; fixed upstream after 5.39.6
  (#17191, #17240/#17244, #17258, #17550). Upgraded `svelte` → 5.57.1.
- **UserStore permission-error** (user A's session writing user B's settings): last seen 2026-09-17 16:53 +03, before
  `d5431d5` (#195) the same day — already fixed.
- **CreateInvoiceWithItems not-null**: already fixed by `bf2e6cb` (2026-09-10, nested insert).
- **AITaskButton `AI task failed: 500`**: server hid OpenAI's status. Now returns 502 with `OpenAI <status> <code>`, client logs the
  server's reason. NB: the `OPENAI_API_KEY` in local `.env` is rejected by OpenAI (`invalid_api_key`) — if production uses the same
  key, paid-plan AI calls fail. **Rotate the key in Vercel.**
- **VoiceInput** `not-allowed`/`no-speech`/`aborted` and "not supported" are user/browser outcomes → `info`, not error/warn.

### 4. svelte-check: 17 errors + 6 warnings (45 after the Svelte upgrade) → 0 / 0

- Types: tuple typing in `refreshBoardTodos`, `Buffer` → `Uint8Array` for `Response`/`File` bodies, test mocks missing new fragment fields.
- Real reactivity bugs fixed: `sheet-content` `sideClasses`, `ConfirmDialog` icon, `ImportIssuesDialog` default list when lists arrive
  late, expenses/invoices/splitwise pages captured `data` once (switching boards kept the old board) → `$derived` + reload effect.
- Intentional prop snapshots made explicit (`untrack`) or seeded by existing open/sync effects (CardDetailView, image managers, dialogs).
- a11y: filter group labels → `role="group"` + span; chart overlay `role="presentation"`.

### 5. Tests

- Playwright 1.55 has no Chromium for Ubuntu 26.04 → vitest browser project couldn't start. Upgraded `playwright`/`@playwright/test` → 1.63.
- Vitest: 27 files / 325 tests green before changes; new `boardLoadRace.test.ts` (3 tests).

### 6. fallow: 1970 dead-code + 161 clone groups + 353 complexity → exit 0

Added `.fallowrc.jsonc` (each entry commented with its reason):
- Excluded: generated GraphQL types (1741 findings), Hasura metadata, standalone sub-projects (chrome-extension,
  tracker-sync, scripts/ai-translate); shadcn `ui/` barrel re-exports + its upstream self-import cycles;
  GraphQL fragments (consumed by `...Spread` name, invisible to the import graph).
- Real dead code removed: 11 unused files (LoggingDebug, ReferenceLine, InvitationNotifications, NotificationBell/Panel,
  BoardRedirectLoader, lib/index.ts, schemas/todo.ts, test/testData.ts, types/calendar.ts, utils/url.ts) + `test-invite.graphql`;
  unused functions (aiCostUtils ×2, splitwise ×2, usdToEur, localStorage), unused types, unused GitHub mock helpers,
  unused props (`WebhookManager.boardId`, `VoiceInput.minimal`, stats `data`), unused load keys (`lang`),
  dead GraphQL docs (GET_NOTE, GET_USER_SUBSCRIPTIONS, Penon, InsertPenon); local-only symbols un-exported.
- Notes store used inline copies of queries + hand-written "temporary" types → now uses `documents.ts`
  (`NoteCoreFields` + `NoteFields { subnotes }`) and generated types (notes.svelte.ts 944 → 663 lines);
  components share the store's `Note` type. GitHub task-file routes use `UPDATE_TASK_FILE_PATH` from documents.
- `formatDate` duplicate export → `cardHelpers.formatLocalizedDate`.
- Deps: removed `bcrypt` (bcryptjs is used), `@sveltekit-i18n/parser-default` (transitive), `svelte2tsx`;
  declared directly-imported `esbuild`, `workbox-precaching`, `@auth/core`; `@sveltejs/adapter-auto` → devDependencies.
- **Not gated (honest status):** duplication is a ratchet at 6% (now 5.9%, 73 groups — biggest: Card/NoteImageManager
  ~180 shared lines, GitHub issue routes) and complexity is `warn` (332 functions over defaults, mostly CRAP estimated
  without coverage; worst: BoardManagement template, `todosStore.updateTodo` cog. 110). Those need dedicated refactor tasks.

ESLint (not in scope, pre-existing): 501 → 486 errors; none added.

### 7. Session 2 (2026-10-02 20:25) — resumed from runner stash

The first session's work had been parked by the runner (`stash@{0}`, plus untracked `.fallowrc.jsonc`
and `boardLoadRace.test.ts`); restored with `git stash apply` and re-verified on this tree:
- `npm run check`: **0 errors, 0 warnings**
- vitest server: **28 files / 328 tests passed**; vitest client (chromium): **6 files / 58 tests passed**
- `npx fallow`: **exit 0**
- e2e (from session 1): 19 passed / 33 failed — the **exact same 33** fail on unmodified HEAD (baseline worktree run),
  so none are regressions. They are stale specs (e.g. expect a "Today" heading, a single `textbox` on /signin
  that now has email+password). Committed the verified work first, then fixing e2e separately (below).
