> Run with: Opus 5.5 / medium
> Machine: mac

# Check passwords in Postgres instead of bcryptjs in the app

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Check passwords in Postgres instead of bcryptjs in the app

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request: "Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? … Is Hasura really needed?"

Workers Free allows 10 ms CPU per request. A bcryptjs cost-10 compare takes 86 ms, so email/password sign-in (14 of 57 users) and sign-up would fail there. Postgres already has `pgcrypto` 1.3, and #215 tested that it verifies the stored `$2b$` hashes when the prefix is read as `$2a$`:

```sql
crypt(pw, '$2a$' || substr(hash, 5)) = '$2a$' || substr(hash, 5)   -- right pw → t, wrong → f
```

1. Migration: add SQL functions `verify_user_password(email, password)` returning the user row (or nothing) and `hash_password(password)` returning `crypt(password, gen_salt('bf', 10))`. bcryptjs reads that `$2a$` output too. Track the functions in Hasura as **admin-only**: no role permissions.
2. `src/lib/server/password.ts` and the Credentials provider in `src/hooks.server.ts` call them through `serverRequest`. Existing hashes keep working without a rehash.
3. Remove `bcryptjs` and `@types/bcryptjs` if nothing else uses them.
4. Check: unit tests for `password.ts` with the request mocked, `npm run check`, then sign-up and sign-in by hand with a new account and with an existing password user.

*GitHub issue #217 — end the commit subject with* `(#217)`*.*

_From Kanban card `6d04e62d-1052-4e4b-a38b-ca47eb2a475f`, moved to the agent list._

_GitHub issue #217 — end the commit subject with `(#217)`._

## Results

**Summary** — Postgres (pgcrypto) now hashes and checks passwords; the app no longer runs bcrypt.
- Migration `1810000000000_password_functions_in_postgres`: `hash_password(plain)` (untracked helper,
  `crypt(pw, gen_salt('bf', 10))`), `verify_user_password(user_email, user_password)` and
  `create_password_user(user_email, user_name, user_password)`, both `RETURNS SETOF users`.
  Existing `$2b$` hashes are read as `$2a$`, so no rehash. Applied to the remote todzz DB.
- `src/lib/server/password.ts` → `verifyUserPassword` / `createPasswordUser` via `serverRequest`;
  the Credentials provider in `hooks.server.ts` shrank to ~10 lines (no inline GraphQL, no `GraphQLClient`).
- `bcryptjs` and `@types/bcryptjs` removed. Version 0.26.2 → 0.26.3.

**Files changed**
- Created: `hasura/migrations/default/1810000000000_password_functions_in_postgres/{up,down}.sql`,
  `hasura/metadata/databases/default/functions/{functions,public_verify_user_password,public_create_password_user}.yaml`,
  `src/lib/server/__tests__/password.test.ts`
- Modified: `hasura/metadata/databases/databases.yaml`, `src/lib/server/password.ts`, `src/hooks.server.ts`,
  `src/lib/graphql/documents.ts`, `src/lib/graphql/generated/*`, `package.json`, `package-lock.json`

**Verification**
- Hasura: admin gets the user for the right password and `[]` for a wrong one; `user`, `anonymous` and
  no-header requests get "field not found" for both functions ✅
- `password.test.ts` 5/5; `npm test` 42 files / 426 tests ✅; `npm run check` 0 errors ✅
- Live, dev server → Auth.js `/auth/callback/credentials`: existing password user (`test@e-stonia.co.uk`,
  `$2b$` hash) signs in, wrong password → no session ✅; new sign-up gets a session, stored hash is
  `$2a$10$…`, signing in again works, wrong password fails, duplicate sign-up rejected on
  `users_email_key` ✅. The throwaway account was deleted afterwards.

**Deviations**
- Hasura can only track functions that return a table, so `hash_password` (returns text) is not tracked;
  sign-up calls `create_password_user` instead, which hashes and inserts in one step. That also makes the
  separate "email already exists" lookup unnecessary: the unique constraint rejects it.
- Both tracked functions are **VOLATILE (exposed as mutations)**. The first version had a STABLE
  `verify_user_password` and Hasura *inferred* select permissions from `users`, so anonymous callers
  could test passwords. Volatile functions never get inferred permissions, so no role but admin can call them.
- The "account was created with a different login method" message is gone: `authorize` only logged it
  and returned null, so users never saw it.
- Note: on the remote, migrations 1807–1809 (agent_machine/windows/cloud, plan_first) are not recorded as
  applied, though the schema seems to already have them. I applied only 1810 with `--version`; someone
  should mark those with `hasura migrate apply --skip-execution --version …` once they've checked.
