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

## Results

**Summary** — The browser now reaches the server, not Hasura, for logs and for the 30 s
poll. Shipped in `041904c`, live on www.todzz.eu (Vercel) and on the Worker.

- **`POST /api/data/[op]`**: reads the Auth.js session, looks the op up in the registry
  (`Object.hasOwn`, so `constructor` is a 404 too), validates the body with the op's zod
  schema and returns `{ data }`, or `{ error }` with 400, 401, 403 (`OpError`), 404 or a
  generic 500 (details go to the server log only).
- **`defineOp`** (`src/lib/server/ops/op.ts`): `ctx = { userId, db }`, with `db` =
  `serverRequest` (Hasura, admin secret). Every op touches the database only through
  `ctx.db`, ready for D1 in phase 2.
- **`access.ts`**: `boardRole(ctx, boardId)` → `owner | editor | viewer | public | null`
  in one query, cached per request (a WeakMap keyed by the request's `ctx`), plus
  `canRead` and `canEdit`. Ports the boards select rule: owner, member, or `is_public`.
- **`call(op, input)`** (`src/lib/api/call.ts`): typed from the server registry with
  `import type`, and throws the same `AuthenticationError` as `request()` on 401.
- **Logs:** `createLog` takes a batch (up to 50), so one flush is one request instead of
  one per log. The server sets `user_id` from the session and cuts over-long text instead
  of rejecting the batch. On about 1 in 100 writes it deletes rows older than 30 days.
  `getLogs` returns only the caller's own logs, in the exact `GET_LOGS` shape. The
  logging store saves the same message at most once a minute and at most 100 logs an
  hour per tab, and drops batches that get a 4xx instead of retrying them.
- **One poll:** the `poll` op returns `{ board, unread }`. `board` is a 24-character
  SHA-256 of the board's cards, lists and `boards.updated_at`, computed on the server.
  `src/lib/api/poll.ts` runs one 30 s timer per tab for the board page and the bell,
  skips it while `document.hidden`, and polls right away when the tab becomes visible
  again. A quiet poll is now **one ~60-byte request instead of four** (a ~170 KB
  fingerprint, lists, boards and the notification list). Lists and boards reload only
  when the fingerprint changes; a full refresh still runs every 5 minutes.
- **Two load bugs found in the live check, now fixed:** on a direct page load the logs
  page showed "No logs found", and the bell never loaded or polled. Both checked
  `user?.id` once in `onMount`, before the user store had filled in. Both now load when
  the user arrives.
- **Prod logs cleanup:** 94,318 rows older than 30 days (of 99,579; prod never ran
  `cleanup_old_logs()`) were first saved to
  `~/Documents/todzz-extracted/logs-older-than-30-days-2026-11-13.jsonl.gz` (4.3 MB, row
  count checked against the database), then deleted in one statement (0.6 s). 5,289 rows
  are left, so the in-request clean-up stays small.

**Files changed**
- created: `src/routes/api/data/[op]/+server.ts`, `src/lib/server/ops/{op,logs,poll,index}.ts`,
  `src/lib/server/access.ts`, `src/lib/api/{call,poll}.ts`; tests
  `src/routes/api/data/__tests__/data.test.ts`, `src/lib/server/__tests__/access.test.ts`,
  `src/lib/server/ops/__tests__/ops.test.ts`, `src/lib/api/__tests__/{call.test.ts,poll.svelte.test.ts}`
- modified: `src/lib/graphql/documents.ts` (+`POLL_UNREAD`, `POLL_BOARD`, `GET_BOARD_ROLE`,
  `CREATE_LOGS`, `DELETE_OLD_LOGS`; −`CREATE_LOG`, `GET_BOARD_TODOS_FINGERPRINT`),
  `src/lib/graphql/generated/*` (regenerated), `src/lib/graphql/client.ts` (the
  CreateLog exemption is no longer needed), `src/lib/stores/logging.svelte.ts`,
  `src/lib/stores/todos.svelte.ts` (`refreshBoardTodosIfChanged(boardId, fingerprint)`),
  `src/routes/[lang]/[username]/[board]/+page.svelte`, `src/routes/[lang]/logs/+page.svelte`,
  `src/lib/components/notifications/UnifiedNotificationBell.svelte`, the logging and
  concurrency tests, `package.json` / `package-lock.json` (0.28.0 → 0.29.0),
  `.claude/todo/228-dataApiBoards.md` and `229-dataApiCards.md` (handover notes)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 48 files, 462 tests passed
  (endpoint 401/404/400/200/500, `boardRole` for every role plus caching, createLog,
  getLogs and poll ops, `call()`, the shared poll timer, the log cap). ESLint is clean
  on the new files; the Svelte autofixer reports no issues.
- `vite build` passes. No admin secret or server logic is in the client bundle; only the
  GraphQL query text is, because codegen bundles all of `documents.ts`, and that text
  was public before.
- Deploys: pushed `041904c` to `main`, Vercel reported "Deployment has completed".
  `npx wrangler deploy` uploaded version `e0fa91e1`.
- **Live on www.todzz.eu as the test user:** a forced client error was sent as
  `POST /api/data/createLog` → 200 `{"saved":1}` and listed at the top of `/et/logs`
  (with its data), loaded via `POST /api/data/getLogs`. No request went to
  `todzz.admin.servicehost.io` for logs; the remaining Hasura calls there are user,
  boards, invitations and notifications, which move in #228–#230. A list created in a
  second tab appeared in the first tab at its next poll, 13 s later. Polling someone
  else's private board returns `board: null`.
- **Live on the Worker:** sign-in, `/et/logs` (15 logs), poll 200 with the same
  fingerprint as Vercel, unknown op 404, bad input 400, signed out 401.
- **Locally (dev server against the prod Hasura):** log filters (level plus search) and
  reset work. Renaming a card in tab 2 showed in tab 1 at the next poll. A quiet poll
  refetched nothing. A new notification moved the bell from 1 to 2 through the poll
  alone. All test lists, cards, notifications and activity rows were deleted afterwards.

**Deviations**
- The board fingerprint is hashed on the server rather than sent to the browser, and it
  now includes lists and `boards.updated_at`. That is what lets the poll drop the separate
  every-30 s `GetLists` and `GetBoards` calls.
- Beyond the plan: the log write is batched, 4xx batches are dropped, the logs page and
  bell load bugs are fixed, and the one-time prod clean-up was done by hand (after a
  backup) instead of being left to the first 1-in-100 insert.
- `boardRole` leaves out the invitee branch of the Hasura boards rule, as the task said;
  a note in #228 says where it belongs.
- `/verify` was not invoked as a skill; the checks above are the ones that match this
  change.
