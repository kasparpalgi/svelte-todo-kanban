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
