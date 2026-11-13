> Run with: Opus 5.5 / xhigh
> Machine: mac

# Data API foundation: the browser calls the server, not Hasura (logs first)

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Data API foundation: the browser calls the server, not Hasura (logs first)

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan, numbers and section review: `.claude/todo/226-backend-DONE.md`. This is phase 1, step 1.

**Build**

1. `POST /api/data/[op]` (`src/routes/api/data/[op]/+server.ts`): read the Auth.js session (`locals.auth()`), look the op up in a registry, validate the input with its zod schema, run it, and return `{ data }`, or `{ error }` with 400/401/403/404.
2. `src/lib/server/ops/op.ts`: `defineOp({ input, auth: 'user' | 'public', run(ctx, input) })`. `ctx = { userId, db }`, where `db` is `serverRequest` (Hasura, admin secret) for now. In phase 2 it becomes D1, so keep every op's Hasura call behind `ctx.db`.
3. `src/lib/server/access.ts`: `boardRole(userId, boardId)` → `'owner' | 'editor' | 'viewer' | 'public' | null`, plus `canRead` and `canEdit`. One query, cached per request. Port the boards select permission (owner, member, or `is_public`).
4. `src/lib/api/call.ts` (browser): `call(op, input)`, typed with `import type` of the registry, throwing the same `AuthenticationError` that `request()` throws today.
5. **Logs first:** `createLog` and `getLogs` ops; `logging.svelte.ts` and `/[lang]/logs` switch to `call()`. Cap writes per session (for example, the same message at most once a minute) and delete rows older than 30 days on about 1 in 100 inserts. Prod has 99k rows / 125 MB and never ran `cleanup_old_logs()`.
6. **One poll:** a `poll` op that returns the board fingerprint and the unread notification count in one request, replacing the two 30 s timers (`[board]/+page.svelte`, `UnifiedNotificationBell.svelte`). Skip it while `document.hidden`. Workers Free has 100k requests a day, and every browser call now counts.

Return the exact JSON shape the store reads today, so no component changes.

**Done when (deploy + live check)**

- `npm run check` and `npm test` pass. Unit tests cover the endpoint (401, unknown op 404, bad input 400) and `boardRole`.
- Pushed to `main` (Vercel) and `npx wrangler deploy` done (see memory `cloudflare-worker-deploy`).
- Live on www.todzz.eu as the test user: the logs page lists logs; a forced client error shows up there; the network tab shows `/api/data/*` and no request to `todzz.admin.servicehost.io` for logs; the board still picks up a change made in a second tab within 30 s.

*GitHub issue #227 — end the commit subject with* `(#227)`*.*

_From Kanban card `02013721-d594-4b77-88f9-fe3b0274b46f`, moved to the agent list._

_GitHub issue #227 — end the commit subject with `(#227)`._
