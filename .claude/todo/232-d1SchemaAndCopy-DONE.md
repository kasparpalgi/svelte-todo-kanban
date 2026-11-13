> Run with: Opus 5.5 / xhigh
> Machine: dell

# D1 database, schema and a re-runnable Postgres → D1 copy

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# D1 database, schema and a re-runnable Postgres → D1 copy

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Phase 2, step 1. Needs the #218 cut-over (D1 is reachable only from a Worker) and the owner's answers in 226, Decisions 1–3.

1. Create the D1 databases `todzz` and `todzz-staging` with `--location eeur` (users are in Estonia). The `CLOUDFARE_API_TOKEN` in `.env` can list D1; `wrangler d1 list` showed none on 2026-11-12. Bind `DB` in `wrangler.jsonc` and add a staging environment; type `App.Platform.env.DB`.
2. Drizzle ORM 0.45.x (stable; 1.0 was still rc on 2026-11-12) with schema in `src/lib/server/db/schema/*.ts`, and migrations from `drizzle-kit generate` applied with `wrangler d1 migrations apply`. Conventions: UUID text ids (URLs, GitHub links and runner card ids keep working); ISO-8601 UTC text timestamps (the strings the client already parses); JSON as text; booleans as 0/1; CHECKs kept. Apply the section changes from 226: no `sessions`; `user_secrets`; `boards.github_repo` and `boards.changed_at`; `assigned_to` folded into `todo_assignees`; no invitation email-tracking columns; one log timestamp; indexes only for real access paths (add `todos.list_id` and `lists.board_id`, drop duplicates). Every index costs an extra row written.
3. `scripts/d1/copy-from-postgres.mjs <tables…>`: read through Hasura `run_sql` (admin secret, `read_only`), convert types, write SQL, run `wrangler d1 execute --file`. Re-runnable (it clears the target tables first). Logs: last 30 days only. It must stay under the 100k rows/day written of Free: ≈ 15k rows plus their index rows.
4. Copy prod → `todzz-staging` and compare row counts per table.
5. Measure with `meta.rows_read` and duration: a board load and a poll for `/en/test/tests-board` and for the biggest board. Write the numbers in Results and re-check the daily read budget.

**Done when (deploy + live check):** the Worker deploys with the binding and still serves production from Hasura (nothing reads D1 yet). Live check as the test user: board loads as before. The staging copy's row counts match Postgres.

*GitHub issue #232 — end the commit subject with* `(#232)`*.*

_From Kanban card `f326cbae-c43a-4037-bb98-33d781f50d24`, moved to the agent list._

_GitHub issue #232 — end the commit subject with `(#232)`._

## Handover from #230

- **`user_secrets` belongs in this schema.** #230 protects the encrypted tokens in code
  instead of moving them to a separate Postgres table now:
  - `updateMe` keeps every stored `settings.tokens.*` except `groq`, so the browser can't
    drop or overwrite them;
  - `getMe` shows the browser `encrypted: true` and never the ciphertext;
  - `disconnectIntegration` removes `github` / `google_calendar`.

  In D1, put `github`, `google_calendar`, `openai` and `r2` into a server-only
  `user_secrets(user_id, name, value)` table and drop them from `users.settings`. Readers
  to switch: `src/lib/server/{github,aiKey,storeFile,plan}.ts`, `api/keys`,
  `api/google-calendar/callback`, `api/calendar-event`, the GitHub OAuth callback and the
  webhook's `GET_USER_BY_GITHUB_USERNAME`.

## Results

**Summary** — D1 is set up and holds a full copy of production on staging. Nothing reads it
yet; production still runs on Hasura.

- **Databases:** `todzz` (`e108c6bb-…`) and `todzz-staging` (`cdbc48e7-…`), both in `eeur`.
  `wrangler.jsonc` binds `DB` to `todzz`, and `--env staging` binds it to `todzz-staging`.
  `App.Platform.env.DB` is typed as `D1Database`. The Worker is deployed with the binding.
