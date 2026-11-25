> Run with: Opus 5.5 / medium

# See if Hasura can be deleted from Hetzner

## Original Requirement

[NEVER REMOVE]

Todzz doesn't use anymore hasura on hetzner? If uses then move what's left to Cloudfare.

_From Kanban card `e960f6ac-b00a-4c99-8a79-ed122c039fff`, moved to the agent list._

_GitHub issue #262 — end the commit subject with `(#262)`._

## Results

_Checked 2026-11-25._

**Summary** — **No, Hasura on Hetzner can't be deleted yet. Production still runs on it.**
Every read and write on www.todzz.eu goes to Hasura/Postgres on Hetzner. What I checked:

- `www.todzz.eu` is served by the Cloudflare Worker `todzz` (`server: cloudflare`), but the
  Worker has no `DATA_BACKEND` var or secret (`wrangler.jsonc` sets `DATA_BACKEND=d1` only for
  `--env staging`). So every op takes the Hasura path.
- The production Worker's secrets still include `API_ENDPOINT` (the Hasura GraphQL URL) and
  `HASURA_ADMIN_SECRET`. These are what it uses today.
- `serverRequest` (direct Hasura) still has no D1 version in the GitHub webhook and the GitHub
  routes, `api/billing/*`, `api/keys`, `api/calendar-event` and `api/google-calendar/callback`.
  The rest of the code (every `/api/data` op, Auth.js, page loads, upload, the runner ops) can
  already run on D1, and it does on staging.

Moving the rest to Cloudflare is already split into one-session tasks. They are all in the
Backlog and none is queued, so I didn't redo or duplicate them here. In order:

1. `263-d1GithubWebhook-TODO.md` (#263): GitHub webhook on D1 (Opus / high). Queued.
2. `264-d1GithubRoutes.md` (#264): the other GitHub routes on D1 (Sonnet / high). In the Backlog,
   `> After: #263`. It changes the same GitHub code as #263.
3. `265-d1BillingKeysCalendar-TODO.md` (#265): Stripe, BYO keys and Google Calendar on D1
   (Sonnet / medium). Queued next to #263, since they share no files.
4. `234-d1CutOver-BLOCKED.md`: the cut-over itself. Turn on `READ_ONLY`, copy Postgres → D1
   (`scripts/d1/copy-from-postgres.mjs --remote --prod`), set `DATA_BACKEND=d1` on the
   production Worker, then check live.
5. `252-dropHasuraJwt.md`: once Chrome extension 1.3.0 is live in the Web Store (the last
   step of #231/#254, which only you can do). Extension 1.2.0 still talks to Hasura directly.
6. `235-hasuraDecommission-BLOCKED.md`: 7 days after the cut-over, `pg_dump` to R2, delete
   the Hasura code and deps. **Only then** delete the Hasura and Postgres apps on Hetzner.

**What I need from you**
- Queue #264 from the Backlog once #263 is done. (#263 and #265 are already queued. Until
  2026-11-25 none of the three had a card or issue. The runner had missed them when #258 added them.)
- Upload extension 1.3.0 to the Chrome Web Store (from #254), if you haven't yet.
- When 1–3 are done, pick a quiet moment and queue 234 again.

**Files changed** — this task file only (Results added, renamed to `-BLOCKED.md`).

**Verification** — `curl -I https://www.todzz.eu` → `server: cloudflare`; `npx wrangler
secret list` (production) → no `DATA_BACKEND`, `API_ENDPOINT` + `HASURA_ADMIN_SECRET`
present; grep of `src/` for `serverRequest` lists the routes above. No code changed, so no
check/test run was needed.

**Deviations** — Nothing moved to D1 in this session: every remaining piece already has its
own sized Backlog task, and the cut-over needs your go-ahead. No version bump (no code change).
