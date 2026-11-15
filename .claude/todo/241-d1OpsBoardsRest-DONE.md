> Run with: Opus 5.5 / high

# D1: lists, labels, members and invitations

## Original Requirement

[NEVER REMOVE]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

1. D1 versions of `getLists`, `createList`, `updateList`, `deleteList`, `createLabel`,
   `updateLabel`, `deleteLabel`, `getBoardMembers`, `updateBoardMember`,
   `removeBoardMember`, `getBoardInvitations`, `getMyInvitations`,
   `createBoardInvitation` (token = `invitationToken()` in `src/lib/server/db/rules.ts`),
   `cancelInvitation`, `acceptInvitation` and `declineInvitation`. Same access rules as
   `ops/lists.ts`, `labels.ts`, `members.ts` and `invitations.ts`. List, label and member
   writes bump `boards.changed_at` in the same `d1.batch()`, as the Hasura ops do.
2. Contract cases for each (reads for every board; writes as the e2e test user on
   tests-board, cleaned up afterwards).

**How (set up in #233):** write `src/lib/server/ops/d1/<file>.ts` with `D1Run<'<op>'>` (same input, and `tsc` enforces the Hasura return type), register it in `ops/d1/index.ts`, add relations in `src/lib/server/db/relations.ts`, unit-test on `migratedSqlite()` + `sqliteD1()` (`ops/d1/__tests__`), then add cases to `ops/d1/__contract__/contract.test.ts` and run it against a fresh local copy (`node scripts/d1/copy-from-postgres.mjs`, then `CONTRACT=1 npx vitest --run --project=server src/lib/server/ops/d1/__contract__`). Gotchas: D1 allows 100 bound parameters per statement (`inChunks`), LIKE patterns of at most 50 bytes (`contains` uses `instr`), never `await` a Drizzle builder you mean to use as a sub-select (it runs it), and never select one column twice in a `d1.batch()` (rows are mapped by name).

**Done when:** every contract case is equal, the unit tests pass, and the staging Worker
(`npx wrangler deploy --env staging`) answers these ops from D1. Production is deployed and
still on Hasura.

## Results

_Built in the #253 run (todzz move: "if Hetzner can't be emptied yet, do the move")._

**Summary** — All 16 ops have a D1 version, with the same access rules as the Hasura ops:
`getLists`, `createList`, `updateList`, `deleteList`, `createLabel`, `updateLabel`,
`deleteLabel`, `getBoardMembers`, `updateBoardMember`, `removeBoardMember`,
`getBoardInvitations`, `getMyInvitations`, `createBoardInvitation`, `cancelInvitation`,
`acceptInvitation`, `declineInvitation`. List and label writes stamp `boards.changed_at` in
the same `d1.batch()` (`stamp()` in `ops/d1/lists.ts`). Accepting an invitation upserts the
member row (an owner stays owner) and marks the invitation, in one batch.

**Files changed**
- Created: `src/lib/server/ops/d1/{lists,labels,members,invitations}.ts`,
  `ops/d1/__tests__/sharing.test.ts`, `ops/d1/__contract__/sharing.test.ts`,
  `ops/d1/__contract__/cases.ts` (the `compare` helper, moved out of `contract.test.ts`)
- Modified: `ops/d1/index.ts` (16 loaders), `ops/d1/__contract__/contract.test.ts` (uses
  `cases.ts`), `ops/d1/__tests__/boards.test.ts` (the 501 check now uses `getNotes`),
  `ops/lists.ts` (Hasura `getLists` gets an `id` tiebreak)

**Verification**
- Unit tests on migrated SQLite: 22/22. `npm run check` 0 errors. `npm test` 640 passed.
- Contract against production Hasura, fresh local copy (all 31 tables match): `getLists` and
  `getMyInvitations` for every user; `getLists`, `getBoardMembers` and `getBoardInvitations`
  for every board, as its owner and as the test user. All equal.
- `CONTRACT_WRITES=1`: every write op, on both sides, as the test user on tests-board. All equal.
  Checked tests-board on production afterwards: no lists, labels or invitations left behind,
  and the member row is still `test`/owner.
- Deployed to `todzz-staging` (version `d4027d9b`). Without a session the new ops answer 401.
  A signed-in probe on staging is not possible yet: sign-in still runs through Hasura, and
  #245 moves it. #245 already ends with the full staging e2e run.

**Deviations**
- Members do not stamp `changed_at`. The plan said they should, "as the Hasura ops do", but
  the Hasura member ops don't stamp, so D1 matches Hasura.
- The invitation token is hex from `randomUUID`, like the Hasura op, not `invitationToken()`:
  base64 has `/` and `+`, and the token goes into `/invite/<token>` unescaped.
- `getLists` order: Postgres sorted tied lists ("Todo" on many boards) any way it liked, so
  both sides now break ties by `id`. D1 also sorts case-only ties lower-case first, to match en_US.
