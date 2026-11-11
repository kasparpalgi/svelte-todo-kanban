> Run with: Opus 5.5 / high

# Hand the Hasura JWT to the browser with the page

## Original Requirement

[NEVER REMOVE]

Follow-up from #213. Every page load still makes one browser → `/api/auth/token` round trip
before its first GraphQL query. #213 cut its cost: functions now run in Vercel arn1 next to
Hasura (it was iad1), and Auth.js runs once per request instead of twice. But the round trip itself is still there.

Idea: mint the token during SSR (root `+layout.server.ts` already has the session) and seed
the client cache in `src/lib/graphql/client.ts` with it, so the first query starts at once.
Watch out for:

- The root layout load reads `url.pathname`, so it re-runs on every client navigation.
  Don't mint (or run the `users_by_pk` check) on each one.
- The token would sit in page HTML. Pages are already `no-store`. Keep the per-user
  `ensureTokenForUser` guard (#178/#193/#195) so a stale token never crosses accounts.

First measure prod after #213 deploys (the `Slow token fetch` warnings in `logs`). If
they're gone, close this as not needed.

_GitHub issue #224 — end the commit subject with `(#224)`._

_From Kanban card `7525c783-bcdc-47c1-81ad-56b9e85273ba`, moved to the agent list._

## Results

**Summary** — Did the measurement step only; built nothing. The task gates the work on
"first measure prod after #213 deploys", and that cannot be judged yet: #213 (`1fb89fb`)
was pushed at 2026-11-11 22:33 UTC and this run started 15 minutes later.

Prod `logs`, `message = 'Slow token fetch'` (admin query, 2026-11-11 22:48 UTC):

- 210 rows since 2026-10-04; 26 since 2026-11-01, all from one user, all browser-side.
- One page load writes one row per query waiting on the token (3–8 rows in a burst), so
  November is **~12 slow page loads in 11 days** — roughly one a day. Token waits were
  1.0–3.0 s, with one outlier at 11.8 s (2026-11-03).
- Latest row: **2026-11-09 12:18 UTC**, which is before #213. Since 22:33 UTC there has been
  exactly 1 log row of any kind (an unrelated `CreateTodo` `todos_user_id_alias_unique`
  violation), so "no warnings since deploy" is just no traffic yet, not evidence.

At about one hit a day, a clean week is the least that means anything.

**What I need from a person** — after **~2026-11-19**, run the query below (or re-queue this
card and the next run will):

```graphql
query { logs(where:{message:{_eq:"Slow token fetch"}, created_at:{_gte:"2026-11-11T22:33:00Z"}},
             order_by:{created_at:desc}) { created_at data } }
```

- **No rows** (with normal use that week) → close as not needed (rename `-DONE.md`).
- **Rows still there** → re-queue; the plan in the Original Requirement stands: mint in root
  `+layout.server.ts` only on the first SSR load (not on client navigations), seed the
  browser cache in `client.ts`, keep `ensureTokenForUser`.

**Files changed** — modified: this task file only (Results + rename to `-BLOCKED.md`).
**Verification** — none needed; no code changed. Prod query output is summarised above.
**Deviations** — None. No version bump, since nothing shipped.
