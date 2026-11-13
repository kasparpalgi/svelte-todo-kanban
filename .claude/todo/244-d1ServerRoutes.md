> Run with: Opus 5.5 / high

# D1: the server code that still calls Hasura directly

## Original Requirement

[NEVER REMOVE]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

The data ops are not the only Hasura callers. These call `serverRequest` (GraphQL with the
admin secret) themselves and need a D1 path behind the same `DATA_BACKEND` switch
(`opCtx()` in `src/lib/server/ops/run.ts` gives a ctx with `d1`; `event.platform.env.DB`
is the binding):

- `src/lib/server/`: `boardCard.ts`, `github.ts`, `password.ts`, `plan.ts`, `push.ts`,
  `topBoardPath.ts`, `unqueue.ts`
- `src/routes/`: `[lang]/+layout.server.ts`, `signin/+page.server.ts`,
  `invite/[token]/+page.server.ts`, the expenses and invoices page loads,
  `api/upload`, `api/runner/upload`, `api/keys`, `api/calendar-event`,
  `api/google-calendar/callback`, `api/billing/{checkout,webhook}`, `api/admin/news`,
  and every `api/github/*` route (webhook, callback, import-issues, create/update issue and
  comment, task and draft files). The webhook and runner look boards up by
  `github_repo = ?` (exact `owner/name`), not `github ILIKE`.
- `api/auth/token` should be gone since #230; delete it if it still exists.
- The runner API from #231 (`/api/runner/*`) if it landed.

Where a route runs an op (`getBoard`, `getMe`, `acceptInvitation`), call `runOp` instead
of `op.run`.

**Done when:** with `DATA_BACKEND=d1`, no request path calls Hasura (grep for
`serverRequest` outside the Hasura branch), unit tests cover each D1 branch, and the
staging Worker passes a GitHub webhook test delivery and an upload. Production is deployed
and still on Hasura.
