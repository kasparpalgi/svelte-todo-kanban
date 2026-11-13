> Run with: Opus 5.5 / high

# D1: Auth.js on D1 and the staging proof

## Original Requirement

[NEVER REMOVE]

Follow-up from #233 (plan: `.claude/todo/226-backend-DONE.md`). Original request (#226): "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

1. Auth.js: `@auth/d1-adapter` 1.11 instead of `HasuraAdapter` when `DATA_BACKEND=d1`,
   wrapped so `createUser` calls `signUp()` (`src/lib/server/ops/d1/signUp.ts`: username
   from email, first board and its owner row, one batch — already tested) and `deleteUser`
   never touches the missing `sessions` table. Password sign-in: PBKDF2 only, per the
   owner's decision (no bcrypt in the Worker); a user still on bcrypt uses the email link.
   Email-link tokens: `verification_tokens`.
2. The staging proof (`233`'s "done when"): refresh `todzz-staging` (one table at a
   time if the full refresh would pass 100k writes in a day — see `232`'s notes), then
   `E2E_BASE_URL=https://todzz-staging.svelte-todo-kanban.workers.dev npx playwright test`
   passes, plus a manual pass as the test user: board, card, comment, invite, settings,
   notes. Run the full contract suite (`CONTRACT=1 CONTRACT_WRITES=1 …`) once more.
3. Measure each op's CPU on staging (Workers Observability) against Free's 10 ms; hand
   anything over to #236.

Needs 241–244 first.

**Done when:** staging signs in, signs up and passes the e2e suite on D1 alone (no Hasura
request in its logs), all contract cases are equal, and production is deployed and still on
Hasura.
