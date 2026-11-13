> Run with: Opus 5.5 / medium
> Machine: mac

# Runner, Chrome extension and tracker-sync stop using Hasura

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Runner, Chrome extension and tracker-sync stop using Hasura

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, sections 7 and 9.

1. **Runner** (repo `klarity-claude-kit`, `plugins/dev-kit/runner/src`): it sends about 20 GraphQL operations with the **Hasura admin secret** (`kanban.js` `gql()`, used by claim, followup, status, screenshots, offboard, onboard, canonical, pricing and sessionUsage). Add `/api/runner/*` endpoints in this repo for what it does: find a board by repo, list and create cards at a task path, claim, move to Review, comment and edit comments, list uploads, set `boards.github`, pricing, usage. Authenticate them with a `RUNNER_API_TOKEN` bearer token, revocable and separate from the admin secret. Switch the runner to them and update `config.json` on every runner machine (mac, karel). The admin secret then leaves those machines.
2. **Chrome extension** (`chrome-extension/lib/graphql.js` hard-codes `todzz.admin.servicehost.io`; GetBoards, GetNotes, CreateNote): call `https://todzz.eu/api/data/*` with a bearer token issued by `/extension-auth`. Bump the version and **ask the owner to submit it to the Chrome Web Store early**: review takes days, and the old version stops working when Hasura goes.
3. **tracker-sync** (admin secret, writes `tracker_apps` and `tracker_sessions`): follow 226, Decisions 3. If it is dropped, remove the folder.

**Done when (deploy + live check):** deployed. A real runner tick files, claims and closes a test card through the new endpoints. The extension (unpacked) lists boards and saves a note on production. `grep -r servicehost` finds nothing in the extension or the runner.

*GitHub issue #231 — end the commit subject with* `(#231)`*.*

_From Kanban card `85505a2e-2f30-4e48-9409-3c3fa41fe366`, moved to the agent list._

_GitHub issue #231 — end the commit subject with `(#231)`._
