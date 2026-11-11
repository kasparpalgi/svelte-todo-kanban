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
