> Run with: Sonnet 5.5 / high

# D1: the GitHub routes besides the webhook

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high
> After: #263

# D1: the GitHub routes besides the webhook

## Original Requirement

[NEVER REMOVE]

Follow-up from #258 (`.claude/todo/258-d1ServerRoutes-DONE.md`), part of #226: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

These still read and write Hasura directly; only their GitHub token lookup is on D1 so far:
`api/github/callback` (stores the token: on D1 it goes to `user_secrets` name `github`),
`create-issue`, `update-issue`, `create-comment`, `import-issues`, `write-task-file`,
`write-draft-file` and `update-task-file`. Where a route reads a card or a board, use
`callOp('getTodo' | 'getBoard', …)`, so it gets the caller's access check. Where it writes
GitHub ids back onto a card or comment, write them directly on D1 and bump
`boards.changed_at` (`stamp()` in `ops/d1/lists.ts`). `unqueue()` already writes D1.

**How (set up in #258):** a route gets `ctx = opCtx(userId, platform)` (`src/lib/server/ops/run.ts`; it returns a `UserCtx` when given a user id). Branch with `if (ctx.d1) { …drizzle… }` and keep the Hasura code as the `else`. Call ops with `callOp(name, ctx, input)`, which is typed and runs on either backend. `getGithubToken(ctx, userId)` and `getPlanContext(ctx, userId)` already read D1 (`user_secrets`, through `secretsOf` in `src/lib/server/secrets.ts`). For tests, copy `src/lib/server/__tests__/d1Helpers.test.ts`: `migratedSqlite()` + `sqliteD1()`, with `serverRequest` mocked to throw.

**Done when:** no `serverRequest` in `src/routes/api/github/` outside a Hasura branch,
unit tests cover each D1 branch, and on staging a card's issue is created, updated and
commented on, and its task file is written. Production is deployed and still on Hasura.

_GitHub issue #264 — end the commit subject with `(#264)`._

_From Kanban card `4e4e2508-ec3c-4091-a18c-c5079593125d`, moved to the agent list._

_GitHub issue #264 — end the commit subject with `(#264)`._


## Results

**Summary** — Nothing left to build: this card is a re-queue of #264, already finished in commit
`adf4143` ("feat(d1): GitHub issue, comment, import and task-file routes on D1; queue #234 (#264)").
The full write-up is in `264-d1GithubRoutes-DONE.md` (archived in `64e6fe3`). Since then production
was cut over to D1 in `bacc382` (#234).

**Files changed** — only this task file (renamed to `-DONE.md`). No code changes.

**Verification**
- `grep serverRequest src/routes/api/github/`: the only hits are the Hasura-only `saveOnHasura` branch in
  `callback/+server.ts` and mocks in tests, so "no `serverRequest` outside a Hasura branch" holds.
- `npx vitest --run src/lib/server/github src/routes/api/github`: 6 files, 62 tests pass (includes
  `routes.d1.test.ts`, which runs each route on migrated SQLite with Hasura mocked to throw).
- Staging proof (issue created, updated, commented; task file written) was done in `adf4143`'s run.

**Deviations** — The "production is still on Hasura" clause of the original text is out of date: production
has run on D1 since the cut-over (`bacc382`, #234). The open follow-up noted in the earlier Results
(`callback` trusts `state` as the user id) is unchanged.
