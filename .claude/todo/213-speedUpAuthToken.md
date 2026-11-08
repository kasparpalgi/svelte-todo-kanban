# Speed up auth token endpoint

## Original Requirement

[NEVER REMOVE]

Follow-up from #209: 207 `Slow token fetch` warnings in 5 weeks — `/api/auth/token` takes p50 1.7 s, max 11.8 s, and every page load waits for it before its first GraphQL query.

It runs `locals.auth()`, a `users_by_pk` existence check against Hasura, then signs the JWT. Find where the time goes (Vercel cold start, Auth.js session lookup, the Hasura round trip) and cut it.

_From Kanban card `7a6a3c6f-a4fc-45f4-8a5a-252e2b0ec249`._

_GitHub issue #213 — end the commit subject with `(#213)`._
