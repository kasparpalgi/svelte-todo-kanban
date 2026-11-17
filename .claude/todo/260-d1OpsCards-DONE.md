> Run with: Opus 5.5 / high
> Machine: windows

# D1: cards, comments, uploads, activity and notifications

## Original Requirement

[NEVER REMOVE]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

1. D1 versions of `getTodos`, `getTodo`, `searchTodos`, `createTodo`, `updateTodo`,
   `deleteTodo`, `assignUser`, `unassignUser`, `subscribeToTodo`, `unsubscribeFromTodo`,
   `addTodoLabel`, `removeTodoLabel`, `createUpload`, `deleteUpload`, `getComments`,
   `createComment`, `updateComment`, `deleteComment`, `getNotifications`,
   `markNotificationsRead`, `deleteNotification` and `getBoardActivity`.
2. `written()` (`ops/cardAccess.ts`) becomes one `d1.batch()`: the write itself, the
   `changed_at` bump, activity rows and notifications. `requireCard` stays one statement
   (a join) and primes `boardRole`.
3. Card alias: `aliasBase(title, 'todo')` + `nextFree` + `prefixRange` over that user's
   todos (unique per user). `content_preview` = `substr(content, 1, 150)` in SQL.
   `assigned_to`/`assignee`: gone in D1 — rebuild from `todo_assignees` (oldest by
   `created_at`) if a store still reads it. Search: `contains()` (instr).
4. Board load: one cards statement with correlated sub-selects (#232 measured ~4k rows
   read on tekdok vs ~11k with one query per child table) — Drizzle relations do this.
5. Contract cases for each: every board's cards for its owner; writes as the test user
   on tests-board.

**How (set up in #233):** write `src/lib/server/ops/d1/<file>.ts` with `D1Run<'<op>'>` (same input, and `tsc` enforces the Hasura return type), register it in `ops/d1/index.ts`, add relations in `src/lib/server/db/relations.ts`, unit-test on `migratedSqlite()` + `sqliteD1()` (`ops/d1/__tests__`), then add cases to `ops/d1/__contract__/contract.test.ts` and run it against a fresh local copy (`node scripts/d1/copy-from-postgres.mjs`, then `CONTRACT=1 npx vitest --run --project=server src/lib/server/ops/d1/__contract__`). Gotchas: D1 allows 100 bound parameters per statement (`inChunks`), LIKE patterns of at most 50 bytes (`contains` uses `instr`), never `await` a Drizzle builder you mean to use as a sub-select (it runs it), and never select one column twice in a `d1.batch()` (rows are mapped by name).

**Done when:** every contract case is equal, and the staging Worker answers these ops from
D1. Production is deployed and still on Hasura.

_From Kanban card `c6b17b7b-e80f-4e70-98af-5f06acf3ee7b`, moved to the agent list._

_GitHub issue #256 — end the commit subject with `(#256)`._

## Results

**Summary** — All 22 card, comment, upload, notification and activity ops have a D1 version
with the same access rules as the Hasura ops: `getTodos`, `getTodo`, `searchTodos`,
`createTodo`, `updateTodo`, `deleteTodo`, `assignUser`, `unassignUser`, `subscribeToTodo`,
`unsubscribeFromTodo`, `addTodoLabel`, `removeTodoLabel`, `createUpload`, `deleteUpload`,
`getComments`, `createComment`, `updateComment`, `deleteComment`, `getNotifications`,
`markNotificationsRead`, `deleteNotification`, `getBoardActivity`.
- `requireCard` (`ops/d1/cardAccess.ts`) is one statement (relations with correlated
  sub-selects) and primes the board role. `written()` is one `d1.batch()`: the write, the
  `changed_at` stamp, the activity rows and the notifications, so they commit together.
- A board load is one statement (`ops/d1/cardRows.ts`): Drizzle relations plus extras for
  `content_preview` (`substr(content, 1, 150)`), the Claude cost sum and the comment count.
  `assigned_to` / `assignee` are rebuilt from the oldest `todo_assignees` row.
- Card alias: `aliasBase` + `nextFree` over that user's cards in `prefixRange`. Search uses
  `contains()` (instr).

**Files changed**
- Created: `src/lib/server/db/cardRelations.ts`; `src/lib/server/ops/d1/{cardRows,cardAccess,todos,cardPeople,cardExtras,comments,notifications}.ts`;
  `ops/d1/__tests__/cards.test.ts`; `ops/d1/__contract__/cards.test.ts`
- Modified: `db/index.ts` (registers the card relations), `ops/d1/index.ts` (22 loaders),
  `ops/d1/__contract__/compare.ts` (assignees/subscribers/uploads compared as sets; the
  legacy `assigned_to` folded into assignees, as the copy does). The Hasura `todos.ts`,
  `comments.ts`, `notifications.ts` and `activity.ts` got an `id` tiebreak in their
  order, and `comments.ts` exports `preview`. Also `wrangler.jsonc` (`"routes": []` for
  staging, see below), `CLAUDE.md` (the staging deploy line) and `package.json` (0.43.0).

**Verification**
- Unit tests on migrated SQLite: 8 new, 30/30 D1 op tests pass. `npm run check`: 0 errors.
  `npm test`: 649 passed.
- Contract against production Hasura on a fresh local copy (all 31 tables match), with every case equal:
  - `getTodos` for every board as its owner: open, completed and `limit: 1000`.
  - `getTodos {}` for every user, and `getTodo` for all 1,767 cards (plus 50 as the test user).
  - `getComments` for the 100 most-commented cards, two pages each.
  - `getBoardActivity` for every board, as its owner and as the test user.
  - `getNotifications` for every user, and `searchTodos` for 3 terms on every board.
  - The older board, sharing and runner contracts still pass.
- `CONTRACT_WRITES=1`: every write op, on both sides, as the test user on tests-board,
  through a temporary list. All equal. Production tests-board was checked afterwards: no
  lists, labels or cards left.
- Staging: deployed `todzz-staging` (version `d172e88a`). A signed-in probe as the test user
  used a session JWT signed with `AUTH_SECRET`. It needs no adapter, so it works before #259.
  All 22 ops answered 200 from D1, including a full write cycle. The activity feed showed
  every row the batches wrote. The probe cleaned up after itself.
- Production: still on Hasura (no `DATA_BACKEND`). The push deploys it through CI.

**Incident (fixed)** — The first staging deploy moved `www.todzz.eu` and `todzz.eu` to
`todzz-staging` for about 1 minute (10:27:25 to ~10:28:15 UTC), because `env.staging`
inherited the top-level `routes` that #254 added. `npx wrangler triggers deploy`
re-attached both domains to `todzz` without changing its code. The Cloudflare API confirms
both point at `todzz`. No row in any staging D1 table was written in that window, so no
production write was lost. Users signed in during that minute saw staging data.
`env.staging` now has `"routes": []`, and the redeploy showed workers.dev only.

**Deviations**
- `updateTodo` with `set.assigned_to` answers 400 on D1. There is no column, and no client
  sends it any more (assignees go through `assignUser` / `unassignUser`).
- Both backends now break order ties by `id` (cards, comments, notifications, activity).
  Bulk-updated cards share `updated_at`, and Postgres ordered them arbitrarily.
- The cost sum is `round(…, 10)`: Postgres sums numeric exactly, SQLite sums doubles.
- `assignUser` on D1 is idempotent (`onConflictDoNothing`), like the Hasura `on_conflict`.
  The primary falls to the next-oldest assignee automatically.
