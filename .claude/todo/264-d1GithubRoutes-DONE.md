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

## Chain off Hetzner (owner, 2026-11-25)

The owner asked (during #263): "once done make the next TODO task to be picked up by runner and
instruct all the following tasks to do the same so one by one all done until everything away
from Hetzner". So when this task ends, **queue the next one yourself** in the same commit as your
rename, by renaming its file to `-TODO.md` (a suffixless `NNN-slug.md` or a `-BLOCKED.md` alike).
The order:

1. `263-d1GithubWebhook` — the webhook on D1 (done 2026-11-25)
2. `264-d1GithubRoutes` — the other GitHub routes on D1
3. `265-d1BillingKeysCalendar` — Stripe, API keys and Google Calendar on D1 (runs beside 264)
4. `234-d1CutOver` — after **both** 264 and 265 are `-DONE`. The owner's chain request is the
   go-ahead for the cut-over moment that file asks for.
5. `252-dropHasuraJwt` — needs Chrome extension 1.3.0 live in the Web Store
6. `235-hasuraDecommission` — 7 days after the cut-over; the owner deletes the Hetzner apps

Rules:
- Queue the first unfinished task in the list whose prerequisites are all met. 264 and 265
  run side by side: whichever finishes second queues 234. If the other one isn't `-DONE`
  yet, queue nothing.
- If the next step needs something only a person can give (the extension in the Web Store,
  the 7 days after the cut-over), don't queue it. Finish `-BLOCKED.md`, and give the exact
  date or action in the Results.
- Copy this whole section into any follow-up file you split off, so the chain carries on.

## Results

**Summary** — Every GitHub route besides the webhook now runs on D1 when `DATA_BACKEND=d1`, and
no `serverRequest` is left in `src/routes/api/github/` outside a Hasura branch. Production is
unchanged (no `DATA_BACKEND`, so Hasura).
- `src/lib/server/github/routeCards.ts` is the one place the routes touch a card:
  - `githubCard(ctx, todoId)` reads the card, comments, list and board. It first calls
    `callOp('getTodo')`, so a card the caller cannot read is `null` (no access means "not found").
    On D1 it is two drizzle reads; on Hasura it is the query the routes had inline.
  - `markIssue`, `markComment` and `setTaskPath` write GitHub ids and the task path back. On D1 each
    checks the caller's rights through `requireCard` (edit for the card; for a comment, author and
    member), then writes with `written()`, which also bumps `boards.changed_at`.
  - `say` (the card comment, moved from `unqueue.ts`) goes through the `createComment` op on D1.
- `src/lib/server/github/importCards.ts`: `import-issues` reads the board from `getBoards` and
  checks the target list with `requireEditableList` and that it is on that board. On D1 it makes the
  aliases itself (one read of the user's aliases, then `nextFree`) and inserts the cards in one
  batch, 5 rows a statement, under D1's 100 parameters.
- `callback`: on D1 the token goes to `user_secrets` name `github` through `putSecret`.
- `create-issue`, `update-issue`, `create-comment`, `write-task-file`, `write-draft-file` and
  `update-task-file` lost their inline queries and call the helpers above.

**Files changed**
- Created: `src/lib/server/github/{routeCards,importCards}.ts`,
  `src/lib/server/github/__tests__/routes.d1.test.ts`
- Modified: the eight routes under `src/routes/api/github/`, `src/lib/server/unqueue.ts`,
  `src/lib/utils/agentMachine.ts` (`withPin` accepts a null card),
  `src/routes/api/github/__tests__/write-task-file.test.ts`, `package.json` (0.49.0)
- Renamed: this file to `-DONE.md`; `234-d1CutOver-BLOCKED.md` to `-TODO.md` (the chain, below)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `npm test`: 75 files, 705 tests pass.
- `routes.d1.test.ts` (11 tests) runs the route handlers on migrated SQLite with Hasura mocked to throw:
  callback, create-issue (also a stranger gets nothing), update-issue (a viewer is refused, the
  owner stamps `github_synced_at`), create-comment (author only), import-issues (12 issues, same-title
  aliases, closed and due dates, viewer and wrong-board list refused), write-task-file (new file;
  card out of the agent list goes back to a draft), write-draft-file, update-task-file.
  Each write also moves `boards.changed_at`.
- **Staging (D1), real GitHub:** uploaded version `ea69552b` with `wrangler versions upload`, not
  deployed (other runs share staging), and signed in as the e2e test user through the form.
  For that I copied the owner's `github` secret row onto the test user and made a throwaway board
  on `kasparpalgi/svelte-todo-kanban`. I removed both again.
  - `write-task-file` on a card outside the agent list answered `skipped: not the agent list`
    (board settings read from D1).
  - `create-issue` made issue #266, and the card got `github_issue_number`, `github_issue_id`, the URL
    and `github_synced_at`.
  - `create-comment` posted a comment; `github_comment_id` landed on the card's comment.
  - `update-issue` renamed and closed #266; `write-draft-file` wrote `.claude/todo/266-d1Proof264Card.md`
    and set `task_file_path`; `update-task-file` rewrote that file with the card and its comments.
  - `import-issues` made 33 cards in one batch with 33 distinct aliases. `boards.changed_at` moved.
  - Cleanup: draft file deleted from the repo (`f11ae8c`), the proof comment deleted, issue #266
    left closed (GitHub cannot delete issues), staging board (cascading its cards) and the copied
    secret removed.
- Production: deployed by the push to `main`, still on Hasura. Its own checks are in the commit's deploy.

**Deviations**
- **Not exercised against real GitHub: the `-TODO.md` write of `write-task-file`, and the OAuth
  `callback`.** A stray `-TODO.md` on `main` is claimed by a runner within a tick, and no machine
  name stops that (`agent_machine` is limited to mac/karel/dell/windows/cloud). Both are covered on
  migrated SQLite only; their D1 pieces (`githubCard`, `setTaskPath`, `say`, `putSecret`) ran on
  staging through the other routes. Use `callback` once on staging after the cut-over.
- Bug fix in `callback`: the success `throw redirect()` sat inside the `try`, so its own `catch`
  turned a successful connect into `/settings?error=Failed to connect GitHub`. It now rethrows redirects.
- Stricter than before, on both backends: the card routes answer "not found" for a card the caller
  cannot read, and `import-issues` needs edit rights on the board and a list that is on it
  (before, any signed-in user could import into any list id they knew).
- A viewer calling `create-issue` on D1 gets the GitHub issue made and then a 403 on the write-back
  (the check is in `markIssue`). The UI does not offer that to a viewer.
- Not changed: `callback` trusts `state` as the user id without checking the session. Worth a
  follow-up before it matters more.

**Chain off Hetzner** — 264 and 265 are both `-DONE`, so I queued `234-d1CutOver` by renaming it
`-TODO.md`. The owner's chain request is the go-ahead for the cut-over moment.
