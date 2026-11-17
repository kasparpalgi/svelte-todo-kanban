> Run with: Opus 5.5 / xhigh
> Machine: karel

# Finish move to Cloudfare

## Original Requirement

[NEVER REMOVE]

**Steps left before Hetzner can be emptied, in order:** 

1\. **You:** finish #218: copy the production secrets to the `todzz` Worker, then attach    `todzz.eu` / `www.todzz.eu` as its custom domains. ---&gt; YOU DO IT!!! Or explain what secrets you can't access and I can??? Don't you have secrets in .env? In Caprover something then Caprover is logged in and open at Mac on Chrome Claude plugin. 

2\. **You:** #231 / #246: `RUNNER_API_TOKEN` in production, extension 1.3.0 submitted, and    merge `runner-api-246` in klarity-claude-kit once each runner's `config.json` has the token. --&gt; WHY YOU CAN'T DO? where is the RUNNER_API_TOKEN that you can't access? Where do I access it? <https://chrome.google.com/u/1/webstore/devconsole/31d5640a-b865-43d0-92da-091e4eb3c8be> is also open in Chrome so submit the extenstion there.

3\. **Queue from the Backlog** (code work a runner can do, one session each): 242 cards --&gt; THEN run this

_From Kanban card `66bb7dc4-d0b9-45c0-ba1b-7c59e6a566b8`, moved to the agent list._

_GitHub issue #254 — end the commit subject with `(#254)`._

## Results

**Summary** — **Production now runs on the Cloudflare Worker.** `www.todzz.eu` and `todzz.eu`
moved off Vercel on 2026-11-17 at 09:23 UTC, with about 3 seconds of gap. The runner is on the
runner API, and its token is in place everywhere. One step is left for you: uploading the
extension to the Web Store. Claude in Chrome on the Mac could not connect (see below). Hetzner
still can't be emptied: the data is still in Hasura until 242–245 and the cut-over (#234).

Answers to your questions:
- **The secrets.** `.env` had all of them except one. I pulled the Vercel production env
  with the Vercel CLI on the Mac, which is signed in to `crewnewgits-projects`. The CLI on
  karel is signed in to TekTok, which can't see the project. Six variables are stored as
  "Sensitive" and only pull as `[SENSITIVE]`, so I took those from `.env` and checked each one:
  - the VAPID private key derives production's public key;
  - a GitHub webhook ping's HMAC matches the local `GITHUB_WEBHOOK_SECRET`;
  - the Stripe key answers 200.

  The only real difference was `API_ENDPOINT`: production uses `https://api.todzz.eu/v1/graphql`.
- **`RUNNER_API_TOKEN` had never been created.** That's why nobody could find it. I generated
  it (`openssl rand -hex 32`). It is in the Mac's `.env` as `RUNNER_API_TOKEN`, which the
  runner copies to karel and dell. It is also a Worker secret, a Vercel production env, and
  `apiToken` in `config.json` on mac, karel and dell.
- **CapRover wasn't needed.** Every value came from Vercel or `.env`.

**1. Secrets and domains (#218), done**
- 34 secrets are on the `todzz` Worker: production's values, plus the R2 keys, the runner token
  and `R2_JURISDICTION`. `scripts/cf-secrets.sh` now uploads the app's R2 keys (it used to drop
  every `CLOUDFARE_*`), skips Vercel's own variables, and refuses a `[SENSITIVE]` placeholder.
- Built from this commit with production's public values (`PUBLIC_APP_URL=https://todzz.eu`,
  as on Vercel; Google Calendar's registered callback is built from it) and deployed.
- Cut-over steps:
  1. Added a zone Redirect Rule: `todzz.eu/*` → 307 → `https://www.todzz.eu/*`, query kept,
     the same as Vercel's redirect.
  2. Deleted the Vercel DNS records (`CNAME www`, `A todzz.eu`).
  3. Attached both hostnames to the Worker as custom domains, also declared in `wrangler.jsonc`.
- Auto-deploy is on: `.github/workflows/deploy-cloudflare.yml` (moved from `scripts/`). The repo
  secrets are re-set to the token that deploys with the custom domains.
- Vercel still builds on every push, but no domain points at it. It is the rollback for a week.
  Removing it is follow-up `257-dropVercel.md` (Backlog), which also has the rollback steps.

**Bugs found and fixed on the way**
- **Uploads to the app bucket never worked.** Vercel had no R2 keys at all. Once the keys
  were there, R2 answered `NoSuchBucket`: bucket `todzz` is in the **EU jurisdiction**, and only
  `<account>.eu.r2.cloudflarestorage.com` can see it. `R2Credentials.jurisdiction` and
  `R2_JURISDICTION=eu` fix that. A live upload now stores the file and serves it from the
  public URL.
- **GitHub calls answered 403 on the Worker.** GitHub's API rejects a request with no
  `User-Agent`. Node's fetch sent one by default; a Worker's fetch sends none. This hit 2 of
  your issue updates right after the switch. Every GitHub fetch now sends `User-Agent: Todzz`.
