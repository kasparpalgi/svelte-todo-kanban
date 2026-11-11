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
