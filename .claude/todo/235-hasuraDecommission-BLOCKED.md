> Run with: Sonnet 5.5 / medium

# Remove Hasura and confirm it can be deleted from Hetzner

## Original Requirement

[NEVER REMOVE]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Run 7 days after `d1CutOver`.

1. Confirm that nothing still calls Hasura: CapRover/Hasura request logs for 7 days, and
   `grep -r "servicehost\|HASURA\|graphql"` over this repo, the runner and the extension.
2. Final `pg_dump` of the todzz Postgres, gzip, to R2 (`R2_BUCKET_NAME`, a private
   prefix). Write down its size and SHA-256.
3. Delete the `hasura/` folder, `codegen.ts`, `src/lib/graphql/`, `@auth/hasura-adapter`,
   `graphql`, `graphql-request`, `@graphql-codegen/*`, the `DATA_BACKEND` switch and the
   Hasura env vars (Worker secrets, `.env.example`, `scripts/cf-secrets.sh`). Update
   `CLAUDE.md` (stack, GraphQL workflow, schema section) and the memory notes that point at
   Hasura.
4. Deploy, run the live checklist from `d1CutOver` once more.

**Done when:** the Results say, in so many words, **"You can now delete the todzz Hasura and
Postgres apps from CapRover on Hetzner"**, with the dump's location. Leave the box's other
apps alone. Rename `-BLOCKED.md` if the deletion itself is left for the owner, and say so.

_GitHub issue #235 — end the commit subject with `(#235)`._

_From Kanban card `62839889-d610-4589-9f1d-59bb1f9890ee`, moved to the agent list._

## Results

**Summary** — Nothing was deleted, on purpose. This task runs 7 days after `d1CutOver` (#234), and the prerequisites are not done:
`231-runnerAndExtensionApi-TODO.md`, `233-d1Ops-TODO.md` and `234-d1CutOver-TODO.md` are all still `-TODO`. Production still reads from Hasura/Postgres, and `src/`, `hasura/`, `codegen.ts` and the `graphql` deps are still live. Removing them, or telling the owner the Hetzner apps can go, would break the app. No `pg_dump` was taken, because Postgres is still the live database.

**Files changed** — only this task file (Results appended, renamed to `-BLOCKED.md`).

**Verification** — Repo grep confirms Hasura/GraphQL is still referenced in `src/`, `CLAUDE.md`, `codegen.ts` and `package.json`. Nothing else to verify.

**Deviations** — The required statement "You can now delete the todzz Hasura and Postgres apps from CapRover on Hetzner" is deliberately NOT made: it is false today.

**What's needed from the owner** — Finish and run #231, #233 and #234 (the cut-over to D1). Watch for 7 days. Then re-queue this task as `235-hasuraDecommission-TODO.md`. The steps are: check the request logs, `pg_dump` to R2, delete the Hasura code and deps, deploy, rerun the live checklist.

## Chain off Hetzner (owner, 2026-11-25)

The owner asked (during #263): "once done make the next TODO task to be picked up by runner and
instruct all the following tasks to do the same so one by one all done until everything away
from Hetzner". So when this task ends, **queue the next one yourself** in the same commit as your
rename, by renaming its file to `-TODO.md` (a suffixless `NNN-slug.md` or a `-BLOCKED.md` alike).
The order:

1. `263-d1GithubWebhook` — the webhook on D1 (done 2026-11-25)
2. `264-d1GithubRoutes` — the other GitHub routes on D1
3. `265-d1BillingKeysCalendar` — Stripe, API keys and Google Calendar on D1 (runs beside 264)
4. `234-d1CutOver` — after **both** 264 and 265 are `-DONE`. The owner's chain request is the
   go-ahead for the cut-over moment that file asks for.
5. `252-dropHasuraJwt` — needs Chrome extension 1.3.0 live in the Web Store
6. `235-hasuraDecommission` — 7 days after the cut-over; the owner deletes the Hetzner apps

Rules:
- Queue the first unfinished task in the list whose prerequisites are all met. 264 and 265
  run side by side: whichever finishes second queues 234. If the other one isn't `-DONE`
  yet, queue nothing.
- If the next step needs something only a person can give (the extension in the Web Store,
  the 7 days after the cut-over), don't queue it. Finish `-BLOCKED.md`, and give the exact
  date or action in the Results.
- Copy this whole section into any follow-up file you split off, so the chain carries on.

## Notes from #234 (cut-over, 2026-11-25)

- **Production moved to D1 on 2026-11-25 at 20:09 UTC.** Read-only window 20:08:49–20:09:41
  UTC. So this task can run **on or after 2026-12-02**.
- Start with #234's 7-day watch: D1 rows read and written per day against Free (5M / 100k;
  `d1AnalyticsAdaptiveGroups` in Cloudflare's GraphQL API), Worker outcomes (no
  `exceededCpu` = no error 1102; Workers Observability), and errors on the logs page.
- Postgres has been frozen since the switch: no row there is newer than 20:09:41 UTC. A newer
  row means a client still writes to Hasura (extension 1.2.0 saves notes there, until 1.3.0
  is in the Web Store, #252).
- `DATA_BACKEND=d1` is a **Worker secret** on production, not a wrangler var. Delete the
  secret only after the deploy whose code no longer reads it. Deleted earlier, production
  goes back to Hasura.
- `copy-from-postgres.mjs` now refuses `--prod --remote` without `--check` (or
  `--overwrite-live`). Delete the script with the rest of the Hasura code.
