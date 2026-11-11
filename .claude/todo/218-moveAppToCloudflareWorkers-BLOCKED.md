> Run with: Opus 5.5 / high
> Machine: mac

# Move the SvelteKit app from Vercel to Cloudflare Workers (Free)

## Original Requirement

[NEVER REMOVE]

> Run with: Opus 5.5 / high

# Move the SvelteKit app from Vercel to Cloudflare Workers (Free)

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #215 (move Todzz to Cloudflare, fit the free plan). Original request: "Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? … Is Hasura really needed?"

Do this after #216 (bundle) and #217 (passwords). Hasura and Postgres stay on Hetzner. Plan and measurements: `.claude/todo/215-planAndMoveTo-DONE.md`.

**Needs a human:**

- Move `todzz.eu` DNS from Namecheap to the Cloudflare account in `.env` (`CLOUDFARE_ACCOUNT_ID`). Cloudflare imports the existing records.
- Approve the cut-over moment.

**Build**

1. `@sveltejs/adapter-cloudflare@7` (v8 needs SvelteKit 3) in `svelte.config.js`. Add `wrangler.jsonc` with `main: .svelte-kit/cloudflare/_worker.js`, `assets.directory`, a compatibility date of 2026-08-04 or later (`nodejs_compat` on), and `.assetsignore`.
2. Deploy from GitHub Actions (`wrangler deploy` with `CLOUDFARE_API_TOKEN`), or with Workers Builds. `$env/static/private` is inlined at **build** time, so the build needs every secret; use `$env/dynamic/private` wherever a runtime secret is cleaner.
3. Swap `@vercel/analytics` and `@vercel/speed-insights` (`src/routes/+layout.ts`) for Cloudflare Web Analytics.
4. Test under `wrangler dev` before the switch:
   - `pdf-parse` (invoice and bank-statement extract). If it fails, send the PDF straight to OpenAI as file input.
   - Sending a push with `web-push` (#215 tested only payload encryption).
   - A real invitation email through nodemailer and Gmail SMTP (#215 tested `verify()` only).
5. `/api/transcribe-podcast` cannot run on Workers (child_process, ffmpeg, yt-dlp). Ask the owner to pick one:
   - (a) a small Node service on the Hetzner CapRover box
   - (b) send direct audio under 25 MB to OpenAI without ffmpeg
   - (c) drop the podcasts page

**Cut-over**

1. Attach `todzz.eu` and `www.todzz.eu` to the Worker as custom domains.
2. Keep the Vercel project for a week as the rollback.
3. Check Google sign-in, the email link, a password sign-in, the GitHub webhook, a Stripe test webhook, an upload, push, and the Chrome extension.

**After:** watch Workers → Metrics → CPU time. If exceeded-CPU errors (1102) show up on heavy pages, the fix is Workers Paid at $5/mo, not code.

*GitHub issue #218 — end the commit subject with* `(#218)`*.*

_From Kanban card `150b6b9d-f25b-4099-a05c-3db07d47a265`, moved to the agent list._

_GitHub issue #218 — end the commit subject with `(#218)`._

## Results

**Summary** — The app now builds for and runs on Cloudflare Workers. It is live at
`https://todzz.svelte-todo-kanban.workers.dev` (worker `todzz`, no custom domain yet).
Production stays on Vercel until you say go.

- **Adapter:** `@sveltejs/adapter-cloudflare@7`. `svelte.config.js` keeps adapter-auto
  when `VERCEL` is set, so pushes to `main` still deploy Vercel during the rollback week.
  `wrangler.jsonc`: compatibility date 2026-11-01, `nodejs_compat`. The adapter writes
  `.assetsignore` itself.
- **Secrets at runtime:** every `$env/static/private` import (16 files) is now
  `$env/dynamic/private`. Secrets live only on the Worker and the build needs none.
  `scripts/cf-secrets.sh <env-file>` uploads them with `wrangler secret bulk`. It skips
  `PUBLIC_*` and `CLOUDFARE_*`, and strips quotes, comments and `\r`. 28 secrets uploaded
  from the local `.env`.
- **Auth config is lazy:** `SvelteKitAuth(async () => …)`. Kit's build-time analyse step
  imports `hooks.server.ts`, and `HasuraAdapter` threw without an admin secret.
- **Deploy:** a GitHub Actions workflow runs `npm ci`, build and `wrangler deploy` on
  every push to `main`. Repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  are set. The public `PUBLIC_*` values sit in the workflow file. It is parked at
  `scripts/deploy-cloudflare.yml`: GitHub refused to push it under `.github/workflows/`
  because the runner's OAuth token lacks the `workflow` scope.
- **Analytics:** removed `@vercel/analytics` and `@vercel/speed-insights` (deleted
  `src/routes/+layout.ts`). Created a Cloudflare Web Analytics site for `todzz.eu` and
  added its beacon to `src/app.html`. It works on Vercel too, so analytics continue
  through the cut-over.
- **PDF extract:** pdf-parse fails on Workers (`ReferenceError: DOMMatrix is not
  defined`). Invoice and bank-statement extract now send the PDF to OpenAI as a Chat
  Completions `file` part (`src/lib/server/pdfMessage.ts`). pdf-parse uninstalled. Side
  effects: scanned PDFs now work too; `raw_text_preview` and `textLength` dropped from the
  responses (nothing in the UI read them).
- **Auth fix found on the way:** password and magic-link sessions called Google's token
  refresh on every request and failed (`invalid_grant`). That cost one extra Google request
  per request, and Workers caps the number of outgoing requests. Added
  `if (!token.refreshToken) return token;`.

**Measured on the live Worker (Workers Free plan)**

| | Worker (workers.dev) | Vercel (www.todzz.eu) |
| --- | --- | --- |
| Board page `/en/test/tests-board`, wall time | 0.17–1.1 s | 0.9–41.8 s (5 runs) |
| Board page CPU, 20 warm runs | p50 21.7 ms, p90 27.9 ms, max 73 ms | — |
| All 35 requests | 0 errors; max 246 ms CPU (cold start) | — |
| Bundle | 1.11 MB gzip (limit 3 MB), startup 51 ms | — |

**CPU warning:** a board render takes about 22 ms of CPU, more than double the Free plan's
10 ms. Cloudflare served every request anyway, so it is not enforcing the limit strictly
today. Error 1102 is what you would see once it does. Workers Paid ($5/mo) raises the
limit, so decide on it before or soon after the cut-over.

**Checks under `wrangler dev` and on the live Worker**
- Password sign-in (right → 302 to `/en`, wrong → `CredentialsSignin`), session,
  `/api/auth/token`, board SSR: pass, both local and live.
- `web-push`: a real send to Mozilla's push service with a generated subscription got 404
  (unknown subscription). A bad VAPID signature or bad encryption would get 400/401, so
  sending works. Done through a temporary route, deleted before commit.
- nodemailer + Gmail SMTP: a real invitation email sent through `/api/invitations/send`
  to the sender's own Gmail account (`accepted`, with a messageId).
- PDF extract: the route no longer crashes. The OpenAI call itself is **not tested**: the
  test user is on the free plan, and the `OPENAI_API_KEY` in local `.env` is rejected by
  OpenAI (`invalid_api_key`). The request shape matches OpenAI's file-inputs guide.

**Files changed**
- created: `wrangler.jsonc`, `scripts/deploy-cloudflare.yml`,
  `scripts/cf-secrets.sh`, `src/lib/server/pdfMessage.ts`
- modified: `svelte.config.js`, `src/app.html`, `src/hooks.server.ts`,
  `package.json` (0.26.3 → 0.27.0), `package-lock.json`, the two extract routes, and the
  env imports in `server-client.ts`, `admin.ts`, `aiKey.ts`, `push.ts`, `upload.ts`,
  `crypto.ts`, `auth/token`, `calendar-event`, `github`, `github/callback`,
  `google-calendar`, `google-calendar/callback`, `invitations/send`, `runner/upload`,
  `upload`, plus `runner/__tests__/upload.test.ts`
- deleted: `src/routes/+layout.ts`

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- `vitest --run` (client + server): 42 files, 426 tests passed.
- Build with no `.env` and only the workflow's public values: passes (what CI does).
- `VERCEL=1 npm run build`: passes with adapter-vercel, so the Vercel deploy still works.
- `npm ci --dry-run`: the lockfile is consistent.
- e2e (Playwright) not run. The app's own behaviour is covered by the live checks above.

**Deviations**
- DNS is already on Cloudflare (owner, mid-run), so the Namecheap step is gone.
- `$env/dynamic/private` everywhere, not just where it was "cleaner": one place for
  secrets, and a build that needs none.
- Compatibility date 2026-11-01. The adapter writes `.assetsignore`, so no hand-written
  copy.

**What is left for you (why this is BLOCKED)**

1. **Turn on auto-deploy:** `gh auth refresh -h github.com -s workflow`, then
   `mkdir -p .github/workflows && git mv scripts/deploy-cloudflare.yml .github/workflows/`,
   commit and push. Until then, deploy by hand: `npm run build && npx wrangler deploy`,
   with the `PUBLIC_*` values from the workflow file exported for the build.
2. **Production secrets.** The Worker has the secrets from the local `.env`, which is not
   the production set: `OPENAI_API_KEY` is invalid, and `STRIPE_WEBHOOK_SECRET` and
   `STRIPE_PRICE_ID` are missing. Run `vercel env pull .env.production` (or copy the values
   from the Vercel dashboard), then `scripts/cf-secrets.sh .env.production` with
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exported.
3. **`/api/transcribe-podcast`** cannot run on Workers. Pick one: (a) a small Node
   service on the Hetzner CapRover box, (b) send audio under 25 MB straight to OpenAI
   without ffmpeg, or (c) drop the podcasts page. Until then the route will error on the
   Worker.
4. **Workers Paid or not:** see the CPU warning above.
5. **Cut-over, when you approve it:**
   - Workers → `todzz` → Settings → Domains & Routes: add `todzz.eu` and `www.todzz.eu`
     as custom domains. Delete the old Vercel DNS records first if Cloudflare asks.
   - Leave the Vercel project for a week as the rollback.
   - Check Google sign-in, the email link, a password sign-in, the GitHub webhook, a
     Stripe test webhook, an upload, push, and the Chrome extension.
   - After the week: remove the `VERCEL` branch in `svelte.config.js` and
     `@sveltejs/adapter-auto`.
