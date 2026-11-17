> Run with: Opus 5.5 / high
> Machine: windows

# D1: Auth.js on D1 and the staging proof

## Original Requirement

[NEVER REMOVE]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

1. Auth.js: `@auth/d1-adapter` 1.11 instead of `HasuraAdapter` when `DATA_BACKEND=d1`,
   wrapped so `createUser` calls `signUp()` (`src/lib/server/ops/d1/signUp.ts`: username
   from email, first board and its owner row, one batch — already tested) and `deleteUser`
   never touches the missing `sessions` table. Password sign-in: PBKDF2 only, per the
   owner's decision (no bcrypt in the Worker); a user still on bcrypt uses the email link.
   Email-link tokens: `verification_tokens`.
2. The staging proof (`233`'s "done when"): refresh `todzz-staging` (one table at a
   time if the full refresh would pass 100k writes in a day — see `232`'s notes), then
   `E2E_BASE_URL=https://todzz-staging.svelte-todo-kanban.workers.dev npx playwright test`
   passes, plus a manual pass as the test user: board, card, comment, invite, settings,
   notes. Run the full contract suite (`CONTRACT=1 CONTRACT_WRITES=1 …`) once more.
3. Measure each op's CPU on staging (Workers Observability) against Free's 10 ms; hand
   anything over to #236.

Needs 241–244 first.

**Done when:** staging signs in, signs up and passes the e2e suite on D1 alone (no Hasura
request in its logs), all contract cases are equal, and production is deployed and still on
Hasura.

## Handover from #230

- PBKDF2 is live since `23ce65b`: `src/lib/server/pbkdf2.ts` (`hashPbkdf2`, `checkPbkdf2`,
  `isPbkdf2`), format `pbkdf2$<iterations>$<salt b64>$<hash b64>`, SHA-256, 10,000
  iterations (~5 ms). Every password sign-in and sign-up on Hasura now stores one, in
  `users.password`. On D1, `verifyUserPassword` only needs the `isPbkdf2` branch; a
  remaining `$2…` hash means "use the email link".
- On 2026-11-13, 14 users had a password and only the test user had been re-hashed. Count
  `password LIKE '$2%'` just before the cut-over to see who still needs the email link.

_GitHub issue #259 — end the commit subject with `(#259)`._

_From Kanban card `b936cea3-8124-41aa-a536-c20097312c03`, moved to the agent list._

## Results

**Summary** — Auth.js runs on D1 when `DATA_BACKEND=d1`. Staging signs in, signs up, takes the
email link and passes the e2e suite on D1. The rest of the staging proof (settings and notes,
"no Hasura request in its logs", the full contract run, CPU per op) moved to the Backlog
follow-up `264-d1StagingProof.md`. It needed #257 and #258, which were still running on other
machines when this run began. Both landed on `main` before this push.

- `src/lib/server/auth/d1.ts`: `d1Auth(binding)` returns the adapter and the two password
  functions. The adapter is `@auth/d1-adapter` with two overrides. `createUser` calls
  `signUp()`, so a new user gets a username, a first board and its owner row in one batch.
  `deleteUser` deletes the user row; `accounts` goes with it through the cascade, and the
  missing `sessions` table is never touched. Password sign-in checks PBKDF2 only. A `$2…`
  hash never matches, so that user takes the email link. Sign-up stores a PBKDF2 hash.
  Email-link tokens go to `verification_tokens` through the adapter.
- `hooks.server.ts`: `backend(event.platform)` picks Hasura (the default) or D1 for each
  request. The password provider is built from the chosen backend's functions. Production
  doesn't set `DATA_BACKEND`, so it runs exactly as before.

**Files changed**
- Created: `src/lib/server/auth/d1.ts`, `src/lib/server/auth/__tests__/d1.test.ts`,
  `src/lib/server/auth/__tests__/d1EmailLink.test.ts`, `.claude/todo/264-d1StagingProof.md`
  (Backlog follow-up)
- Modified: `src/hooks.server.ts`, `src/lib/server/db/__tests__/sqliteD1.ts` (adds `first()`,
  which the adapter uses), `package.json` / `package-lock.json` (`@auth/d1-adapter`, version
  0.45.0 → 0.46.0)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `npm test`: 656 passed, 17 skipped. One earlier run
  had 4 failures in `todosConcurrency.svelte.test.ts` under load. The file passes on its own
  and in the next full run, and this change doesn't touch it.
- New unit tests, run on a migrated SQLite through the real adapter (8 tests):
  - `createUser` runs `signUp`
  - Google account link and lookup
  - an email token can be used once
  - `deleteUser` works without a `sessions` table
  - PBKDF2 sign-up and sign-in, including a wrong password and an unknown email
  - a taken email is refused
  - a bcrypt hash is refused
  - the whole email-link flow through `@auth/core`'s `Auth()`: send, open, then the new user
    has a username and a board, and the token is gone
- Staging `todzz-staging`, deployed with `DATA_BACKEND=d1` (version `2bb29ed4`, workers.dev only):
  - Password sign-in as the test user passed (`e2e/auth.setup.ts`). The staging copy still had
    their old bcrypt hash, so I first copied their current PBKDF2 hash from Postgres. That was
    one row.
  - A UI sign-up as `d1-signup-259@example.com` landed on `/et/d1-signup-259/d1-signup-259s-board`.
    In D1: a PBKDF2 hash, the board and the owner row.
  - "Email me a link" wrote the token to `verification_tokens`. To check the link itself, I
    inserted a token row for a raw token I knew. A new user got a user row, a username, a
    board, an owner row and `emailVerified`. Existing users (a throwaway one and the test user)
    signed in. Opening the same link again gave `error=Verification`.
  - `E2E_BASE_URL=https://todzz-staging.svelte-todo-kanban.workers.dev npx playwright test`:
    **32 passed**.
  - Cleanup: I deleted the three throwaway users and their tokens. Afterwards there were no
    leftover boards and no orphan members.
- Production: still on Hasura (no `DATA_BACKEND`). CI deploys it on push.

**Deviations**
- `@auth/d1-adapter` **1.10.0**, not 1.11. Version 1.11.x pins `@auth/core` 0.41.3, and
  we're on 0.40.0 (`@auth/sveltekit` 1.10.0), so it would bundle a second core. 1.10.0 pins
  0.40.0 and has the same SQL.
- Parts 2 (refresh, manual pass, no-Hasura logs, contract run) and 3 (CPU) moved to
  `264-d1StagingProof.md`. When this run started, #257 and #258 hadn't landed yet.
- Open question: on the first staging deploy (`6cc79fe4`), five hand-made email-link tokens
  were refused, even though the row and the hash matched. After a redeploy with Auth.js `debug`
  on, the same check passed. It also passed on the next deploy without debug (the same code
  as the first), several times. The likely cause: other runs were deploying
  `todzz-staging` at the same time. #257's Results say so, and the windows run claimed this
  same task at 13:16, so a different build was probably serving those requests. The follow-up
  re-checks the email link.
- The real email goes out through nodemailer on the Worker. It logged "Failed to resolve IPv4
  addresses", so delivery on Workers is unproven. That is #254's open item, not the adapter.
- **Duplicate run:** windows claimed 259 at 13:16 (`7f8a7e1`) while this run (karel's
  `run/259-d1AuthAdapter` worktree) was already working on it. Whichever run pushes second
  should keep this result and drop its own copy.
