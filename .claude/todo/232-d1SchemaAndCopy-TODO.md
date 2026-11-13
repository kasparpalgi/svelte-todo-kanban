> Run with: Opus 5.5 / xhigh
> Machine: dell

# D1 database, schema and a re-runnable Postgres → D1 copy

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# D1 database, schema and a re-runnable Postgres → D1 copy

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`. Phase 2, step 1. Needs the #218 cut-over (D1 is reachable only from a Worker) and the owner's answers in 226, Decisions 1–3.

1. Create the D1 databases `todzz` and `todzz-staging` with `--location eeur` (users are in Estonia). The `CLOUDFARE_API_TOKEN` in `.env` can list D1; `wrangler d1 list` showed none on 2026-11-12. Bind `DB` in `wrangler.jsonc` and add a staging environment; type `App.Platform.env.DB`.
2. Drizzle ORM 0.45.x (stable; 1.0 was still rc on 2026-11-12) with schema in `src/lib/server/db/schema/*.ts`, and migrations from `drizzle-kit generate` applied with `wrangler d1 migrations apply`. Conventions: UUID text ids (URLs, GitHub links and runner card ids keep working); ISO-8601 UTC text timestamps (the strings the client already parses); JSON as text; booleans as 0/1; CHECKs kept. Apply the section changes from 226: no `sessions`; `user_secrets`; `boards.github_repo` and `boards.changed_at`; `assigned_to` folded into `todo_assignees`; no invitation email-tracking columns; one log timestamp; indexes only for real access paths (add `todos.list_id` and `lists.board_id`, drop duplicates). Every index costs an extra row written.
3. `scripts/d1/copy-from-postgres.mjs <tables…>`: read through Hasura `run_sql` (admin secret, `read_only`), convert types, write SQL, run `wrangler d1 execute --file`. Re-runnable (it clears the target tables first). Logs: last 30 days only. It must stay under the 100k rows/day written of Free: ≈ 15k rows plus their index rows.
4. Copy prod → `todzz-staging` and compare row counts per table.
5. Measure with `meta.rows_read` and duration: a board load and a poll for `/en/test/tests-board` and for the biggest board. Write the numbers in Results and re-check the daily read budget.

**Done when (deploy + live check):** the Worker deploys with the binding and still serves production from Hasura (nothing reads D1 yet). Live check as the test user: board loads as before. The staging copy's row counts match Postgres.

*GitHub issue #232 — end the commit subject with* `(#232)`*.*

_From Kanban card `f326cbae-c43a-4037-bb98-33d781f50d24`, moved to the agent list._

_GitHub issue #232 — end the commit subject with `(#232)`._

## Handover from #230

- **`user_secrets` belongs in this schema.** #230 protects the encrypted tokens in code
  instead of moving them to a separate Postgres table now:
  - `updateMe` keeps every stored `settings.tokens.*` except `groq`, so the browser can't
    drop or overwrite them;
  - `getMe` shows the browser `encrypted: true` and never the ciphertext;
  - `disconnectIntegration` removes `github` / `google_calendar`.

  In D1, put `github`, `google_calendar`, `openai` and `r2` into a server-only
  `user_secrets(user_id, name, value)` table and drop them from `users.settings`. Readers
  to switch: `src/lib/server/{github,aiKey,storeFile,plan}.ts`, `api/keys`,
  `api/google-calendar/callback`, `api/calendar-event`, the GitHub OAuth callback and the
  webhook's `GET_USER_BY_GITHUB_USERNAME`.
