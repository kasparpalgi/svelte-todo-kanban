> Run with: Opus 5.5 / high

# D1: the staging proof

## Original Requirement

[NEVER REMOVE]

Follow-up from #259 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Auth.js already runs on D1 on staging since #259: password sign-in and sign-up, and the email
link (new and existing users). The e2e suite also passed there: 32 of 32. The rest of #259 has
to wait until #257 (user, settings, notes …) and #258 (the server code that calls Hasura
directly) are merged:

1. Refresh `todzz-staging` from production. Go one table at a time if a full refresh would
   pass 100k writes in a day (see `232`'s notes). Refreshing `users` cascades into almost every
   table. #259 copied only the test user's PBKDF2 hash.
   Deploy staging only from this run: two runs deploying `todzz-staging` at once replace
   each other's build (#257, #259).
2. Run `E2E_BASE_URL=https://todzz-staging.svelte-todo-kanban.workers.dev npx playwright test`.
   Then do a manual pass as the test user: board, card, comment, invite, settings, notes. Check
   that the staging logs show no Hasura request: `npx wrangler tail todzz-staging`, and no
   `API_ENDPOINT` host in the subrequests. After that, delete `HASURA_ADMIN_SECRET` and
   `API_ENDPOINT` from the staging Worker so a stray call fails loudly.
3. Run the full contract suite once more: `CONTRACT=1 CONTRACT_WRITES=1 npx vitest --run
   --project=server src/lib/server/ops/d1/__contract__` on a fresh local copy.
4. Measure each op's CPU on staging (Workers Observability, or GraphQL
   `workersInvocationsAdaptive` with `CLOUDFARE_FULL_ACCESS_API_TOKEN`) against Free's 10 ms.
   Include `/auth/callback/credentials` (PBKDF2, about 5 ms). Hand anything over to #236.

**Done when:** staging signs in, signs up and passes the e2e suite on D1 alone (no Hasura
request in its logs), all contract cases are equal, and production is deployed and still on
Hasura.

**Tip from #259:** to test the email link without a mailbox, insert a
`verification_tokens` row with `token = sha256(<raw> + AUTH_SECRET)` (hex), then open
`/auth/callback/nodemailer?token=<raw>&email=<email>`.

_GitHub issue #260 — end the commit subject with `(#260)`._

## Note from #259's second run (2026-11-17)

Sign-in CPU on `todzz-staging` (D1), from Workers Observability:
- `/auth/session`: 2–4 ms.
- `POST /auth/callback/credentials`: **8–18 ms**, over Free's 10 ms. PBKDF2 at 10,000
  iterations (`src/lib/server/pbkdf2.ts`) is ~5 ms of that; the rest is the D1 read or the
  sign-up batch, and the session JWT.

Hand it to #236 with the rest. Do not lower the iterations without the owner's yes: that
weakens every stored hash.

_From Kanban card `ff280412-0761-479e-a124-d0cfc2dd33ce`, moved to the agent list._

## Results

_Finished by #264 on servo, 2026-11-22. The two earlier runs left nothing behind (see #264)._

**Summary** — Staging runs on D1 alone. It signs in, signs up, passes the e2e suite and the
manual pass with no Hasura secret left on the Worker. Every contract case is equal once
live-production drift is set aside. One real difference was fixed: the order of `pricing`.
CPU per op is measured, and the ops over 10 ms are handed to `265-d1CpuOverFree.md`.

1. **Staging refresh (prod → `todzz-staging`), 12:10 UTC.** A refresh over a full database
   costs about 160k writes, and the script refuses that. Dropping the tables is almost free
   instead: children before parents, or SQLite turns each DROP into a row-by-row delete.
   Then `wrangler d1 migrations apply --remote --env staging` and a copy into the empty
   database. Cost: drop 139 + 4 writes, copy **78,818** (estimate 83,006). **All 31 tables
   match** Postgres. Today's account total is about 79k of the 100k.
   The copy also carried the test user's PBKDF2 hash, so nothing was patched by hand.
   _For #234:_ the same drop-and-migrate route fits `todzz` (production D1) too.
2. **Staging checks.** Deployed staging from `main` (`665907a4`, `DATA_BACKEND=d1`, workers.dev only).
   - `E2E_BASE_URL=https://todzz-staging.svelte-todo-kanban.workers.dev npx playwright test`: **32 passed**.
   - Manual pass as the test user (a Playwright script with the e2e session). The board and
     settings pages load with no page errors. Then a round trip, all 200: createList →
     createTodo → getTodo → createComment → getComments → createBoardInvitation →
     getBoardInvitations → cancelInvitation → createNote → updateNote → getNotes →
     deleteNote → updateMe → deleteTodo → deleteList → poll. The browser itself called
     only `/api/data/*`.
   - Sign-up through the form as `d1-signup-260@example.com`: it landed on
     `/et/d1-signup-260/d1-signup-260s-board` with a session. The user was deleted
     afterwards. No leftover user, board, member, invitation or card.
   - `wrangler tail todzz-staging` during e2e: 100 events, all `ok`, no exception, and no
     mention of the Hasura host or GraphQL.
   - **Deleted `HASURA_ADMIN_SECRET` and `API_ENDPOINT` from the staging Worker.** Then the
     e2e suite (**32 passed**) and the manual pass (all 200) ran again. A stray Hasura call
     now fails loudly. To restore them: `npx wrangler secret put <NAME> --env staging`.
