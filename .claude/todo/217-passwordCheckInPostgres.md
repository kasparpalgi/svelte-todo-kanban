> Run with: Sonnet 5.5 / medium

# Check passwords in Postgres instead of bcryptjs in the app

## Original Requirement

[NEVER REMOVE]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request:
"Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? …
Is Hasura really needed?"

Workers Free allows 10 ms CPU per request. A bcryptjs cost-10 compare takes 86 ms, so
email/password sign-in (14 of 57 users) and sign-up would fail there. Postgres already has
`pgcrypto` 1.3, and #215 tested that it verifies the stored `$2b$` hashes when the prefix is
read as `$2a$`:

```sql
crypt(pw, '$2a$' || substr(hash, 5)) = '$2a$' || substr(hash, 5)   -- right pw → t, wrong → f
```

1. Migration: add SQL functions `verify_user_password(email, password)` returning the user row
   (or nothing) and `hash_password(password)` returning `crypt(password, gen_salt('bf', 10))`.
   bcryptjs reads that `$2a$` output too. Track the functions in Hasura as **admin-only**: no
   role permissions.
2. `src/lib/server/password.ts` and the Credentials provider in `src/hooks.server.ts` call them
   through `serverRequest`. Existing hashes keep working without a rehash.
3. Remove `bcryptjs` and `@types/bcryptjs` if nothing else uses them.
4. Check: unit tests for `password.ts` with the request mocked, `npm run check`, then sign-up and
   sign-in by hand with a new account and with an existing password user.

_GitHub issue #217 — end the commit subject with `(#217)`._
