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
