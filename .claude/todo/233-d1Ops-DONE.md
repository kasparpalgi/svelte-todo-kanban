> Run with: Opus 5.5 / high
> Machine: dell

# D1 implementation of every data op, proven equal to Hasura

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# D1 implementation of every data op, proven equal to Hasura

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Needs `d1SchemaAndCopy` and all phase-1 follow-ups. Split into one follow-up per section if it does not fit one session.

1. A D1 version of each op from phase 1 (Drizzle; relational queries return the nested shapes the stores read), chosen by `DATA_BACKEND=hasura|d1` per environment.
2. Logic the Postgres triggers did, as plain functions with unit tests ported from the PL/pgSQL: board alias (global, `name` → lowercase-hyphenated, numeric suffix), todo alias (unique per user), username from email, first board on sign-up plus its owner row, invitation token, `updated_at`. Content preview = first 150 characters. Search uses `instr(lower(...))`, because D1 `LIKE` patterns are capped at 50 bytes. Writes that belong together go in one `db.batch()`, which counts as one of the 50 queries per request.
3. Auth.js: `@auth/d1-adapter` 1.11 wrapped so `createUser` runs the sign-up function. Passwords per 226, Decisions 2. bcrypt costs 86 ms of CPU against Free's 10 ms.
4. **Contract tests:** for each op, run the same input against Hasura and against the staging D1 copy, then compare the JSON (ignoring `__typename` and timestamp precision).

**Done when (deploy + live check):** all contract tests equal. The staging Worker (`DATA_BACKEND=d1`) passes the authenticated e2e suite and a manual pass as the test user (board, card, comment, invite, settings, notes). Production is deployed and still on Hasura.

*GitHub issue #233 — end the commit subject with* `(#233)`*.*

_From Kanban card `0c4796de-8356-499f-a5ae-ae2d898d56d5`, moved to the agent list._

_GitHub issue #233 — end the commit subject with `(#233)`._

## Results

**Summary** — Too big for one session (~80 ops, the server routes that call Hasura
directly, and Auth.js), so I built the foundation plus the first section and split the
rest into five Backlog follow-ups.

- **The switch:** `DATA_BACKEND=hasura|d1`. `opCtx()` builds the request's ctx: Hasura,
  or a Drizzle D1 handle from `platform.env.DB`. `runOp()` runs the op's D1 version. With
  `d1`, an op that has no D1 version yet answers **501**, and the Hasura client throws, so a
  half-ported Worker never reads two databases. `/api/data/[op]` uses it. `access.ts`
  (`boardRole`, `identity`) reads D1 when the ctx has it.
- **Typed contract:** a D1 version is a `D1Run<'op'>`: the same parsed input, and `tsc`
  requires the same return type as the Hasura `run`. A wrong shape fails `npm run check`.
- **On D1 now:** `createLog` (in one batch, chunked under D1's 100-parameter limit; the
  1-in-100 prune is kept; client times are clamped to now), `getLogs` (`instr` search),
  `poll`, `getBoards`, `getBoard`, `createBoard`, `updateBoard`, `deleteBoard`. Boards come
  from Drizzle relations in one statement with correlated JSON sub-selects. `github` is
  rebuilt from `github_repo`.
- **The trigger logic, ported** from the live PL/pgSQL (`pg_get_functiondef`) into
  `src/lib/server/db/rules.ts`: alias cleaning and the numeric suffix, the username from
  the email, `initcap` for the first board's name, the invitation token. Taken names are
  read with an index range (`prefixRange`), not `LIKE`, because of D1's 50-byte cap. I
  checked the test values against Postgres itself. `signUp()` (username, first board and
  its owner row in one batch) is ready for the Auth.js adapter (245). `createBoard` adds
  the owner's member row in the same batch, replacing `board_creator_as_owner`.
- **Contract tests** (`ops/d1/__contract__`, skipped unless `CONTRACT=1`): the same input
  against production Hasura and a fresh local D1 copy (`copy-from-postgres.mjs` locally,
  ~15 s, no D1 quota). They compare normalized JSON: no `__typename`, timestamps compared
  as instants to the millisecond, and unordered relations compared as sets.
  `CONTRACT_WRITES=1` adds a create → update → delete cycle on a board as the test user.
- **Staging Worker** `todzz-staging` deployed with `DATA_BACKEND=d1`, bound to
  `todzz-staging`, and given the 13 secrets it needs to sign in.