3. **Contract suite** (`CONTRACT=1 CONTRACT_WRITES=1 … __contract__`, on a fresh local copy).
   - **Fixed: `pricing` order.** Hasura's `RUNNER_PRICING` had no `order_by`, so it returned
     the heap order, while D1 sorts by `model`. The runner's 12:05 upsert today reshuffled
     the heap, and `$.data.8` differed. Hasura now orders by `model` too
     (`documents.ts`, `npm run generate`). The runner looks prices up by model, so nothing
     changes for it.
   - **Reads (`CONTRACT=1`), fresh copy:** equal, apart from live drift. Production's
     `tekdok` board was edited every few seconds during the run (`updated_at` and the poll
     stamp), after the copy was taken.
   - **Writes (`-t 'writes|→'`, fresh copy):** **all 5 equal.** The five cases:
     createBoard → updateBoard → deleteBoard; cards on tests-board; user, note and money
     writes; sharing; and the runner's card flow.
   - **Do not run reads and writes in one go.** Vitest runs the files in parallel, so the
     reads see the boards and members the writes are making at that moment. Their ids and
     millisecond timestamps differ on each side, which shows up as diffs. Even with
     `--no-file-parallelism`, the writes of earlier files change the copy that later files
     read. Run the reads on a fresh copy, then the writes.
   - My first mixed run left a `contract-1795349979954` board on both sides, archived and
     not deleted. That is the only case without its own timeout (vitest's 5 s), so it was
     probably cut off under the parallel load before its delete. I deleted the board from
     production Hasura (1 row, the test user's), and no contract board is left. Run alone,
     D1's `deleteBoard` removes the board (`deleted: true`).
4. **CPU on staging** (Workers Observability events, a warm pass at 12:27–12:30 UTC). Each op
   ran 20 times on one kept-alive connection under a User-Agent marker, plus 5 password
   sign-ins through the form. Times in ms:

| Route | n | p50 | p90 | max |
|---|---|---|---|---|
| `POST /api/data/createTodo` | 1 | 23 | 23 | 23 |
| `GET /signin` | 5 | 19 | 58 | 58 |
| `GET /et` | 5 | 13 | 29 | 29 |
| `POST /api/data/updateTodo` | 20 | 13 | 20 | 23 |
| `POST /api/data/createComment` | 20 | 12 | 26 | 27 |
| `POST /api/data/getTodos` | 20 | 12 | 26 | 32 |
| `GET /[lang]/[user]/[board]` | 25 | 11 | 69 | 77 |
| `POST /auth/callback/credentials` (password sign-in) | 4 | 11 | 12 | 12 |
| `POST /api/data/getNotes` | 20 | 10 | 19 | 25 |
| `POST /api/data/getTodo` | 20 | 9 | 27 | 34 |
| `POST /api/data/deleteList` | 1 | 8 | 8 | 8 |
| `POST /api/data/deleteTodo` | 1 | 8 | 8 | 8 |
| `POST /api/data/getBoards` | 21 | 8 | 16 | 21 |
| `POST /api/data/getMe` | 20 | 8 | 17 | 17 |
| `POST /api/data/createList` | 1 | 8 | 8 | 8 |
| `POST /api/data/deleteComment` | 20 | 7 | 16 | 19 |
| `POST /api/data/getLists` | 20 | 7 | 12 | 16 |
| `POST /api/data/getMyInvitations` | 20 | 6 | 13 | 14 |
| `POST /api/data/getComments` | 20 | 6 | 23 | 25 |
| `POST /api/data/poll` | 20 | 5 | 9 | 12 |
| `POST /api/data/getBoardMembers` | 20 | 5 | 10 | 15 |
| `POST /api/data/getClients` | 20 | 4 | 18 | 18 |
| `POST /api/data/getNotifications` | 20 | 4 | 13 | 17 |
| `GET /auth/csrf` | 1 | 3 | 3 | 3 |

   - Warm medians are 4–13 ms. Over Free's 10 ms at p50: the card writes and reads
     (`updateTodo` 13, `createComment` 12, `getTodos` 12, `getNotes` 10), the board page
     (11) and sign-in (11). At p90, cold isolates push most ops past 10, and the board page
     reaches 69–77. No request failed, so nothing hit the limit.
   - Mixed with e2e, during the cold starts (872 events, 12:05–12:27): max 119 ms on the
     board page, and 89–108 ms on `getTodos`, `getBoards` and `createTodo`.
   - Handed to **`265-d1CpuOverFree.md`** (Backlog). #236 is already DONE.

**Done when:** staging signs in, signs up and passes e2e on D1 alone ✔. No Hasura request,
and the secrets are gone ✔. Contract cases equal ✔: the pricing order was fixed, and the
only other diffs are live drift. Production is deployed and still on Hasura: see #264's
Results.

**Files changed** — modified: `src/lib/graphql/documents.ts` (`RUNNER_PRICING` ordered by
`model`), `src/lib/graphql/generated/gql.ts`, `src/lib/graphql/generated/graphql.ts`.
Created: `.claude/todo/265-d1CpuOverFree.md`. The rest of the work was data and config:
the `todzz-staging` refresh, the staging deploy and the two deleted staging secrets.

**Verification** — `npm run check`: 0 errors. `npm test`: 679 passed, 21 skipped. Staging
e2e 32/32, twice. Contract suite as above.

**Deviations** — The manual pass was a script with the e2e session, not clicks. It drove
the same `/api/data` ops the UI sends and opened the pages in a real browser. Reads and
writes of the contract suite ran separately, for the reason above.
