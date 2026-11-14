> Run with: Opus 5.5 / xhigh
> Machine: manual (the owner picks the cut-over moment; needs #231 and the rest of the D1 slices)

# Cut production over to D1

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Cut production over to D1

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Needs `d1Ops` and `runnerAndExtensionApi`. **Needs the owner to pick the moment** (a few minutes of read-only).

1. Read-only switch on (ops refuse writes with a friendly message); pause the runners.
2. Final `copy-from-postgres` into `todzz`; compare row counts.
3. Set `DATA_BACKEND=d1` on production; read-only off; runners resume.
4. Live checklist as the test user and a real account: Google sign-in, email link, password, board load and poll, card create/drag/comment/upload, invitation accept, settings save, GitHub webhook, Stripe test webhook, push, Chrome extension, a runner card end to end.
5. **Rollback:** within the first hour, `DATA_BACKEND=hasura` (D1 writes since the switch are lost; copy them back by hand if any). After that, forward-fix only.
6. Watch for 7 days: D1 rows read and written against the Free limits, Worker CPU (error 1102), errors in the logs page.

*GitHub issue #234 — end the commit subject with* `(#234)`*.*

_From Kanban card `bb48a08e-c2ef-4765-855d-6ec0573847d5`, moved to the agent list._

_GitHub issue #234 — end the commit subject with `(#234)`._

## Notes from #233 (D1 ops)

- **Not ready to run yet.** #233 built the switch and the first slice; the rest of the D1
  work is in the Backlog as 241 (lists, labels, members, invitations), 242 (cards),
  243 (user, notes, money, extras), 244 (server routes that call Hasura directly) and
  245 (Auth.js on D1 plus the staging e2e proof). The cut-over needs all five, and #231.
- The switch: `DATA_BACKEND=d1` (a wrangler `vars` entry; the staging env already has it).
  With it, an op without a D1 version answers 501 and the Hasura client throws, so a
  missed path fails loudly instead of reading the old database.
- The #232 hand-over notes for this file (final copy ≈ 77k of the 100k writes a day, copy
  `logs` the day before if the estimate is over 90k) were dropped when the card was queued;
  they are in `git show 10772e7:.claude/todo/234-d1CutOver.md`.
