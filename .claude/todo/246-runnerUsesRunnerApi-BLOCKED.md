> Run with: Sonnet 5.5 / high

# Runner calls /api/runner/* instead of Hasura

## Original Requirement

[NEVER REMOVE]

Follow-up from #231 (parent #226). Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

**Work happens in `klarity-claude-kit`** (`plugins/dev-kit/runner/src`). Needs
`RUNNER_API_TOKEN` set in Todzz production first (see #231 Results).

#231 shipped `POST https://www.todzz.eu/api/runner/<op>` with `Authorization: Bearer
<RUNNER_API_TOKEN>`, answering `{ data }` or `{ error }`. Ops
(`src/lib/server/runner/cards.ts`, `extras.ts` in todzz):

| Runner today (gql doc)                     | Op and input                                        |
| ------------------------------------------ | --------------------------------------------------- |
| `BOARD`, sessionUsage `OWNER`              | `board { repo }` → `{ id, user_id, lists }` or null |
| onboard / offboard `BOARDS`                | `boards {}` → `[{ id, name, github, client_id, archived_at }]` (filter archived yourself) |
| canonical `SET_GITHUB`                     | `setBoardGithub { id, github }`                     |
| `CARDS_AT`, `CARDS_AT_PATHS`, `CARDS`, claim `CARD` | `cards { paths }` or `cards { ids }` → `[{ id, task_file_path, list: { name } }]`, oldest first |
| `NEW_CARD`                                 | `createCard { title, content, list_id, user_id, task_file_path }` → `{ id }` |
| `MOVE`, `SET_PATH`, followup `FILED`       | `updateCard { id, set }` (list_id, task_file_path, content, github_*) |
| `DROP`                                     | `deleteCard { id }`                                 |
| claim `CLAIM` / `RELEASE`                  | `claimCard` / `releaseCard { id, machine }` → `{ claimed }` / `{ released }` |
| `SAID`, status `MINE`                      | `comments { todoId, userId?, content? }` → `[{ id, content }]`, newest first |
| `SAY`, status `POST`                       | `createComment { todoId, userId, content }` → `{ id }` |
| status `EDIT`                              | `updateComment { id, content }`                     |
| screenshots `ATTACHED`                     | `uploads { todoId }` → `[{ url }]`                  |
| sessionUsage `PRICING` / pricing `UPSERT`  | `pricing {}` / `upsertPricing { rows }`             |
| sessionUsage `UPSERT`                      | `recordUsage { row }`                               |

`/api/runner/upload` also takes the bearer token now (it still accepts the admin secret
until this lands).

1. Replace `gql()` with `runnerApi(kanban, op, input)`; config takes `apiToken` (and keeps
   `appUrl`). **Use `https://www.todzz.eu`**: `todzz.eu` 307-redirects there, and fetch
   drops `Authorization` on a cross-origin redirect.
2. Drop `endpoint` / `adminSecret` from config and from every `if (!kanban?.endpoint ||
   !kanban?.adminSecret)` guard.
3. Update `config.json` on every runner machine (mac, karel): add `apiToken`, delete
   `adminSecret` and `endpoint`.

**Done when:** a real runner tick files, claims and closes a test card through the new
endpoints, and `grep -r "servicehost\|adminSecret" plugins/dev-kit/runner` finds nothing.

_GitHub issue #246 — end the commit subject with `(#246)`._

_From Kanban card `4785ea61-f982-4648-9b68-d5b00a94682c`, moved to the agent list._

## Results

**Summary** — The runner code is switched and tested, but not live. Two things only a person can do
(below) stand between it and the "Done when" tick.

- **Runner** (`klarity-claude-kit`, branch `runner-api-246`, commit `4166e03`, **pushed as a branch, not
  merged to `main`**): `gql()` is replaced by `runnerApi(kanban, op, input)` in `src/kanban.js`
  (`POST <appUrl>/api/runner/<op>`, bearer `apiToken`, throws `op: <error>` on `{ error }` or a non-2xx).
  Every gql doc in the task's table now calls its op: `board`, `boards`, `setBoardGithub`, `cards`,
  `createCard`, `updateCard`, `deleteCard`, `claimCard`/`releaseCard`, `comments`, `createComment`,
  `updateComment`, `uploads`, `pricing`, `upsertPricing`, `recordUsage`. Config takes `apiToken`;
  `appUrl` now defaults to `https://www.todzz.eu`; `endpoint` / `adminSecret` are gone, and every
  `!kanban?.endpoint || !kanban?.adminSecret` guard is `hasKanban(kanban)` (= has an `apiToken`).
  `/api/runner/upload` is sent the bearer token. Runner `package.json` 0.37.1 → 0.38.0.
- **One op the table missed:** `npm run tiers` reads `claude_usage` with each card's `agent_effort`,
  and no op did that. Added `usage { since }` to todzz (`RUNNER_USAGE` in `documents.ts`, op in
  `src/lib/server/runner/extras.ts`, test, regenerated types) and `scripts/tiers.mjs` calls it.
- Tests: the runner tests' per-file fake Hasura servers are replaced by one `test/fakeApi.js` that
  fakes the runner API (and checks the bearer token). The new fake caught a real bug before
  commit: `onboard.js` still used the deleted `kanban` variable.

**Why it is not merged:** `CLAUDE.md` in the kit says a push to `main` restarts the runner on every
machine. Merged now, a runner with no `apiToken` in its `config.json` would silently stop closing
cards, filing follow-ups and recording usage (it falls back to file-only), and I cannot set the token
myself — I do not have its value and cannot see Vercel / Worker secrets.

**What you need to do**
1. Confirm `RUNNER_API_TOKEN` is set in Todzz production (`openssl rand -hex 32`; Vercel env and/or
   `npx wrangler secret put RUNNER_API_TOKEN`) and redeploy. #231 recorded it as not set yet. The new
   `usage` op in this commit also needs that deploy (it goes out when this is pushed to `main`).
2. In `config.json` on every runner machine (mac, karel, dell): add `"apiToken": "<token>"`, delete
   `adminSecret` and `endpoint`; `appUrl` may stay or be removed (default is now `https://www.todzz.eu`).
   A stale `"appUrl": "https://todzz.eu"` would lose the `Authorization` header to the 307 — set it to
   `https://www.todzz.eu` or delete the line.
3. Merge `runner-api-246` into `klarity-claude-kit` `main` (`https://github.com/kasparpalgi/klarity-claude-kit/pull/new/runner-api-246`).
   Then let one tick file, claim and close a test card, and check `/api/runner/*` in the Todzz logs.
   Once that works, #231's Hasura-removal question can move on.

**Files changed**
- todzz: `src/lib/graphql/documents.ts`, `src/lib/graphql/generated/{gql,graphql}.ts`,
  `src/lib/server/runner/extras.ts`, `src/routes/api/runner/__tests__/ops.test.ts`, `package.json` (0.38.0)
- klarity-claude-kit `plugins/dev-kit/runner`: `src/{kanban,claim,followup,status,screenshots,
  sessionUsage,pricing,handover,onboard,offboard,canonical,config,run}.js`,
  `scripts/{tiers,fetch-claude-pricing}.mjs`, `config.example.json`, `README.md`, `package.json`;
  tests `test/fakeApi.js` (new) and the ten test files that faked Hasura

**Verification**
- Runner `npm test`: 242 passed, 0 failed
- todzz `npm run check`: 0 errors, 0 warnings; `vitest src/routes/api/runner`: 11 passed
- todzz `vitest --run`: 618 passed, 5 skipped. The Playwright e2e in `npm test` ran 31 passed and 1 failed (`e2e/todo-drag-reorder.spec.ts` mouse drag); this change touches no UI, so I take it as unrelated, but I did not re-run it on `main`.
- **Not done:** a real runner tick through the live endpoints (needs steps 1–3). Nothing was run
  against production.
- `grep -r "adminSecret" plugins/dev-kit/runner` finds nothing. `grep servicehost` still finds three
  mentions of `herdr.servicehost.io` (`README.md`, `src/herdr.js`) — that is the herdr phone app's host,
  unrelated to Hasura, so I left it.

**Deviations** — Not merged to the kit's `main` (reason above), so the branch is the delivery. Added
the `usage` op to todzz, which the task did not list.