- **Follow-ups (Backlog):** `241-d1OpsBoardsRest`, `242-d1OpsCards`,
  `243-d1OpsUsersAndRest`, `244-d1ServerRoutes` (28 server files that call `serverRequest`
  directly) and `245-d1AuthAdapter` (the `@auth/d1-adapter` wrapper plus this task's
  "done when": staging passes the e2e suite on D1 alone). I added a note to #234: it is
  queued but needs 241–245 and #231 first.

**Files changed**
- created: `src/lib/server/db/{index,relations,rules}.ts`,
  `src/lib/server/db/__tests__/{sqliteD1.ts,rules.test.ts}`, `src/lib/server/ops/run.ts`,
  `src/lib/server/ops/d1/{index,types,access,sql,logs,poll,boards,boardRows,signUp}.ts`,
  `src/lib/server/ops/d1/__tests__/{boards,logsPoll}.test.ts`,
  `src/lib/server/ops/d1/__contract__/{compare.ts,contract.test.ts}`,
  `.claude/todo/241-d1OpsBoardsRest.md`, `242-d1OpsCards.md`, `243-d1OpsUsersAndRest.md`,
  `244-d1ServerRoutes.md`, `245-d1AuthAdapter.md`
- modified: `src/lib/server/access.ts`, `src/lib/server/ops/op.ts` (`d1?` on the ctx; 501),
  `src/lib/server/ops/logs.ts` (`id` tie-breaker), `src/lib/server/ops/__tests__/ops.test.ts`,
  `src/routes/api/data/[op]/+server.ts`, `src/app.d.ts`, `wrangler.jsonc` (staging
  `vars`), `.env.example`, `CLAUDE.md` (contract command), `package.json` and
  `package-lock.json` (0.34.0 → 0.35.0), `.claude/todo/234-d1CutOver-TODO.md` (note),
  and this file

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 53 files and 580 tests passed;
  the contract file is skipped by default.
- New unit tests on a real migrated SQLite through the real Drizzle D1 driver:
  - rules (21 tests, values checked against live Postgres)
  - board access: owner, member and invited boards are listed; strangers' public boards
    are not; a viewer gets 403; only the owner deletes
  - alias suffix, including a name longer than 50 bytes
  - `github` round trip
  - 50 logs saved in one call
  - poll stamp and unread count
  - `signUp`
  - an unported op answers 501
- **Contract, D1 = Hasura** (fresh local copy, all 31 tables matched):
  - `getBoards` for all 57 users, open and archived
  - `getBoard` for all 88 boards, as the owner and as a stranger
  - `poll` for every board
  - `getLogs` for the 5 heaviest loggers with 4 filters each
  - the board write cycle

  All equal. Production has no leftover contract board.
- **Deploy and live check:** the production Worker was redeployed (still Hasura;
  1,114 KiB gzip, +46 KiB for Drizzle). The authenticated e2e suite against it: 31 passed,
  1 failed. The failure was the drag reorder ("card bounding boxes unavailable"). It then
  passed twice on the Worker, and it also failed once against www.todzz.eu (Vercel, without
  this change), so it is an old flake, not a regression. On the staging Worker (D1), signed
  in as the test user, I compared each op with production:
  - Equal: `getBoards` (archived), `getBoard` (test1, tekdok, a missing alias), `poll` for
    test1 and with no board.
  - Different on tests-board only: its `updated_at` changed on production at 19:32 UTC,
    after the staging copy.
  - `getLogs` differs only in `created_at`, which is intended (one time column).
  - `getLists` answers 501, as designed.
- `/verify` was not invoked as a skill (runner session); the checks above match this change.

**Deviations**
- **The full "done when" is not met in this session.** The staging e2e suite can't pass
  until every op and server route is on D1, and Auth.js is on D1. That is now 241–245,
  with 245 owning the final proof.
- The contract tests compare against a **fresh local copy**, not the remote
  `todzz-staging` copy. The local copy is taken seconds before the run, so data drift
  can't cause false differences, and it costs no D1 quota. The remote staging copy was
  checked live instead (above).
- Intended differences that the contract allows: log `created_at` (D1 keeps only the
  event time, #232). Board names sort with `COLLATE NOCASE`; Postgres uses en_US, and
  every case compared equal.
- Small improvement on both backends: `getLogs` breaks timestamp ties by `id`, so paging
  is stable. Without it, Hasura and D1 returned tied rows in different orders.
- Staging latency is 70–200 ms per op against 45–110 ms on production. I did not measure
  CPU; that is in 245 and #236.
