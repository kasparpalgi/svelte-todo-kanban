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