- **Schema:** Drizzle ORM 0.45.4 and drizzle-kit 0.31.11. 31 tables in
  `src/lib/server/db/schema/` (users, boards, cards, activity, notes, money, extras). Column
  names are the Hasura field names, so rows come back in the shapes the stores read. Three
  migrations, applied to both databases with `wrangler d1 migrations apply`.
  Conventions: UUID text ids made in code. Timestamps are `toISOString()` text, so text
  order is time order. Booleans are 0/1, JSON is stored as text, and the Postgres CHECKs
  are kept.
- **Changes from Postgres:**

  | | Postgres | D1 |
  | --- | --- | --- |
  | Sessions | `sessions` table, never used | dropped |
  | Tokens | `users.settings.tokens` | `user_secrets(user_id, name, value)`, as #230's handover asked; `settings` keeps only `tokens.groq` (the browser's own key) |
  | Board's repo | `boards.github`, JSON text matched with ILIKE | `boards.github_repo` (`owner/name`, exact match, partial index); the ops rebuild the JSON |
  | Assignees | `todos.assigned_to` on 946 cards, plus `todo_assignees` | `todo_assignees` only; the copy adds the 13 that were missing |
  | Dead columns | `todos.invoiced_hours` (always 0), 5 invitation email-tracking columns | dropped |
  | Logs | `timestamp` and `created_at`, 5 indexes | `created_at` (the event time), 2 indexes, last 30 days |
  | Indexes | 73 besides primary keys | 42. Added `todos.list_id`, `lists.board_id`, `uploads.todo_id`, `expenses.board_id` and `expense_splits.expense_id`. Dropped duplicates and indexes nothing filters by: activity 5 → 1, notifications 7 → 1 |
  | Auth.js | Hasura adapter columns | the same names, plus `accounts.oauth_token` and `oauth_token_secret`, which `@auth/d1-adapter` 1.11.3 inserts |

- **Copy script:** `node scripts/d1/copy-from-postgres.mjs [--remote] [--prod] [--check]
  [--yes] [table…]`. It reads through Hasura `run_sql` (read-only), converts types in SQL,
  writes one SQL file and runs `wrangler d1 execute --file`. Then it compares row counts.
  - The target is staging unless `--prod`, and the local wrangler state unless `--remote`.
  - It is re-runnable: it deletes the target rows first. A table you name also brings the
    tables that reference it, because clearing it cascades into them.
  - Columns and indexes are read from the live D1, so a new migration needs no script
    change.
  - It estimates the rows written (deletes plus inserts plus index rows) and stops a remote
    run over 90k unless `--yes`. The temp SQL file is deleted afterwards, because it holds
    password hashes and tokens.
- **Staging copy (prod → `todzz-staging`, 2026-11-13 ~21:00 local):** all 31 tables matched
  Postgres. Largest tables: 10,381 activity rows, 5,288 logs, 1,768 comments, 1,719 cards,
  951 assignees, 949 Claude usage rows, 57 users. Size 15.8 MB. Measured 71,325 rows written
  (the estimate was 74,464). A `--check` an hour later showed only new production writes
  since the copy: +1 card, +3 Claude usage rows, +1 comment, +1 short link.