- **`npm ci` failed** (`Missing: picomatch@4.0.7 from lock file`), which would have broken the CI
  deploy. Regenerated the lockfile with npm 10.

**2. Runner and extension (#231 / #246)**
- Runner: rebased `runner-api-246` onto the kit's `main` (only the version conflicted) and pushed
  it (`bf82c9e`). Live calls with karel's real config worked: `board`, `cards` and `pricing`.
- Within a minute, mac and dell logged `kanban: (intermediate value).todos is not iterable`
  for every repo. `reconcileCards` still read the old GraphQL shape. Fixed in `4176e12`
  (runner 0.38.1), with a test that reproduces the error. Kit tests: 244/244.
- Mac and dell take each push on their next tick. Karel takes it when this session ends.
- `adminSecret` / `endpoint` are still in the three `config.json` files. The new code ignores
  them, and karel's current tick still runs the old code, which needs them. Delete them once
  `/api/runner` is the only path (see below).
- **Extension 1.3.0: not submitted.** The zip is ready at `~/Downloads/todzz-extension-1.3.0.zip`
  on the Mac (16 files; manifest 1.3.0). Its whole flow passed against production as the test
  user:
  - `/api/auth/token`, then `getBoards`, `getNotes` and `createNote` all worked;
  - any other op is refused with that token;
  - the test note was deleted.

  The submission failed because Claude in Chrome found no connected browser. Claude Code on
  the Mac is signed in to a different Claude account (`bengtsundstroem@…`) than the Chrome
  extension, so the two can't pair.

**3. Queue 242** — after this commit is pushed, card 242 (`d1OpsCards`) is moved from Backlog to
TODO, so the next free runner takes it.

**What you need to do**
1. **Submit the extension (2 minutes):** Web Store dashboard → ToDzz → Package → *Upload new
   package* → `~/Downloads/todzz-extension-1.3.0.zip` → *Submit for review*. If it asks about the
   host permissions: "Saves the current page as a note in the user's own ToDzz account; talks only
   to the ToDzz API at todzz.eu / www.todzz.eu."
2. **Claude Code on the Mac:** its sign-in ends by 2026-11-19 ("Renewing it does not move that
   date"). Run `claude auth login`, or `claude setup-token` for unattended jobs, or the Mac
   runner stops. Log Claude Code and the Chrome extension in with the same account if you want
   agents to drive your Chrome.
3. `OPENAI_API_KEY` is rejected by OpenAI (401), in production too. Replace it if the app's own
   key should work.
4. After 2026-11-24, queue `257-dropVercel`.
5. After one runner tick on each machine with no errors, delete `adminSecret` and `endpoint`
   from the three `config.json` files. The Mac runner's LaunchAgent also still has
   `HASURA_ADMIN_SECRET` in its environment.

**Files changed**
- created: `.github/workflows/deploy-cloudflare.yml` (moved from `scripts/`),
  `.claude/todo/257-dropVercel.md`
- modified: `wrangler.jsonc`, `scripts/cf-secrets.sh`, `src/lib/server/r2.ts`,
  `src/lib/server/storeFile.ts`, `src/lib/server/github.ts`,
  `src/routes/api/github/callback/+server.ts`, the tests `storeFile.test.ts` and `github.test.ts`,
  `.env.example`, `CLAUDE.md`, `package.json` / `package-lock.json` (0.41.0 → 0.42.0, lockfile resync)
- klarity-claude-kit: `bf82c9e` (#246, rebased) and `4176e12` (`src/kanban.js`,
  `test/kanban.test.js`, runner `package.json` 0.38.1)
- outside git: the Worker's secrets and custom domains; the zone's DNS and Redirect Rule; Vercel
  production env (`RUNNER_API_TOKEN`, R2 keys, `R2_JURISDICTION`); the repo's Actions secrets; the
  Mac's `.env`; the three runners' `config.json`

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 63 files, 641 passed, 12 skipped.
  Local Playwright: 32/32.
- Live production (`E2E_BASE_URL=https://www.todzz.eu`): **32/32**. On `workers.dev` before the
  switch, 30/32 on the first run; the two failures (mouse drag, typed credentials) passed on
  two re-runs.
- Live checks:
  - `www.todzz.eu` answers from Cloudflare with no `x-vercel-id`.
  - Apex → 307 to www, query kept.
  - `/api/runner/board`: 401 without the token, the board with it.
  - GitHub webhook ping through the Worker: 200.
  - Upload to R2 and fetch from its public URL: 200 (test object deleted).
  - The extension flow above.
- Kit `npm test`: 244/244.
- Not checked live: Google sign-in in a real browser, the magic-link email and push. Same
  secrets and same code as on Vercel, and push and email were tested on the Worker in #218.

**Deviations**
- Fixed the R2 jurisdiction, GitHub `User-Agent`, lockfile and runner `.todos` bugs. None was in
  the request, but each one broke a feature on the new host.
- Didn't remove `adminSecret` / `endpoint` from the runner configs yet (reason above).
- Renamed `-BLOCKED`: only the Web Store upload is left, and it needs you.
