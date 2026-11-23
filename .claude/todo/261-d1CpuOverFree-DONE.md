> Run with: Opus 5.5 / high

# D1: the ops over Workers Free's 10 ms CPU

## Original Requirement

[NEVER REMOVE]

Follow-up from #260 (plan: `.claude/todo/226-backend-DONE.md`, CPU work: `236-workerCpuUnder10ms-DONE.md`).
Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

On D1 (`todzz-staging`, 2026-11-22), several ops pass Free's 10 ms of CPU. Warm figures:
20 runs per op on one kept-alive connection, read from Workers Observability (the table is
in `260-d1StagingProof-DONE.md`, Results step 4).

- Over 10 ms at p50: `updateTodo` 13, `createComment` 12, `getTodos` 12, `getNotes` 10, the
  board page 11, `POST /auth/callback/credentials` 11 (PBKDF2 is ~5 ms of it).
- p90 is over 10 for most ops (fresh isolates); the board page reaches 69–77.
- During cold starts: up to 119 ms (board page) and 89–108 ms (`getTodos`, `getBoards`,
  `createTodo`).

To do:
1. Profile the D1 path (`wrangler dev --env staging` with `--inspector-port`, as in #236). Find
   what an op spends beyond the SQL: zod parsing, drizzle query building, the lazy
   `loadOp` / `d1Loaders` import on a fresh isolate, JSON shaping. The D1 SQL time itself
   was small in #232.
2. Cut what is cheap to cut, measure again the same way, and write before/after in Results.
3. If Free cannot fit even after that, say so plainly and give the cost of Workers Paid
   ($5/month, 30 s CPU). That is the owner's call, so the result may be a `-BLOCKED.md`.

Do not lower the PBKDF2 iterations without the owner's yes: that weakens every stored hash.
Deploy staging only from this run (two runs deploying `todzz-staging` replace each other's
build). `HASURA_ADMIN_SECRET` and `API_ENDPOINT` are deleted from staging on purpose (#260).

**Done when:** the ops above are measured again, each is under 10 ms warm at p50 or has a
written reason, and production is deployed and still works.

_GitHub issue #261 — end the commit subject with `(#261)`._

_From Kanban card `be6559ef-8b83-4df5-a6f0-fe13a15d5992`, moved to the agent list._

## Results

_Run on the Mac, 2026-11-23._

**Summary** — Every op on the list is now under 10 ms warm at p50 on staging, the card ops
at 2–3 ms. On the same day and the same route, the build from `main` measured 4–5 ms for them.
Free fits; Workers Paid is not needed. The p50s from #260 (10–13 ms) did not reproduce today:
the `main` build itself measured 4–5 ms for those ops, with the same method. The reason is
in step 3.

1. **Profile** (`wrangler dev --env staging --local --inspector-port`, a local copy of the
   staging D1, CDP `Profiler.*` mapped through the bundle's source map, 30 calls per op).
   Where an op's CPU went beyond the SQL:
   - **Drizzle building SQL text** was the largest share, 2.4–5 ms per op locally. Two parts:
     - `drizzle(binding, { schema })` ran on every request, twice: once in `opCtx` and once in
       Auth.js's `d1Auth`. Each call runs `extractTablesRelationalConfig` over the whole schema.
       That is about 1 ms, and it also hit the board page, which reads no D1 at all.
     - Each relational query (`requireCard`, `cardDetail`, the board's cards) was rebuilt
       from its `with` tree on every call. `getTodo` alone spent ~3 ms in `sql.ts` / `entity.is`
       / `casing`.
   - **Auth.js** (session decrypt, re-encrypt, cookie): 0.3–1 ms. **SvelteKit**
     (respond, `json()`, cookies): 0.5–1.5 ms. **zod**: under 0.1 ms. The D1 binding's own
     calls: the rest. The lazy `loadOp` / `d1Loaders` cost nothing warm. The GraphQL
     documents chunk holds plain strings, and `hooks.server` already imports it.
   - **Fresh isolate** (first call after a reload): 40–50 ms locally. It is spread over
     jose/Auth.js first use, zod schema building, Drizzle's schema and module evaluation. No
     one piece dominates.
2. **Cut** (cheap, no new dependency):
   - `d1()` keeps one Drizzle instance per binding (`WeakMap`). The binding lives as long as
     the isolate.
   - `prepared()` in `ops/d1/sql.ts` builds a query once per database, with
     `sql.placeholder()` for the values that vary. Used for the hot reads:
     `requireCard` (every card op), `cardDetail`, a board's open or done cards (`getTodos`
     with a `boardId`, which is every client call), `boardAccess` (`requireRole`),
     `getNotes`, and the comment that `createComment` returns. Drizzle's D1 prepared query
     binds new params to the stored statement each run.
   - Locally, Drizzle's share dropped from 3.0 to 0.25 ms (`getTodos`) and from 3.1 to
     0.9 ms (`getTodo`). On the board page and `poll` it dropped to 0.
3. **Measured again the #260 way**: 20 calls per op on one kept-alive connection, with a
   User-Agent marker, read from Workers Observability (`cpuTimeMs`). Preview URLs
   (`versions upload`) leave no Observability events, so each build was deployed to
   `todzz-staging` in turn. Each got 60 s to settle and a warm-up pass before the measured
   pass. Both builds were measured in the same session, 11:46–11:49 UTC. CPU ms, n / p50 / p90 / max:

| Route | `main` (6d3b9b2e) | this change (925787db) |
|---|---|---|
| `POST /api/data/updateTodo` | 20 / 5 / 6 / 12 | 20 / **3** / 4 / 4 |
| `POST /api/data/getTodo` | 20 / 5 / 8 / 8 | 20 / **2** / 3 / 6 |
| `POST /api/data/getTodos` | 20 / 5 / 8 / 10 | 20 / **2** / 3 / 5 |
| `POST /api/data/createComment` | 20 / 4 / 5 / 6 | 20 / **3** / 5 / 7 |
| `POST /api/data/getNotes` | 20 / 4 / 5 / 13 | 20 / **2** / 3 / 8 |
| `POST /api/data/getComments` | 20 / 4 / 5 / 8 | 20 / 3 / 3 / 4 |
| `GET /[lang]/[user]/[board]` | 20 / 4 / 6 / 32 | 20 / 4 / 6 / 9 |
| `POST /api/data/getBoards` | 20 / 4 / 6 / 9 | 20 / 4 / 7 / 10 |
| `POST /auth/callback/credentials` | 5 / 4 / 14 / 14 | 5 / 3 / 4 / 4 |
| `POST /api/data/getLists` | 20 / 3 / 5 / 8 | 20 / 3 / 3 / 6 |
| `POST /api/data/getMe` | 20 / 2 / 3 / 3 | 20 / 2 / 3 / 4 |
| `POST /api/data/poll` | 20 / 2 / 3 / 4 | 20 / 2 / 3 / 6 |

   - **Every op listed in this task is under 10 ms at p50:** `updateTodo` 3, `createComment` 3,
     `getTodos` 2, `getNotes` 2, the board page 4, password sign-in 3. That holds for the
     `main` build too, so the gap to #260 comes from the conditions, not the code. #260's
     sign-in at 11 ms includes ~5 ms of PBKDF2, which today took 3–4 ms in total.
     Most likely the requests reached another colo with slower machines: #260 ran from another
     host (servo). So a figure here compares only with the other build in this table.
   - **Fresh isolates are not cut by this change.** The first request on a new isolate
     cost 22–38 ms in both builds (`createList` / `createTodo` right after the deploy), and the
     board page 33–34 ms. #260 saw 89–119. These run over 10 ms. Workers Free tolerates
     occasional bursts, and no request failed: 0 exceptions and 0 5xx in 670 staging events.
     Cutting them would mean evaluating the modules in the Worker's startup instead of on the
     first request. SvelteKit loads the hooks and the routes lazily, so that is not a cheap
     change. Not done here.
   - PBKDF2 iterations are unchanged.
4. **Workers Paid** is not needed. Free fits, as the owner asked
   (`stay-on-free-lightweight`).

**Files changed** — modified: `src/lib/server/db/index.ts` (one Drizzle instance per
binding), `src/lib/server/ops/d1/sql.ts` (`prepared()`), `ops/d1/cardRows.ts`
(`boardCards`, `cardOrder`, a prepared `cardDetail`), `ops/d1/cardAccess.ts` (a prepared
`requireCard`), `ops/d1/access.ts` (a prepared `boardAccess`), `ops/d1/todos.ts` (`getTodos`
with a board runs `boardCards`), `ops/d1/notes.ts` (a prepared `getNotes`),
`ops/d1/comments.ts` (a prepared `commentRow`), `package.json` / `package-lock.json`
(0.46.2 → 0.46.3).

**Verification**
- `npm run check`: 0 errors, 0 warnings. `npm test`: 679 passed, 21 skipped. Under load,
  with `wrangler dev` running beside them, some tests hit the 10 s hook timeout once. They
  passed alone, and the whole suite passed once `wrangler dev` was stopped.
- Staging runs this change (`925787db`, `DATA_BACKEND=d1`). Its e2e suite
  (`E2E_BASE_URL=https://todzz-staging…`): **32 passed**. Observability over the passes and
  the e2e: 0 exceptions, 0 5xx.
- Production: see the note after the push (it deploys from `main` through
  `deploy-cloudflare.yml` and stays on Hasura; this change touches only D1 code paths).

**Deviations**
- The before/after compares the `main` build and this build on the same day and route,
  rather than #260's table, because #260's figures did not reproduce (step 3).
- `getBoards` and `getMe` still build their SQL per call (`getMe` is a `d1.batch`, which
  takes no prepared queries). Both are 2–4 ms at p50, so they were left alone.
- A test card and list were made and deleted on `tests-board` in staging and in the local copy.
- Note for triage: `261-d1GithubWebhook.md` (Backlog, from #258) also starts with `261`. It
  is a different task (the D1 GitHub webhook), so the two files share one number.
