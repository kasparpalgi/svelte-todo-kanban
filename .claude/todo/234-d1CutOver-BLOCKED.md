> Run with: Opus 5.5 / xhigh
> Machine: dell

# Cut production over to D1

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Cut production over to D1

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Needs `d1Ops` and `runnerAndExtensionApi`. **Needs the owner to pick the moment** (a few minutes of read-only).

1. Read-only switch on (ops refuse writes with a friendly message); pause the runners.
2. Final `copy-from-postgres` into `todzz`; compare row counts.
3. Set `DATA_BACKEND=d1` on production; read-only off; runners resume.
4. Live checklist as the test user and a real account: Google sign-in, email link, password, board load and poll, card create/drag/comment/upload, invitation accept, settings save, GitHub webhook, Stripe test webhook, push, Chrome extension, a runner card end to end.
5. **Rollback:** within the first hour, `DATA_BACKEND=hasura` (D1 writes since the switch are lost; copy them back by hand if any). After that, forward-fix only.
6. Watch for 7 days: D1 rows read and written against the Free limits, Worker CPU (error 1102), errors in the logs page.

*GitHub issue #234 — end the commit subject with* `(#234)`*.*

_From Kanban card `bb48a08e-c2ef-4765-855d-6ec0573847d5`, moved to the agent list._

_GitHub issue #234 — end the commit subject with `(#234)`._

## Notes from #233 (D1 ops)

- **Not ready to run yet.** #233 built the switch and the first slice; the rest of the D1
  work is in the Backlog as 241 (lists, labels, members, invitations), 242 (cards),
  243 (user, notes, money, extras), 244 (server routes that call Hasura directly) and
  245 (Auth.js on D1 plus the staging e2e proof). The cut-over needs all five, and #231.
- The switch: `DATA_BACKEND=d1` (a wrangler `vars` entry; the staging env already has it).
  With it, an op without a D1 version answers 501 and the Hasura client throws, so a
  missed path fails loudly instead of reading the old database.
- The #232 hand-over notes for this file (final copy ≈ 77k of the 100k writes a day, copy
  `logs` the day before if the estimate is over 90k) were dropped when the card was queued;
  they are in `git show 10772e7:.claude/todo/234-d1CutOver.md`.

## Results

**Summary** — **The cut-over did not happen, and could not happen today.** I built step 1's
read-only switch, the one part of this task that no other card covers, and tested it live on
staging. Production is untouched: still Hasura, and `DATA_BACKEND` is not set.

Why the cut-over can't run yet (checked 2026-11-14):

1. **www.todzz.eu is still served by Vercel.** It answers with an `x-vercel-id` header. D1 is
   a binding that only the Cloudflare Worker has, so `DATA_BACKEND=d1` cannot work there.
   #218 (`218-moveAppToCloudflareWorkers-BLOCKED.md`) has to finish first: copy the
   production secrets to the Worker, then attach `todzz.eu` / `www.todzz.eu` as custom
   domains. The plan above didn't list this prerequisite.
2. **Most code still talks only to Hasura.** 8 of the 81 `/api/data` ops have a D1 version
   (logs, poll, boards). About 20 server routes call Hasura directly (GitHub, billing,
   uploads, invite, layout load), and Auth.js uses `HasuraAdapter`. On D1 every one of those
   answers 501 or throws. That work is in Backlog files **241** (`d1OpsBoardsRest`),
   **242** (`d1OpsCards`), **243** (`d1OpsUsersAndRest`), **244** (`d1ServerRoutes`) and
   **245** (`d1AuthAdapter`). None of them has been queued yet.
3. **The runner and the extension still use Hasura.** #231 is blocked until
   `RUNNER_API_TOKEN` is set in production and extension 1.3.0 is submitted. #246 is blocked
   until the runner branch `runner-api-246` in klarity-claude-kit is merged once the token
   is in each machine's `config.json`. The runner's D1 ops are done (#247).

**What got built: the read-only switch** (`src/lib/server/readOnly.ts`). It runs first in
`hooks.server.ts`. With `READ_ONLY=1`, any request that is not GET/HEAD/OPTIONS answers
`503 { error: "Todzz is read-only for a few minutes while it moves to a new database. Please
try again shortly." }` with `Retry-After: 300`. Three kinds of request still get through:
`/api/data` ops whose names start with `get`, `search`, `count` or `poll`; the runner's read
ops (`board`, `boards`, `cards`, `comments`, `uploads`, `pricing`, `usage`); and
`/auth/signout`, which only clears a cookie. Browser stores show the message through their
usual error path, and the logger retries its batch later. On the Worker the switch is a
secret, so turning it on or off needs no redeploy:
`echo 1 | npx wrangler secret put READ_ONLY` / `npx wrangler secret delete READ_ONLY`.

Known gaps, all fine for a window of a few minutes:
- GET routes that write are not stopped: the Auth.js OAuth/email callbacks, the GitHub and
  Google Calendar connect callbacks, and the URL-shortcut click counter in
  `[lang]/+layout.server.ts`. A write there during the window goes to Postgres after the
  copy and is lost. The user can sign in or reconnect again.
- **GitHub webhooks** refused during the window are not resent by GitHub on its own. After
  the switch, redeliver them from the repo's *Settings → Webhooks → Recent Deliveries*.
  Stripe retries by itself.

**What you need to do (in this order)**
1. Finish #218: production on the Worker at www.todzz.eu (its file lists the steps).
2. Finish #231 and #246: `RUNNER_API_TOKEN` in production, extension 1.3.0 submitted, merge
   `runner-api-246` once the token is in each runner's `config.json`.
3. Queue 241, 242, 243, 244 and 245 from the Backlog. They are code work a runner can do.
   245 ends with the staging e2e proof that the whole app runs on D1.
4. Then pick the moment and queue 234 again (set `> Machine:` back to the machine that
   should run it). Step 1 now has its switch: `echo 1 | npx wrangler secret put READ_ONLY`
   on the production Worker, then pause the runners.

**Files changed**
- Created: `src/lib/server/readOnly.ts`, `src/lib/server/__tests__/readOnly.test.ts`
- Modified: `src/hooks.server.ts` (`readOnlyHandle` runs first), `CLAUDE.md` (the
  switch's command in the D1 block), `package.json` (0.39.0 → 0.40.0)

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 62 files passed, 2 skipped; 632 tests passed, 9 skipped.
- `npm run build` (adapter-cloudflare) passes. Deployed to `todzz-staging` (version
  `bfce69d3`). Live probes without a session, so nothing was written:
  - `READ_ONLY` unset: `createTodo`, `getBoards` → 401; runner `claimCard`, `cards` → 401;
    `GET /signin` → 200.
  - `READ_ONLY=1`: `createTodo` and `claimCard` → 503 with the message and
    `Retry-After: 300`; `getBoards` and `cards` → 401 (they pass through to the route);
    `GET /signin` → 200.
  - Secret deleted: everything back to 401. The secret is gone from `wrangler secret list`.
    (My first delete failed because I added a `--force` flag that this wrangler version
    doesn't accept; the plain command in the docs works.)
- Production was not deployed by hand and nothing was switched there. The push to `main`
  deploys Vercel, where the switch stays off because `READ_ONLY` is not set.

**Deviations**
- Steps 2–6 (final copy, `DATA_BACKEND=d1` on production, the live checklist, rollback
  watch, 7-day watch) were not done, because of prerequisites 1–3 above. Renamed to
  `-BLOCKED.md`, not `-DONE.md`.
- No new follow-up files: every missing piece already has its own file (218, 231, 241–246).
