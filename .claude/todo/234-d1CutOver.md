> Run with: Opus 5.5 / high

# Cut production over to D1

## Original Requirement

[NEVER REMOVE]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Needs `d1Ops` and `runnerAndExtensionApi`.
**Needs the owner to pick the moment** (a few minutes of read-only).

1. Read-only switch on (ops refuse writes with a friendly message); pause the runners.
2. Final `copy-from-postgres` into `todzz`; compare row counts.
3. Set `DATA_BACKEND=d1` on production; read-only off; runners resume.
4. Live checklist as the test user and a real account: Google sign-in, email link,
   password, board load and poll, card create/drag/comment/upload, invitation accept,
   settings save, GitHub webhook, Stripe test webhook, push, Chrome extension, a runner
   card end to end.
5. **Rollback:** within the first hour, `DATA_BACKEND=hasura` (D1 writes since the switch
   are lost; copy them back by hand if any). After that, forward-fix only.
6. Watch for 7 days: D1 rows read and written against the Free limits, Worker CPU
   (error 1102), errors in the logs page.

_GitHub issue #234 — end the commit subject with `(#234)`._

## Owner decisions (2026-11-12)

- Stay on Free. If the 7-day watch shows error 1102 or D1 limit errors, the fix is lighter
  code, not Workers Paid.

## Notes from #232 (schema and copy)

- `todzz` exists (`eeur`), has migrations 0000–0002 applied and no rows. The Worker is bound
  to it as `DB`; `--env staging` binds `todzz-staging`.
- **The final copy costs ≈ 77k of the 100k rows written a day.** The staging copy on
  2026-11-13 measured 71.3k; the `logs.created_at` index added afterwards adds ~5.3k.
  Postgres grows by roughly 400 index-weighted rows a day. So on cut-over day: no staging
  copy, no other big D1 write. The script prints its estimate first and stops above 90k
  without `--yes`.
- If the estimate is over 90k: copy `logs` (~21k rows written with its indexes) on its own
  the day before (losing the logs written in between is fine), or prune `activity_logs`.
- Commands: `node scripts/d1/copy-from-postgres.mjs --remote --prod` (copy, then compare
  counts), and `… --remote --prod --check` (compare only, writes nothing).
