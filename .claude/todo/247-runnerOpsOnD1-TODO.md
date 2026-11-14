> Run with: Opus 5.5 / high
> Machine: mac

# Runner ops on D1

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / medium

# Runner ops on D1

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #231 (parent #226). Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

`/api/runner/<op>` (`src/lib/server/runner/`) runs on Hasura only: under `DATA_BACKEND=d1`its ctx has no Hasura, so every runner op answers 500 on staging. Give each runner op a D1 version the way `src/lib/server/ops/d1` does for the browser ops (#233), with contract tests, before the cut-over (#234). Match a repo on the `boards.github_repo` column the plan adds (226 section 2) rather than a substring of the JSON. Also port `/api/runner/upload`'s card lookup and insert.

**Done when:** on the staging Worker, every runner op answers the same as production does for the same data (contract test), and a runner pointed at staging closes a test card.

*GitHub issue #247 — end the commit subject with* `(#247)`*.*

_From Kanban card `627e44ea-6f0a-499e-930f-86358b931e86`, moved to the agent list._

_GitHub issue #247 — end the commit subject with `(#247)`._
