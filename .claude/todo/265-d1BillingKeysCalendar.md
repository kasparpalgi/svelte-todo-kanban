> Run with: Sonnet 5.5 / medium

# D1: billing, API keys and Google Calendar routes

## Original Requirement

[NEVER REMOVE]

Follow-up from #258 (`.claude/todo/258-d1ServerRoutes-DONE.md`), part of #226: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

These routes still call Hasura directly: `api/billing/checkout` (it reads the plan through
`getPlanContext` already, but still writes `stripe_customer_id` through Hasura),
`api/billing/webhook` (finds the user by `stripe_customer_id` and sets `plan` /
`plan_expires_at`), `api/keys` (BYO OpenAI / R2 keys → `user_secrets` rows `openai` / `r2`),
`api/calendar-event` and `api/google-calendar/callback` (the token → `user_secrets` row
`google_calendar`). Check `disconnectIntegration` from #257 first, so keys are written in
the same shape that op deletes.

**How (set up in #258):** a route gets `ctx = opCtx(userId, platform)` (`src/lib/server/ops/run.ts`; it returns a `UserCtx` when given a user id). Branch with `if (ctx.d1) { …drizzle… }` and keep the Hasura code as the `else`. Call ops with `callOp(name, ctx, input)`, which is typed and runs on either backend. `getGithubToken(ctx, userId)` and `getPlanContext(ctx, userId)` already read D1 (`user_secrets`, through `secretsOf` in `src/lib/server/secrets.ts`). For tests, copy `src/lib/server/__tests__/d1Helpers.test.ts`: `migratedSqlite()` + `sqliteD1()`, with `serverRequest` mocked to throw.

**Done when:** no `serverRequest` in these routes outside a Hasura branch, unit tests cover
each D1 branch (the Stripe webhook with a signed test event), and on staging a key is saved
and used, and a calendar event is created. Production is deployed and still on Hasura.

_GitHub issue #265 — end the commit subject with `(#265)`._
