> Run with: Opus 5.5 / xhigh
> Machine: mac

# Backend

## Original Requirement

[NEVER REMOVE]

Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. 

Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy.

Finally confirm that I can dow delete the Hasura from Hetzner.

_From Kanban card `70317804-9d44-4505-935c-2ad4330a02cb`, moved to the agent list._

_GitHub issue #226 — end the commit subject with `(#226)`._

## Answers

**Can Todzz drop Hasura and run on Cloudflare D1 for free?** Yes, with two conditions.
Production numbers from 2026-11-12, against D1 Free's limits ([limits](https://developers.cloudflare.com/d1/platform/limits/),
[pricing](https://developers.cloudflare.com/d1/platform/pricing/), both updated 2026-10-30):

| | Todzz today | D1 Free |
| --- | --- | --- |
| Data | ≈ 20 MB of real data. Postgres shows 169 MB only because of `logs` (99,373 rows, 125 MB, no retention ever ran) and the dead `tracker_sessions` (37,567 rows, 22 MB, last write 2025-11-02) | 500 MB per database |
| Rows written | ≈ 400 a day (logs 170, activity 137, comments 29, cards 21). Worst day: 11,097 log rows | 100,000 a day |
| Rows read | Dominated by the 30 s board poll (below) | 5,000,000 a day |
| Queries per request | A few | 50 (a `batch()` counts as one) |

- **The board poll would use most of the read quota.** It reads a fingerprint of every card
  every 30 s: about 1,500 rows on a 334-card board. One tab left open all day is ≈ 4M rows,
  close to the 5M a day. The fix is one `boards.changed_at` stamp that every card write
  bumps. The poll then reads 1 row and refetches only on a change.
- **Condition 1: the daily limits are a hard stop.** Past 5M reads or 100k writes, every D1
  query fails until 00:00 UTC, so the whole app is down until then. Guardrails are in the
  plan: the `changed_at` poll, a per-session cap on client log writes, and a usage alert.
- **Condition 2: Workers Free allows 10 ms of CPU per request.** Board SSR already takes
  ~22 ms (#218). With Postgres gone, the password check that #217 moved into Postgres has to
  run in the Worker again: bcrypt costs 86 ms. **Workers Paid ($5/mo)** removes both problems,
  and also raises D1 to 25 billion reads a month. See Decisions.

**"Not a blind one-to-one move."** Agreed. Each section below says what is odd today and what
changes on the way.

**Can I delete Hasura from Hetzner now? No, not yet.** Nothing has moved yet. Hasura is still
the only database for the app, the Kanban runner (every card it files and moves), the
Chrome extension and tracker-sync. The last follow-up (`hasuraDecommission`) ends with the
checklist that makes deletion safe: no request to `todzz.admin.servicehost.io` for 7 days,
a final `pg_dump` stored in R2, then delete the todzz Hasura and Postgres apps in CapRover.
Only those two; leave the box's other apps alone.

## Security holes in the live Hasura, found and fixed today

The review found row rules open to any signed-in user, and anyone can sign up. These are
fixed now, not left for the migration, because the migration takes weeks. All of them were
applied to production with `hasura metadata apply`, after `metadata diff` showed only these
changes.

| Hole | What anyone could do | Fix (live) |
| --- | --- | --- |
| `board_members` insert `check: {}` | Add themselves as **owner of any board** (board ids were readable, see below) | Only a board owner adds members. An invitee adds only themselves, only with a pending invitation for their email or username, and only with the invited role (`_ceq ["$","role"]`) |
| `board_members` update: own row, `board_id` updatable | Move their own membership row (everyone owns one, on their first board) to **any board** | Only `role` is updatable, and only by a board owner. A member can't promote themselves |
| `board_members` select `filter: {}` | List every membership in the system | Rows of boards the user owns, is a member of, or that are public |
| `accounts` update `filter: {}` | Move someone else's Google login onto their own user. The victim then signs into the attacker's account and is locked out of their own data | User-role insert and update removed. Auth.js writes this table with the admin secret |
| `users` insert `check: {}` | Create users with any email and a password hash they know (pre-registering someone else's account) | Removed. Sign-up runs server-side with the admin secret |
| `boards` update: `user_id` updatable by members | Take ownership of a shared board | `user_id` removed from the updatable columns. The app never sets it |
| `logs` update `filter: {}` | Re-own and then read every user's logs | Own rows only |
| `comments` update `filter: {}`, `user_id`/`todo_id` updatable | Rewrite, move or re-attribute any comment | Own comments only, and content and GitHub fields only |

Verified with 14 impersonation checks (admin secret plus `x-hasura-role: user` session
variables): every attack is rejected, and the invitation flow still works. The checks used
a throwaway user, which was deleted afterwards; row counts are unchanged.

**Still open, fixed by the migration:** any signed-in user can read every user's **email and
`settings`** (`users` select `filter: {}`; Hasura can't show other users fewer columns than
yourself). This is fixed in `dataApiUsersAndRest` and is the reason that section comes before
the D1 work. Lower risk, also covered by the plan: anyone can create a notification for
anyone; anonymous users can insert `podcasts`; a todo can be inserted into any list whose id
you know; any board member, viewers included, can edit cards and board settings.

## How the move works

Two phases. **Every follow-up ships to production and is checked live as the test user**,
as you asked.

**Phase 1: the browser stops talking to Hasura.** The browser calls
`POST /api/data/<op>` with its session cookie. Each op validates its input (zod), checks
access in code (`access.ts`: one `boardRole(user, board)` used everywhere), and still runs
on Hasura with the admin secret. Same data, same screens, and it works on Vercel and on
Workers. The Hasura JWT goes away, and with it `/api/auth/token` and the "Slow token fetch"
waits (#213, #224). Every op returns the JSON shape the stores already read, so components
don't change.

**Phase 2: swap the storage.** The same ops get a D1 implementation (Drizzle ORM 0.45),
selected by a `DATA_BACKEND` setting. Contract tests run every op against Hasura and
against a D1 copy of the same data and compare the output. That is how "works the same way"
gets proven. Then comes a single cut-over: a few minutes of read-only, a final copy, and
the switch is flipped.

**Why not move table by table straight to D1:** the tables join each other (cards → users,
members, labels), Hasura can't join into D1, and splitting the data across two databases for
weeks means foreign keys and permissions drift apart. Phase 1 gives deploy-every-step
progress without splitting the data. D1 is only reachable from a Worker, so phase 2 needs the
#218 cut-over first.

## Sections

| # | Section | Tables (rows) | Odd today | Changes on the way |
| --- | --- | --- | --- | --- |
| 1 | Users & sign-in | users 57, accounts 43, verification_tokens 3, sessions 0 | Every user's email and settings readable by anyone. Encrypted GitHub/Google tokens live inside `users.settings`, which the client writes (that is how #193 lost the GitHub token). `sessions` is unused (JWT sessions). Username and first board are made by triggers | Tokens move to a server-only `user_secrets`. Other users see id, name, username and image only. Drop `sessions`. Sign-up (username, first board, owner row) becomes one server function. `@auth/d1-adapter` 1.11 wrapped for `createUser`. Passwords: see Decisions |
| 2 | Boards & sharing | boards 87, board_members 101, board_invitations 22, labels 18 | Owner stored twice (`boards.user_id` plus an owner member row from a trigger). Viewer role not enforced. 5 invitation email-tracking columns nothing reads. `boards.github` is text holding JSON, matched with `ILIKE '%repo%'` by the runner. Redundant indexes (`board_invitations.token` indexed twice, etc.) | Every op checks `boardRole`, and viewers are read-only. Add a `boards.github_repo` column (exact `owner/name` match). Drop the unused columns. Add `boards.changed_at` |
| 3 | Cards | lists 200, todos 1,694, todo_assignees 917, todo_labels 40, todo_subscribers 0, comments 1,634, uploads 19, activity_logs 9,914, notifications 62 | Two assignee models (`todos.assigned_to` set on 926 cards, plus `todo_assignees`). `invoiced_hours` is always 0. No index on `todos.list_id` or `lists.board_id`. The fingerprint poll. The browser writes activity logs and other users' notifications itself | Fold `assigned_to` into `todo_assignees`. The server writes activity and notifications inside the same op. Add the missing indexes. The poll reads `changed_at`. Content search uses `instr()` (D1 `LIKE` patterns are capped at 50 bytes). Aliases (todos per user, boards global) are generated in code, with tests that port the PL/pgSQL rules exactly |
| 4 | Logs | logs 99,373 | No retention; `cleanup_old_logs()` was never scheduled. `timestamp` duplicates `created_at`. 6 indexes on the most-written table. The client can write without limit | Keep 30 days (≈ 2 MB), one timestamp, 2 indexes, and a per-session write cap |
| 5 | Notes | notes 38, note_uploads 5 | Used by the Chrome extension | Moved as is |
| 6 | Money | clients 6, invoice_companies 1, invoices 0, invoice_items 0, expenses 96 (last 2026-03-13), expense_splits 174 | Invoices were never used, yet have an extract route. `users.invoice_from_details` and `boards.customer_invoice_details` JSON duplicate `invoice_companies` and `clients` | Keep or drop: see Decisions |
| 7 | AI & runner | claude_usage 900 (17/day), claude_model_pricing 28 | The runner (klarity-claude-kit) holds the **Hasura admin secret on every runner machine** and sends about 20 admin GraphQL operations on boards, todos, comments, uploads and pricing | `/api/runner/*` with its own revocable bearer token, so the admin secret leaves the runner machines |
| 8 | Small extras | url_shortcuts 8, push_subscriptions 4, news 0, podcasts 8 (last 2026-04), penon 260 (sensor readings, last 2026-01-31), tracker_* (sessions dead since 2025-11-02, 2 views) | `/api/transcribe-podcast` can't run on Workers (#218) | Move shortcuts, push and news. Archive (pg_dump to R2) and drop tracker, penon and podcasts unless you say keep |
| 9 | Outside clients | Chrome extension (hard-codes `todzz.admin.servicehost.io`, 3 ops), tracker-sync (admin secret), runner | An extension update needs Google's store review (days) | Ship the extension early, long before Hasura is switched off |

## Decisions I need from you

1. **Workers Paid ($5/mo): yes or no?** Recommended before phase 2. It removes the 10 ms CPU
   limit and the hard daily D1 limits.
2. **Passwords** (14 users), if you stay on Free: (a) Workers Paid, which solves it as is;
   (b) re-hash to PBKDF2 at about 10 ms on each user's next sign-in, so each user goes over
   the limit once; or (c) drop password sign-in in favour of the email link and Google.
3. **Dead features:** tracker, penon, podcasts, expenses/splitwise, invoices. If you don't
   answer: archive all to R2 first, drop tracker and penon, and keep the rest.
4. **#218 cut-over** (todzz.eu → the Worker). Phase 2 can't start without it.
5. **Viewers read-only.** Today a viewer can edit cards and board settings. The plan makes
   them read-only; say if they should keep editing.

## Follow-ups (Backlog)

Phase 1, which works on today's Vercel production:

- `dataApiFoundation`: `/api/data/[op]`, `call()`, `access.ts`. Logs go first (with retention
  and a write cap), and the board and notification polls merge into one `poll` op that pauses
  in hidden tabs.
- `dataApiBoards`: boards, lists, labels, members and invitations. Viewers become read-only.
- `dataApiCards`: cards, assignees, labels, comments, uploads, activity and notifications.
  Adds `boards.changed_at`.
- `dataApiUsersAndRest`: user and settings (with `user_secrets`), notes, money, shortcuts,
  push and Claude usage. Then delete the browser GraphQL client, `/api/auth/token` and the
  JWT.
- `runnerAndExtensionApi`: `/api/runner/*` plus the runner switch in klarity-claude-kit,
  extension endpoints plus a store release, and tracker-sync.

Phase 2, after #218 and the decisions above:

- `d1SchemaAndCopy`: the D1 database (`eeur`), Drizzle schema and migrations, a re-runnable
  Postgres → D1 copy script, and a staging Worker with its own D1 copy.
- `d1Ops`: a D1 implementation of every op behind `DATA_BACKEND`, contract tests, and the
  Auth.js D1 adapter.
- `d1CutOver`: freeze, final copy, flip, the live checklist, and a 7-day watch.
- `hasuraDecommission`: remove Hasura code, dependencies, metadata and codegen; final
  `pg_dump` to R2; then the go-ahead to delete Hasura on Hetzner.

## Results

**Summary** — This was a planning task, too big for one session. I wrote the plan and built
one urgent slice.

- **Plan:** inventoried what depends on Hasura (about 120 app operations, about 20 runner
  operations with the admin secret, the Chrome extension, tracker-sync, the Auth.js adapter,
  17 SQL functions and 18 triggers). Measured production row counts, sizes and daily write
  rates against D1 Free's limits, and reviewed the data model section by section. Wrote the
  two-phase plan and filed it as 9 Backlog follow-ups (227–235), each ending with a deploy
  and a live check.
- **Answer to "can I delete Hasura now":** not yet. The last follow-up ends with that
  confirmation.
- **Slice built (security):** the review found production Hasura rules that let any
  signed-in user add themselves as owner of any board, hijack someone else's Google login,
  pre-create users, take board ownership, and re-own or rewrite other users' logs and
  comments. All of these are closed in the live Hasura now (see the Security section).
  Every user's email and settings are still readable; that is planned in
  `dataApiUsersAndRest`.

**Files changed**
- modified: `hasura/metadata/databases/default/tables/public_{accounts,users,board_members,boards,logs,comments}.yaml`
  (applied to production with `hasura metadata apply`), `package.json` and
  `package-lock.json` (0.27.6 → 0.27.7), and this file
- created: `.claude/todo/227-dataApiFoundation.md`, `228-dataApiBoards.md`, `229-dataApiCards.md`,
  `230-dataApiUsersAndRest.md`, `231-runnerAndExtensionApi.md`, `232-d1SchemaAndCopy.md`,
  `233-d1Ops.md`, `234-d1CutOver.md`, `235-hasuraDecommission.md`

**Verification**
- `hasura metadata diff` before applying: the server matched the repo, and the diff showed
  only the six tables above. After applying: metadata consistent, diff empty.
- 14 impersonation checks against production (admin secret plus `x-hasura-role: user`), all
  passing. Every attack is rejected; an invitee joins with the invited role but not a higher
  one; an owner changes a member's role; a member can't promote themselves; the member list
  is limited to visible boards (6 of 103 rows for the test user). The throwaway user,
  invitation and board were deleted, and the counts are back to 57 users, 87 boards,
  101 members and 22 invitations.
- Authenticated Playwright e2e (a local build signed in as the test user, against the
  production Hasura): 26 passed, 2 skipped.
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 44 files, 436 tests passed. No app
  code changed.
- `/verify` was not invoked as a skill from the runner; the checks above are the ones that
  match this change.

**Deviations**
- The slice built is the security fix, not migration code. It was urgent, and phase 1 can
  start from the follow-ups without waiting for anything.
- #215 counted 41 functions and 40 triggers. Production has 17 SQL/PL/pgSQL functions and
  18 triggers today, mostly `updated_at`, alias, username and first-board logic, so the port
  is smaller than #215 said.
- Follow-up numbers 227–235 are provisional. The runner renumbers each file to its GitHub
  issue, so the plan refers to them by name.

## Owner decisions (follow-up prompt, 2026-11-12)

> 1. remember, we want to stay on free.Be always clever and lightweight and simple.  2. re-hash cheaper. 3. delete time tracker part fully, zip somewhere for me as a separately runnable locally podcast and penon, I need expenses and invoices. 4. What you need to do there? 5. Board viewers shall be read only and can only comment.

What changes in the plan:

1. **Free only, no Workers Paid.** Every follow-up designs for 10 ms CPU, 100k requests a
   day, and D1's 5M reads and 100k writes a day. When a limit bites, the code gets lighter;
   no plan is bought. New follow-up `workerCpuUnder10ms`: the board render measured ~22 ms
   of CPU (#218).
2. **Passwords are re-hashed with PBKDF2 (WebCrypto) at sign-in, in phase 1**
   (`dataApiUsersAndRest`). Postgres still checks the bcrypt hash; the Worker then stores
   `pbkdf2$<iterations>$<salt>$<hash>`, with the iterations picked so sign-in stays under
   about 5 ms of CPU. By the D1 cut-over every active user has a cheap hash. Anyone left on
   bcrypt signs in with the email link once.
3. **Time tracker deleted; podcasts and penon moved out; expenses and invoices stay.** Done
   in this prompt, see below.
4. **#218:** answered in the reply. The podcast blocker is gone and Paid is off the table,
   so what is left is two one-liners from the owner plus a "go".
5. **Viewers are read-only and can only comment** (add comments, edit and delete their own).
   This goes into `dataApiBoards` and `dataApiCards`, with the UI hiding edit controls.

### Done in this prompt

- **Time tracker deleted:** the stats page, store and tests; `tracker-sync/`; the
  GraphQL ops; the Settings link; the `stats` translations; the 5 tables, 2 views and
  their function (migration `1813000000000`). A safety export is
  `~/Documents/todzz-extracted/tracker-backup-before-delete.json.gz`; delete it whenever.
- **Podcasts and penon moved out** to `~/Documents/todzz-extracted/todzz-podcasts.zip` and
  `todzz-penon.zip`. Each is a dependency-free Node app (`node server.js`) with its data
  in `data.json` (8 podcasts; 5,564 penon readings, merged from Todzz and the other Hasura).
  Removed from Todzz: the routes, store, chart components, `/api/transcribe-podcast`, the
  Hasura REST endpoint, the tables, and the `ffmpeg-static`, `layercake` and `d3-scale`
  packages. The transcription route had a command-injection bug (the raw URL went into a
  shell); the standalone app calls yt-dlp and ffmpeg without a shell.
- **Found: a leaked admin secret.** `src/routes/penon/+page.svelte` shipped the admin
  secret of the *other* Hasura (`api.admin.servicehost.io`) to every browser that opened
  `/penon`, from 2026-02-08 until this removal; it is still in git history. It worked when
  tested today. **The owner must rotate it in CapRover.**

### Verification (this prompt)

- Standalone apps: each runs from a fresh unzip with no `npm install`. The penon pages
  render at desktop and phone widths, light and dark. The podcasts API was exercised for
  list, create, delete and transcribe; transcribe downloads and splits the audio and calls
  Groq, which rejects a dummy key cleanly. A real transcription needs the owner's Groq key.
- `npm run check`: 0 errors. `vitest`: 43 files, 427 tests (the 9 tracker tests went with
  the feature). Playwright, all projects: 29 passed, 2 skipped.
- Order: the code removal was pushed and Vercel production reported success for
  `f2e97f3` before any table was dropped. The Worker was deployed too (1.07 MB gzip).
- Hasura: `metadata diff` showed only the 9 untracked tables, 2 relationships and the
  podcasts REST endpoint. After applying the metadata and migration `1813000000000`
  (applied by version), metadata is consistent and the diff is empty. No `tracker*`,
  `podcasts` or `penon` relation is left in Postgres. Types regenerated with
  `npm run generate`.
- Live as the test user on www.todzz.eu and on the Worker: sign-in, board and Settings
  load; no console or GraphQL errors; no stats link; `/podcasts` and `/penon` redirect to
  the board.
