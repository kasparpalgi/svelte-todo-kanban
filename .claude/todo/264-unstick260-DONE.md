> Run with: Opus 5.5 / high

# Unstick task 260

## Original Requirement

[NEVER REMOVE]

The runner ran `.claude/todo/260-d1StagingProof-TODO.md` twice and neither run renamed it to -DONE or
-BLOCKED, so it is skipped now and its card waits in TODO.

Find out why: read that run's transcript on karel `/home/krl/Documents/GitHub/svelte-todo-kanban/.claude/todo/260-d1StagingProof.log` and the work it
left (`git stash list` — the runner parks a dirty run's work there). Then finish the
task itself: do what is left, append its `## Results` and rename it -DONE.md — or,
when a person must act, say exactly what and rename it -BLOCKED.md. If the cause is in
the runner or the /todo skill rather than the task, say so in this file's Results.

## Results

**Summary** — Task 260 is finished (`ee5dc21`, renamed `260-d1StagingProof-DONE.md`). Staging
runs on D1 alone: sign-in, sign-up, e2e 32/32, a manual pass, and no Hasura secret left on
the Worker. The contract suite is equal after one fix (the `pricing` order). CPU per op is
measured and handed to `265-d1CpuOverFree.md` (Backlog, now GitHub issue #261). 260's file has the full details.

**Why 260 never finished — not proven.** This run was on servo, not karel, and karel was
unreachable (`ssh: connect to host 192.168.0.107 port 9812: Connection timed out`). So I
could not read the transcript `260-d1StagingProof.log`. What the two runs left behind:
- no commit on any branch;
- no 260 stash on this machine (the only stash is an unrelated "044 Aider WIP");
- `todzz-staging` untouched: row counts still those of #232's copy from 2026-11-13.

So both runs stopped before step 1 had written anything. The likeliest cause is in the task,
not the runner. Step 1 asks for a full refresh, and the copy script refuses that: about 160k
writes, against Free's 100k a day. Both runs probably stalled there without a way forward,
and without ending `-BLOCKED`. The way round is to drop the tables, children first, and
re-apply the migrations (143 writes), then copy into the empty database (about 79k). That is
now written down in 260's Results. If karel's log shows something else, such as a timeout or
a kill, the runner owns it. Nothing here points at the `/todo` skill.

**Files changed** — modified: `src/lib/graphql/documents.ts`, `src/lib/graphql/generated/{gql,graphql}.ts`,
`package.json` (0.46.1 → 0.46.2). Renamed: `260-d1StagingProof-TODO.md` → `-DONE.md`, with
Results appended. Created: `.claude/todo/265-d1CpuOverFree.md`. Outside git: the
`todzz-staging` refresh and deploy, and `HASURA_ADMIN_SECRET` / `API_ENDPOINT` deleted from
the staging Worker. One leftover test board was deleted from production Hasura (see 260).

**Verification** — `npm run check`: 0 errors. `npm test`: 679 passed. Staging e2e: 32/32 twice,
the second time without the Hasura secrets. Contract: reads equal apart from live drift, all
5 write cases equal.
- **Production:** `ee5dc21`'s own deploy was cancelled, because the runner's `8333ae5` (filing
  265 as #261) was pushed on top of it. The next deploy, of `8333ae5`, includes `ee5dc21` and
  **succeeded**. `E2E_BASE_URL=https://www.todzz.eu npx playwright test`: **32 passed**.
  Production has no `DATA_BACKEND`, so it is still on Hasura.

**Deviations** — Karel's transcript was out of reach, so the cause above is inferred from
what the runs left behind, not read from their log.
