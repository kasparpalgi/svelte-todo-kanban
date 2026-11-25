> Run with: Opus 5.5 / high

# D1: the GitHub webhook

## Original Requirement

[NEVER REMOVE]

Follow-up from #258 (`.claude/todo/258-d1ServerRoutes-DONE.md`), part of #226: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

`src/routes/api/github/webhook/+server.ts` (981 lines, 34 `serverRequest` calls) still runs
on Hasura only. Its one `getGithubToken` call gets an explicit Hasura ctx until this lands.

1. Split it while porting: issue events, comment events and push/task-file events each
   get their own module under `src/lib/server/github/` (aim for ~200 lines per file).
2. Find boards with `github_repo = ?` (exact `owner/name`), not `github ILIKE '%…%'`.
   Find cards by `github_issue_id` / `github_issue_number` / `task_file_path`, and
   comments by `github_comment_id` (all of these are indexed).
3. Card moves, comments and activity on D1 go through the ops, or through `written()` in
   `ops/d1/cardAccess.ts`, so `boards.changed_at` moves and the 30 s poll sees them.
4. Unit tests for each D1 branch. `webhook/__tests__/runnerCard.test.ts` must keep passing.

**How (set up in #258):** a route gets `ctx = opCtx(userId, platform)` (`src/lib/server/ops/run.ts`; it returns a `UserCtx` when given a user id). Branch with `if (ctx.d1) { …drizzle… }` and keep the Hasura code as the `else`. Call ops with `callOp(name, ctx, input)`, which is typed and runs on either backend. `getGithubToken(ctx, userId)` and `getPlanContext(ctx, userId)` already read D1 (`user_secrets`, through `secretsOf` in `src/lib/server/secrets.ts`). For tests, copy `src/lib/server/__tests__/d1Helpers.test.ts`: `migratedSqlite()` + `sqliteD1()`, with `serverRequest` mocked to throw.

**Done when:** no `serverRequest` in the webhook outside a Hasura branch, the staging Worker
(`DATA_BACKEND=d1`) passes a GitHub webhook test delivery (Recent Deliveries → Redeliver,
or a push to a repo linked to a staging board), and production is deployed and still on Hasura.

_GitHub issue #263 — end the commit subject with `(#263)`._
