> Run with: Opus 5.5 / high

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
