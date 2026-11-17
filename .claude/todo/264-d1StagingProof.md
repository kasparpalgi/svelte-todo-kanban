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
