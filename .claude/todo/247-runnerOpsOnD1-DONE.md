> Run with: Opus 5.5 / high
> Machine: mac

# Runner ops on D1

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Runner ops on D1

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #231 (parent #226). Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

`/api/runner/<op>` (`src/lib/server/runner/`) runs on Hasura only: under `DATA_BACKEND=d1`its ctx has no Hasura, so every runner op answers 500 on staging. Give each runner op a D1 version the way `src/lib/server/ops/d1` does for the browser ops (#233), with contract tests, before the cut-over (#234). Match a repo on the `boards.github_repo` column the plan adds (226 section 2) rather than a substring of the JSON. Also port `/api/runner/upload`'s card lookup and insert.

**Done when:** on the staging Worker, every runner op answers the same as production does for the same data (contract test), and a runner pointed at staging closes a test card.

*GitHub issue #247 — end the commit subject with* `(#247)`*.*

_From Kanban card `627e44ea-6f0a-499e-930f-86358b931e86`, moved to the agent list._

_GitHub issue #247 — end the commit subject with `(#247)`._

## Results

**Summary** — Every runner op (all 17, including #246's new `usage`) now has a D1 version, and
`/api/runner/<op>` runs it when `DATA_BACKEND=d1`. Before this, every runner op on staging
answered 500.
- `src/lib/server/runner/d1/{cards,extras}.ts`: the same input and the same JSON as the Hasura
  ops. A `satisfies` map in `d1/index.ts` makes a new runner op without a D1 version a type
  error. That is how `usage`, merged mid-run, got caught.
- `board { repo }` now matches `boards.github_repo` exactly, ignoring case, instead of
  `%repo%` on the JSON. `o/app` no longer finds `o/app-2`.
- `createCard` sets the per-user alias that the Postgres trigger `set_todo_alias` used to set.
  `updateComment` sets `updated_at` itself (D1 has no trigger for it). `upsertPricing` and
  `recordUsage` are SQLite upserts that update the same columns as Hasura's `update_columns`.
- `cards { ids | paths }` takes up to 500 values as one bound JSON parameter (`inList`,
  `json_each`), staying under D1's limit of 100 parameters per statement.
- New partial index `todos_task_file_path_idx` (migration `0003`), because the runner looks
  up cards by path on every tick. Without it each lookup reads the whole `todos` table,
  which counts against D1 Free's 5M reads a day.
- `/api/runner/upload` card lookup and insert are ported (`runner/attach.ts`). On D1 the
  owner's R2 token comes from `user_secrets`, not `users.settings.tokens`.
- The Hasura `board` op now returns `boards.at(0) ?? null`, so its type admits `null`.

**Files changed**
- created: `src/lib/server/runner/d1/{index,types,cards,extras}.ts`,
  `src/lib/server/runner/attach.ts`, `src/routes/api/runner/__tests__/d1.test.ts`,
  `src/lib/server/ops/d1/__contract__/{runner.test.ts,local.ts}`,
  `drizzle/0003_todos_task_file_path.sql`, `drizzle/meta/0003_snapshot.json`
- modified: `src/routes/api/runner/[op]/+server.ts`, `src/routes/api/runner/upload/+server.ts`,
  `src/lib/server/runner/cards.ts`, `src/lib/server/ops/d1/sql.ts` (`inList`, `iso`,
  `sameText`), `src/lib/server/ops/d1/__contract__/contract.test.ts` (shares `local()`; it
  now opens the largest local D1 file, because a migrated but empty `todzz` can sit next to
  the copy), `src/lib/server/db/schema/cards.ts`, `drizzle/meta/_journal.json`, `package.json`

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- Unit tests: `src/routes/api/runner` passes, 19/19. The 9 new D1 tests drive the real route
  on a migrated SQLite, including the upload route.
- `npm test`: 622 passed, 4 failed. The failures are flakes in files this change doesn't
  touch:
  - `boardLoadRace` (3 tests) fails the same way on clean `HEAD` and passes alone.
  - The webhook constant-time signature test fails about half the time even when run alone.
- Contract tests (`CONTRACT=1 CONTRACT_WRITES=1`), D1 against production Hasura on a fresh
  local copy: all equal.
  - Reads: `board` for every connected repo plus a missing one, `boards`, `pricing`,
    `usage` (last 30 days), `cards` by 500 paths and by 500 ids, `comments` (plain and
    narrowed), `uploads`.
  - Writes: create, update, claim, refused claim, release, comment, edit comment, delete on
    the test user's board, through a temporary list that was removed afterwards. Production
    was checked clean afterwards. The existing board contracts still pass.
- Deploy: migration `0003` applied to remote `todzz-staging` and `todzz`. The `todzz-staging`
  Worker was redeployed (version `34c443ce…`) and given its own `RUNNER_API_TOKEN`.
- Live staging against production, same input:
  - 74 read calls equal, including 500 card paths and 500 card ids. Only data from before
    the staging copy (2026-11-13 19:01 UTC) was used.
  - `usage`: all 521 staging rows equal production. The one extra production row was
    recorded after the copy.
- Live close of a test card on staging, using the runner's op sequence over HTTP:
  - `board` → `createCard` → `cards` → `claimCard` (mac: claimed; karel: refused) →
    `updateCard` (to Review, path `-DONE.md`) → `createComment` → `updateComment` →
    `releaseCard`.
  - `cards` then showed it in Review at `999-stagingCheck-DONE.md`, and `deleteCard`
    cleaned it up.

**Deviations**
- **"A runner pointed at staging" was simulated, not run.** The runner still talks to
  Hasura directly until #246 lands, and #246 is blocked on the production token. So I sent
  the runner's exact op sequence to staging myself. Once #246 ships, point a runner at
  `https://todzz-staging.svelte-todo-kanban.workers.dev` with the staging token. That token
  was generated for this run and is stored only as the Worker secret. Set a known one with
  `npx wrangler secret put RUNNER_API_TOKEN --env staging`.
- The live comparison used data from before the staging copy instead of re-copying staging.
  A refresh would cascade into ~16k rows plus their indexes against D1 Free's 100k writes a
  day. The local contract tests ran on a copy taken minutes before.
- Runner writes do not bump `boards.changed_at`, the same as on Hasura. The poll's card
  count and newest-card stamp still see them.
- The task number 247 is shared with `247-dataOpsColdStart-BLOCKED.md`, a different task
  filed earlier under the same number.
