> Run with: Opus 5.5 / high
> Machine: mac

# Speed up auth token endpoint

## Original Requirement

[NEVER REMOVE]

Follow-up from #209: 207 `Slow token fetch` warnings in 5 weeks — `/api/auth/token` takes p50 1.7 s, max 11.8 s, and every page load waits for it before its first GraphQL query.

It runs `locals.auth()`, a `users_by_pk` existence check against Hasura, then signs the JWT. Find where the time goes (Vercel cold start, Auth.js session lookup, the Hasura round trip) and cut it.

_From Kanban card `7a6a3c6f-a4fc-45f4-8a5a-252e2b0ec249`._

_GitHub issue #213 — end the commit subject with `(#213)`._

## Results

**Summary** — Found where the time goes and cut the two server-side costs:

1. **Wrong region (main cause).** Production `x-vercel-id` is `arn1::iad1::…`. Users reach
   the Stockholm edge, but the function runs in **iad1 (Washington)**. Hasura is on Hetzner
   in Helsinki (`65.109.175.163`, ~10 ms from Tallinn). So every token mint did browser →
   Washington, then Washington → Helsinki for the `users_by_pk` check (new TLS connection
   on a cold instance), then back. Even an unauthenticated 401 from prod takes 200–290 ms. The same
   endpoint run locally, signed in and with the Hasura check, takes **20–35 ms**.
   `svelte.config.js` now uses `@sveltejs/adapter-vercel` with `regions: ['arn1']`. It is the
   same adapter-vercel@6 that adapter-auto installed on Vercel; only the `regions` option is new.
   This fixes SSR and every other API route too, not just the token.
2. **Auth.js ran twice per request.** `securityHandle` and the endpoint (and on pages, the
   layout load) each called `locals.auth()`, and each call does a full JWE decrypt, the
   callbacks and a re-encrypt. A new `memoAuthHandle` shares one result per request. Measured
   on the dev server: 2 → 1 `auth()` runs per token request.
3. **Failed Google refresh retried on every request.** On a failed refresh the old
   `expires_at` stayed, so every `auth()` call went to Google again (twice per token mint,
   because of #2). It now waits 5 min before retrying and clears `error` on success. Only Kaspar's
   (Google) account logs these warnings: 210 rows, one user, 23 sessions. I couldn't tell
   whether his refresh token is failing: Vercel CLI isn't logged in here, so I had no access
   to function logs. This is insurance either way.

The `users_by_pk` check stays. With the function next to Hasura it costs ~10 ms, and it
guards #193.

Not done: cold starts (max 11.8 s) can't be measured without Vercel logs. They should
shrink with the Hasura hop gone. Removing the browser round trip entirely (token minted
during SSR) is filed as Backlog follow-up `224-seedTokenFromSsr.md`.

**Files changed**
- modified `svelte.config.js` — adapter-vercel with `regions: ['arn1']` on Vercel builds
- modified `src/hooks.server.ts` — `memoAuthHandle`; refresh-failure backoff
- modified `package.json` / `package-lock.json` — `@sveltejs/adapter-vercel@^6.3.5` (devDep,
  lockfile only adds packages), version 0.27.3 → 0.27.4
- created `.claude/todo/224-seedTokenFromSsr.md` (Backlog follow-up)

**Verification**
- `npm run check` — 0 errors, 0 warnings
- `npm test` — 43 files / 430 tests pass
- `VERCEL=1 vite build` — passes; the generated `.vc-config.json` has `"regions": ["arn1"]`
- `vite build` (Cloudflare) — passes
- Live, dev server, signed in as the test user: `/api/auth/token` 200 in 20–35 ms with
  correct claims; anonymous request 401; one `auth()` run per request
- Playwright `authenticated` (authenticated + card-detail specs) — 7/7 pass
- After the deploy: confirm prod `x-vercel-id` ends `::arn1::` and watch the
  `Slow token fetch` count in `logs`

**Deviations** — Kept the Hasura existence check rather than caching or dropping it. Once the
region is fixed it is cheap, and it protects against stale-user JWTs (#193).