- **Measured on `todzz-staging`** (`meta.rows_read`, D1 SQL time):

  | | tests-board (empty right now) | tekdok, the biggest board (371 open, 560 cards) |
  | --- | --- | --- |
  | Board load, one query per child table | 15 rows, 3.5 ms | 10,936 rows, 63 ms |
  | Board load, correlated sub-selects per card | — | ≈ 4,000 rows, ≈ 19 ms |
  | Poll as it is today (with the card aggregate kept until #231) | 1 row, 0.6 ms | 576 rows, 4.0 ms |
  | Poll after #231 (`changed_at` and unread only) | 1 row | 3 rows, 0.6 ms |

- **Daily read budget (5M):** a poll of 3 rows every 30 s is ~8.6k rows a day per open tab,
  which is fine. With the card aggregate it is 1.66M a day for one tekdok tab, so #231 must
  drop the aggregate before the poll reads D1. A tekdok load is ~4k rows with correlated
  sub-selects, so 1,000 such loads a day is 0.8 of the 5M. Handed to #233 in its file.
- **Daily write budget (100k):** a full copy into an empty database costs ~77k. A refresh of a
  full one costs ~160k, which the script refuses. Today's account total is ~76.8k written
  and ~126k read. #234's file says the final copy must be the only big write that day.

**Files changed**
- created: `drizzle.config.ts`; `drizzle/0000_init.sql`, `0001_logs_created_at.sql`,
  `0002_user_secrets_per_name.sql` (hand-edited to drop and re-create; the rows were
  copies), `drizzle/meta/*`; `src/lib/server/db/schema/{columns,users,boards,cards,activity,notes,money,extras,index}.ts`;
  `src/lib/server/db/__tests__/schema.test.ts`; `scripts/d1/{copy-from-postgres,lib,literal}.mjs`;
  `.claude/todo/240-freshCardDetailRace.md` (Backlog follow-up)
- modified: `wrangler.jsonc`, `src/app.d.ts`, `playwright.config.ts` (`E2E_BASE_URL` runs the
  suite against a deployed URL), `e2e/log-viewer.spec.ts`, `CLAUDE.md` (D1 commands),
  `.prettierignore` (`drizzle/meta/`), `package.json` and `package-lock.json` (0.33.0 →
  0.34.0; `drizzle-orm`, and dev `drizzle-kit` and `@cloudflare/workers-types`),
  `.claude/todo/233-d1Ops.md` and `234-d1CutOver.md` (hand-over notes)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 50 files, 545 tests passed (twice).
  An earlier run on the rebased tree had 2 failures in one file, which did not come back in
  two re-runs. I didn't capture which file it was.
- New schema test: the migrations apply on `node:sqlite` with foreign keys on; defaults have
  the `toISOString()` shape; CHECKs and cascades work; `literal()` round-trips quotes,
  newlines and emoji.
- `drizzle-kit check`: fine, and `generate` reports no pending changes.
- Copy: run three times locally (full, `todos` subtree, re-run into full tables), one full
  remote copy, and a `user_secrets` refill. Locally `PRAGMA foreign_key_check` is clean and
  all timestamps have the same shape.
- Builds: Cloudflare (1,068 KiB gzip; no Drizzle code in the bundle, since nothing imports
  it) and `VERCEL=1`, both pass.
- **Deploy + live check:** the Worker was redeployed from the rebased tree (#230 + this).
  `wrangler deploy` lists `env.DB (todzz)`. The authenticated e2e suite against
  `https://todzz.svelte-todo-kanban.workers.dev`, signed in as the test user: 29 passed,
  1 failed. The failure is `card-detail` ("opens … without a full loading state"); its two
  serial follow-on tests then did not run. It fails the same way against www.todzz.eu
  (Vercel), so it is older than this change. Cause: a click on a card that still has its
  `temp-` id does nothing. Filed as `240-freshCardDetailRace.md`. Board load, quick add,
  drag, logs and logout pass.
- `/verify` was not invoked as a skill (runner session); the checks above are the ones
  that match this change.

**Deviations**
- **#230's session deployed the Worker at 19:20 UTC from a tree without the D1 config,
  which removed my binding.** I redeployed after rebasing. A session working from an older
  `main` (#231 is still queued) would remove it again on its next `wrangler deploy`. It
  only has to rebase first; nothing reads `DB` yet, so the app is unaffected either way.
- `user_secrets` changed shape mid-run to #230's `(user_id, name, value)`, one row per
  secret. That cost one more migration (`0002`).
- Added `logs.created_at` as a second logs index (migration `0001`). #227's handover and
  the plan asked for it: without it every prune scans the table.
- No staging Worker was deployed. `--env staging` is configured, but until #233 adds
  `DATA_BACKEND=d1` it would serve the same Hasura data as production.
- tests-board has no lists or cards right now (the e2e specs clean up after themselves), so
  its numbers show the fixed cost only; tekdok gives the upper bound.
- Fixed a data-dependent locator in `e2e/log-viewer.spec.ts` (it broke once the newest log
  had a session id), and added `E2E_BASE_URL` to run the live check against a deployed URL.
