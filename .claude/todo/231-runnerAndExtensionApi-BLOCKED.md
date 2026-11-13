> Run with: Opus 5.5 / medium

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

## Handover from #230

- **The extension is the last user of the Hasura JWT.** #230 removed the browser GraphQL
  client, but `/api/auth/token` (JWT minting, `jsonwebtoken`) and `/extension-auth` stay,
  because the extension gets its token from there. Once the extension calls `/api/data/*`,
  delete `src/routes/api/auth/token/`, the `jsonwebtoken` dependency, and the Hasura `user`
  role's remaining permissions.
- The extension's three operations already exist as ops: `getBoards`, `getNotes` (by
  `boardId`) and `createNote` (`{ boardId, parentId?, title, content?, sort_order? }`).
- Hasura's `users` select for the `user` role is now the caller's own row only. The
  extension doesn't join users, so it is unaffected.

## Results

**Summary** — Built the server side for both outside clients and switched the extension.
The rest needs a person (see "What you need to do").

- **`POST /api/runner/<op>`** (`src/lib/server/runner/`): 16 ops cover every one of the
  runner's ~22 admin GraphQL operations: `board`, `boards`, `setBoardGithub`, `cards`
  (by ids or paths), `createCard`, `updateCard`, `deleteCard`, `claimCard`,
  `releaseCard`, `comments`, `createComment`, `updateComment`, `uploads`, `pricing`,
  `upsertPricing` and `recordUsage`. Each op validates its input with Zod. They
  authenticate with `Authorization: Bearer <RUNNER_API_TOKEN>`: the token is its own
  secret, revoked by changing it, and it must be at least 32 characters. Until it is set,
  every call answers 401. `/api/runner/upload` accepts the token too, and keeps accepting
  the admin secret until the runner has switched.
- **Extension 1.3.0** (`chrome-extension/lib/api.js` replaces `graphql.js`): it calls
  `https://www.todzz.eu/api/data/{getBoards,getNotes,createNote}` with the token that
  `/extension-auth` already gives it. `/api/data` checks that token's signature
  (AUTH_SECRET) and expiry with `jose`. The token opens **only those three ops**.
  `createNote` now also takes `cover_image_url`. The `servicehost` host permission, CSP
  entry and allowed origin are removed. `grep -r servicehost chrome-extension` finds
  nothing. Old 1.2.0 keeps working, because the token still carries the Hasura claims.
- **tracker-sync:** already gone. The tracker was dropped in `f2e97f3` / `8acf964` (#226
  Decisions 3), and no `tracker-sync` folder is left.
- **Follow-ups (Backlog):** `250-runnerUsesRunnerApi` switches the runner in
  klarity-claude-kit, with a table mapping each gql doc to its op. `251-runnerOpsOnD1`
  ports the runner ops to D1, where they answer 500 for now. `252-dropHasuraJwt` drops
  the Hasura claims and the `user` role once 1.3.0 is in the store.

**What you need to do**
1. Set `RUNNER_API_TOKEN` in production, then redeploy. Generate it with
   `openssl rand -hex 32`, and set it in Vercel and/or as a Worker secret (`npx wrangler
   secret put RUNNER_API_TOKEN`).
2. **Submit extension 1.3.0 to the Chrome Web Store now.** Zip `chrome-extension/`; the
   steps are in `CHROME_WEB_STORE_SUBMISSION.md`. Review takes days, and 1.2.0 stops
   working when Hasura goes. Before you submit, load it unpacked and save one note.
3. Then queue `250-runnerUsesRunnerApi` with the token at hand. It also updates
   `config.json` on mac and karel and removes the admin secret from them.

**Files changed**
- Created: `src/lib/server/runner/{index,cards,extras}.ts`,
  `src/routes/api/runner/[op]/+server.ts`, `src/lib/server/extensionToken.ts`,
  `chrome-extension/lib/api.js`, tests `src/routes/api/runner/__tests__/ops.test.ts` and
  `src/lib/server/__tests__/extensionToken.test.ts`, follow-ups 250–252
- Modified: `src/lib/graphql/documents.ts` (+ generated), `src/routes/api/data/[op]/+server.ts`,
  `src/routes/api/runner/upload/+server.ts`, `src/lib/server/ops/notes.ts`,
  `chrome-extension/{manifest.json,popup/popup.html,content/content.js,README.md}`, `package.json` (0.36.0)
- Deleted: `chrome-extension/lib/graphql.js`

**Verification**
- `npm run check`: 0 errors, 0 warnings
- `npm test`: 606 passed, 5 skipped
- New unit tests: the runner token gate, 404/400 answers, claim, cards by ids or paths,
  comment filters, 500 masking, and the extension token's op whitelist, forged tokens
  and expiry
- Deploy: pushed `e883501` to `main`, and production serves it. The Vercel status for that
  commit says "Canceled from the Vercel Dashboard", but the new route answers.
- Live, production `https://www.todzz.eu`:
  - `POST /api/runner/board` with no token → `401 Not authorized`. `RUNNER_API_TOKEN` is
    not set yet, so no runner tick has used these endpoints.
  - `POST /api/data/getBoards` with an extension-style token (HS256 with AUTH_SECRET,
    for the owner's user) → `200`, the owner's boards.
  - `deleteBoard` with the same token → `401`.
  - Not done here: saving a note through the unpacked extension. That needs Chrome, and
    it writes production data, so it is your step 2 above.

**Deviations**
- The runner switch in klarity-claude-kit and the machines' `config.json` moved to
  follow-up 250. They need the production token first. If I had switched the runner
  before the token existed, the live runner (which is running this task) would have
  broken.
- Instead of a new token from `/extension-auth`, `/api/data` accepts the token that
  route already gives the extension (HS256, AUTH_SECRET, 24 h), limited to three ops.
  Removing its Hasura claims is follow-up 252.
- Ended `-BLOCKED`: the store submission and the production secret are for a person to do.
