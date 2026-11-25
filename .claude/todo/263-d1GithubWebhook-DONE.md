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

_From Kanban card `09c9e5ee-2e30-4700-b4fb-9c2f8d688cc3`, moved to the agent list._

_GitHub issue #263 — end the commit subject with `(#263)`._

## Results

**Summary** — The GitHub webhook now runs on D1 as well as Hasura. I split it while porting:
the 982-line route is now 70 lines (signature check and dispatch), and the work sits in
`src/lib/server/github/`:
- `issueEvents.ts`: edit, close, reopen and priority labels.
- `commentEvents.ts`: created (with the twin link from svelte-hasura-boilerplate#80), edited and deleted.
- `pushEvents.ts`: commits that name an issue, logged once.
- `taskDone.ts`: a -DONE or -BLOCKED rename moves the card to Review, unless the runner ran it.

The handlers are written once, against a small `WebhookDb` interface (`webhookDb.ts`), which
has two sides:
- `hasuraWebhook.ts` uses the same queries as before. It is the only file that calls `serverRequest`.
- `d1Webhook.ts`:
  - Finds boards by `github_repo = ?` (exact `owner/name`). Finds cards by `github_issue_id`,
    by `github_issue_number` on the exact repo, and by `task_file_path`. Finds comments by
    `github_comment_id`. All of these are indexed.
  - Every write (card move, comment, activity, bells) is one `written()` batch, so
    `boards.changed_at` moves and the 30 s poll sees it.
  - On D1 a DONE push finds its card by `task_file_path`, with no GitHub file fetch. It falls
    back to the file's card line.
  - The GitHub-login → user map reads `user_secrets.github.username`.
- Notifications on D1 are written by hand inside that batch. A GitHub user with no app account
  triggers them as nobody, so the board owner still gets the bell, as on Hasura.

The route picks the side with `opCtx(null, platform)`.

**Chain off Hetzner (owner's request during this run)** — I queued `264-d1GithubRoutes-TODO.md`
(next after this task; 265 landed in parallel while this ran, `3732f0d`). I appended a "Chain off Hetzner" section to 264,
265, 234, 252 and 235. It lists the order (264 + 265 → 234 cut-over → 252 → 235) and tells each
run to queue the next one when it finishes, or end -BLOCKED with the exact action or date when a
person is needed: the extension in the Web Store, or the 7 days after the cut-over.

**Files changed**
- Created: `src/lib/server/github/{webhookDb,hasuraWebhook,d1Webhook,issueEvents,commentEvents,pushEvents,taskDone}.ts`,
  `src/lib/server/github/__tests__/webhook.d1.test.ts`
- Modified: `src/routes/api/github/webhook/+server.ts` (982 → 70 lines),
  `src/lib/graphql/documents.ts` (the inline push query moved there as raw `GET_TODO_BY_ISSUE_NUMBER`),
  `package.json` (0.48.0), task files 264 (renamed to -TODO), 265, 234, 252, 235 (chain section appended)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `eslint` is clean on the changed files.
- `npm test`: 71 files and 688 tests pass. `runnerCard.test.ts` (Hasura) still passes, unchanged.
- The new `webhook.d1.test.ts` has 9 tests. They go through the route on migrated SQLite, with
  Hasura mocked to throw. They cover:
  - edit (mapped user, bell, stamp), close and reopen, and priority label on and off
  - a stranger's comment copied once as the owner, the twin link, and edit and delete
  - a commit logged once on the exact repo only (not `o/r-fork`)
  - DONE → Review, comment and issue closed; a runner-run card left alone
- Staging (D1): uploaded version `0001abd4` with `wrangler versions upload`, not deployed (other
  runs share staging). I gave staging its own `GITHUB_WEBHOOK_SECRET`, a fresh random value, not
  production's. A bad signature gets 401.
  - **Real GitHub deliveries:** I put a temporary hook (issue comments only) on
    `kasparpalgi/svelte-todo-kanban`, which has no production hook, pointing at that version.
  - GitHub's `ping`, `issue_comment created` and `issue_comment deleted` all got 200.
  - D1 copied the test comment on #258 onto its card as the mapped user. It wrote the `commented`
    activity and moved `changed_at`. After the delete on GitHub, it removed the comment and logged `comment_deleted`.
  - The hook and the test comments are deleted again.
- Production: still on Hasura (no `DATA_BACKEND`). The push to main deploys it through CI.

**Deviations**
- One interface with two sides, rather than `if (ctx.d1)` branches inside each handler, so the
  event logic exists once.
- Bug fix: a signature of the wrong length crashed `timingSafeEqual` into a 500. It now gets 401.
- `extractIssueNumbers` keeps only the `#123` pattern. The keyword pattern only ever matched a
  subset of it.
- The first test comment on #258 was posted before the hook existed (a shell glob typo). I
  deleted it right away.
- The chain set-up for tasks 264, 265, 234, 252 and 235 was not in this task; the owner asked
  for it mid-run.
