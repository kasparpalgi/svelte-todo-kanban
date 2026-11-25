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

## Results (2026-11-25, dell)

**Summary** — **Production runs on D1 since 2026-11-25, 20:09 UTC.** The site was read-only for
52 seconds (20:08:49–20:09:41 UTC). Postgres on Hetzner is frozen: no row there is newer than
the switch. It stays up for the rollback and for #235. Ending `-BLOCKED`: the code part is done,
but a few checks need you, and the next tasks in the chain wait on the Web Store and a date.

Before starting I confirmed that #218, #231/#246, 241–245 and 263–265 were done, `www.todzz.eu`
was on the Worker at `adf4143` (= `main`), all 4 migrations were applied on `todzz`, Hasura had no
event or cron triggers, and today's D1 writes were 291 (all staging).

1. **Read-only on, runners paused.** I froze the runner loops on mac and karel (`kill -STOP` over
   ssh; the agent sessions kept running) from 20:08:42 to 20:09:50. Dell's runner was waiting on
   this run. Then I ran `echo 1 | npx wrangler secret put READ_ONLY`. `createTodo` and
   `/api/runner/claimCard` answered 503 with the message, and reads passed.
2. **Final copy:** `copy-from-postgres.mjs --remote --prod`. It estimated ~83k rows and wrote
   **78,625 rows in 7.4 s. All 31 tables match** (22,718 rows, `logs` = last 30 days).
3. **Switch:** `echo d1 | npx wrangler secret put DATA_BACKEND`, then
   `npx wrangler secret delete READ_ONLY`, then resumed the runners (`kill -CONT`).
   It's a **secret**, not a wrangler var: a var and a secret can't share a name, and a secret
   flips back without a deploy.
4. **Live checklist** (production):
   - **D1 gets the writes, Postgres doesn't.** A runner-API comment on this card (`1abf3731…`,
     20:10:19 UTC) is in D1 and not in Postgres.
   - **Playwright e2e, `E2E_BASE_URL=https://www.todzz.eu`: 32/32 passed** (password sign-in,
     board load and poll, quick add, card detail, upload area, drag and keyboard reorder, logs,
     logout).
   - **Test-user script through `/api/data`:**
     - create a list and a card, then comment;
     - upload a PNG to R2 (served 200), then `createUpload` (the card shows 1 upload);
     - settings save (`updateMe` flipped `dark_mode` and set it back).
     - **Extension 1.3.0's token:** `getBoards`, `createNote` and `getNotes` worked. `deleteNote` was
       refused (401).

     Everything was deleted again. D1 has none of it left.
   - **Email link:** `POST /auth/signin/nodemailer` for the test user returned 302 to
     `verify-request`. Its `verification_tokens` row is in D1, and the mail was sent. The link
     itself wasn't clicked, because the mailbox isn't reachable from here.
   - **Google:** the sign-in start redirects to Google with `…/auth/callback/google`. All 43
     Google `accounts` rows are in D1. The real round trip wasn't done: Claude in Chrome isn't
     connected (the same account mismatch as #254).
   - **GitHub webhook:** a ping to the production hook on `svelte-hasura-boilerplate` (the
     one hook I can see) answered 200. No delivery fell inside the window, so nothing needed
     redelivery. Real issue and comment events on D1 were proven on staging in #263.
   - **Runners:** the mac log shows clean ticks after the resume. The full runner round trip on
     D1 is this card itself: dell's runner closes it through `/api/runner` after this session.
   - **Worker:** Workers Observability since the switch shows 388×200 and no 5xx except my two
     Stripe probes. There were no exceptions and no `exceededCpu` (1102).
   - **D1 today:** `todzz` 78,853 rows written (the copy plus the checks), 84k read. That's
     within Free's 100k / 5M, and the count resets at 00:00 UTC.
5. **Rollback:** until about 21:10 UTC: `echo hasura | npx wrangler secret put DATA_BACKEND`. D1
   writes since 20:09 would be lost. After that, forward-fix only.
6. **7-day watch:** handed to #235, which can run on or after **2026-12-02**. I added the steps
   and the cut-over facts there.

**What you need to do**
1. **Sign in with Google once** on www.todzz.eu (sign out, then Google). It's the one sign-in
   path not run live on D1. If it fails before ~21:10 UTC, roll back as in step 5. After that,
   tell a runner.
2. **Upload extension 1.3.0 to the Chrome Web Store** (`~/Downloads/todzz-extension-1.3.0.zip` on
   the Mac, steps in #254). Until then, notes saved with 1.2.0 go to the frozen Postgres and don't
   show in the app. When it's live, queue `252-dropHasuraJwt`.
3. **Stripe webhooks were never configured.** `/api/billing/webhook` answers
   `503 Webhook not configured`: `STRIPE_WEBHOOK_SECRET` isn't in `.env` or on the Worker, before
   D1 too. To fix it, add the endpoint in Stripe, then put its signing secret in the Mac's `.env`,
   then run `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
4. Not run live: accepting an invitation (needs a second account) and push (needs a subscribed
   browser). Both run on D1 in unit and contract tests. Watch them in normal use.
5. On or after **2026-12-02**, queue `235-hasuraDecommission`. Only after it, delete Hasura and
   Postgres on Hetzner.

**Files changed**
- Modified: `scripts/d1/copy-from-postgres.mjs` (refuses `--prod --remote` unless `--check` or
  `--overwrite-live`, so a re-run can't overwrite live data), `CLAUDE.md` and
  `wrangler.jsonc` (production is on D1, the secret), `package.json` (0.49.0 → 0.49.1),
  `.claude/todo/235-hasuraDecommission-BLOCKED.md` (notes from #234).
- Renamed: this file to `-BLOCKED.md`.
- Outside git: production Worker secret `DATA_BACKEND=d1`; the D1 database `todzz` (full copy).
  `READ_ONLY` was set and deleted again.

**Verification**
- `npm run check`: 0 errors, 0 warnings. `npx vitest --run`: 75 files, 705 passed, 21 skipped.
- The guard: `copy-from-postgres.mjs --remote --prod users` stops with its message.
- Live checks: step 4 above.

**Deviations**
- Runners were paused with SIGSTOP/SIGCONT on the runner loop, not stopped, so the agent
  sessions on karel (ezysmart-web) and mac kept going.
- Stripe test webhook: not possible (item 3). Google round trip, invitation accept and push:
  left for you (items 1 and 4). The 7-day watch moved to #235.
- Chain: next is `252-dropHasuraJwt`. It needs extension 1.3.0 in the Web Store, and only you
  can upload it. `235` needs the date 2026-12-02. So I queued nothing.
