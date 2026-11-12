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
