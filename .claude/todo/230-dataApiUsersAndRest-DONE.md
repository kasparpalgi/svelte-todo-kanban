> Run with: Opus 5.5 / medium

# Data API: users and settings, notes, money, extras; then remove the browser GraphQL client

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Data API: users and settings, notes, money, extras; then remove the browser GraphQL client

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, sections 1, 5, 6 and 8. Needs `dataApiCards`first.

1. **Users:** GetUsers, UpdateUser, SearchUsers and GetUserByGithubUsername as ops. Other users get only `id, name, username, image`. **Then tighten Hasura's** `users` **select to** `id = X-Hasura-User-Id`: today any signed-in user can read every user's email and `settings` (226, Security). Move the encrypted tokens (`settings.tokens.github`, Google calendar) out of `settings` into a server-only `user_secrets` table, so a client settings save can never drop them (#193).
2. Notes (GetNotes, CreateNote, UpdateNote(s), DeleteNote, note uploads), money (clients, invoice companies, invoices, expenses), url shortcuts, push subscriptions, Claude usage, podcasts, tracker stats, news. Follow the owner's answer in 226, Decisions 3, for the dead features; archive their tables with `pg_dump` to R2 before dropping anything.
3. When nothing in `src/` imports `$lib/graphql/client`'s `request`, delete it along with `/api/auth/token`, the JWT minting and `ensureTokenForUser`. That also closes #224.

**Done when (deploy + live check):** check and tests pass. Deployed to Vercel and the Worker. Live as the test user: settings save (dark mode, locale); GitHub still connected after a settings save; notes CRUD; a short link redirects; the invoices and expenses pages load. A GraphQL query as the test user for another user's `email` returns nothing. The browser makes no request to `todzz.admin.servicehost.io` on any page.

*GitHub issue #230 — end the commit subject with* `(#230)`*.*

_From Kanban card `1c8f4a71-0e5b-40ce-86b8-3b9117b19d00`, moved to the agent list._

_GitHub issue #230 — end the commit subject with `(#230)`._

## Results

**Summary**

This run found the main work already committed in `fd3957e` by an earlier run that stopped
before writing Results. This run added the missing slice, the PBKDF2 re-hash, and did the
live check.

- **Already in `fd3957e`** (checked in this run):
  - users (`getMe`, `updateMe`, `disconnectIntegration`, `getBoardPeople`), notes, money
    (clients, invoice companies, invoices, expenses), short links, push subscriptions and
    Claude usage are server ops;
  - `src/lib/graphql/client.ts` is deleted. Nothing in `src/` imports it. That closes #224.
  - Hasura's `users` select for the `user` role is the caller's own row only.
- **New here, `23ce65b`: passwords are re-hashed to PBKDF2 at sign-in** (owner decision 2 in
  226, which #245 relies on).
  - A bcrypt hash is still checked by Postgres. On a good sign-in, and right after a
    sign-up, the app stores `pbkdf2$10000$<salt>$<hash>` (WebCrypto, about 4.6 ms at 10,000
    iterations).
  - After that, the app checks the PBKDF2 hash itself, without Postgres.
  - A failed re-hash never blocks the sign-in.

**Files changed**
- created `src/lib/server/pbkdf2.ts`
- modified `src/lib/server/password.ts` and `src/lib/server/__tests__/password.test.ts`
  (10 tests)
- modified `src/lib/graphql/documents.ts`: added `GET_PASSWORD_USER` and
  `SET_PASSWORD_HASH`. The format-on-edit hook also re-wrapped some lines in this file;
  only whitespace changed.
- regenerated `src/lib/graphql/generated/*`
- modified `.claude/todo/245-d1AuthAdapter.md` (handover) and `package.json` (0.35.1 → 0.36.0)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 56 files, 601 passed, 5 skipped.
- Deploys: Vercel finished deploying `23ce65b`; `wrangler deploy` uploaded version
  `7064a579`.
- Playwright against www.todzz.eu: 32/32 passed. Against the Worker: 32/32 passed. Both runs
  used the Playwright Chromium, because this runner has no Chrome; the config is unchanged.
- **Live re-hash:** the test user's hash was `$2b$10$` before the run and `pbkdf2$10000$`
  after the first password sign-in. The next sign-in passed through the PBKDF2 check.
- **Live as the test user**, with a throwaway spec that was deleted afterwards:
  - the dark mode and AI auto-correct (`settings`) switches were saved and switched back;
  - a dummy `settings.tokens.github` seeded before the saves was still there afterwards,
    and `getMe` showed `encrypted: true`, never the stored value;
  - notes: create, update, list and delete;
  - a short link answered 302 to its target;
  - the invoices, expenses, board and shortener pages loaded with status 200;
  - **the browser made no request to `*.servicehost.io` on any of these pages.**

  The seed, the note and the link were removed afterwards, and the settings are as they
  were.
- **Live Hasura, `user` role as the test user:** `users { id email }` returns only the
  user's own row. Another user's email is not readable.

**Deviations**
- **No `user_secrets` table in Postgres.** In `fd3957e`, `updateMe` keeps every
  server-managed token instead, so the browser can neither drop nor read one; the live check
  above confirms it. The table exists in the D1 schema (#232), and #243 fills it.
- **`/api/auth/token` and JWT minting stay** until the Chrome extension moves off them in
  #231, which has the handover. So #230's step 3 is done for the browser, not for the
  extension.
- **Locale:** the locale save was not clicked separately. It goes through the same
  `updateMe` op as dark mode.
- **Not yet re-hashed:** 13 of the 14 password users still have bcrypt hashes. Each moves
  to PBKDF2 on their next password sign-in. Anyone still on bcrypt at the D1 cut-over signs
  in with the email link (noted in #245).
