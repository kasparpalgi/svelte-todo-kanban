> Run with: Opus 5.5 / xhigh
> Machine: karel

# Plan and move to Cloudfare

## Original Requirement

[NEVER REMOVE]

Think how to move to Cloudfare and fir there on the free plan. Or Supabase free plan? I think Cloudfare is more generous on free plan? Hasura can't be installed on Cloudfare? Or can? Is Hasura really needed?

I have added Cloudfare related access to the .env at the bottom.

_From Kanban card `d756bf99-e69b-4541-908c-e807a1ea48b2`, moved to the agent list._

_GitHub issue #215 — end the commit subject with `(#215)`._

## Where Todzz runs today (measured 2026-11-11)

| Piece | Where | Numbers |
| --- | --- | --- |
| SvelteKit app + `/api/*` | Vercel (`server: Vercel`). Functions run in **iad1, Washington DC** (`x-vercel-id: arn1::iad1::…`) | every SSR/API query to Hasura crosses the Atlantic and back |
| Hasura v2.46 + Postgres 15 | CapRover on a Hetzner ARM box, Helsinki (`api.todzz.eu` = `todzz.admin.servicehost.io`) | DB 169 MB: `logs` 125 MB, `tracker_sessions` 22 MB with 0 rows (bloat), real data ≈ 20 MB. 57 users, 87 boards, 1,677 todos |
| Files | Backblaze B2, or the owner's own R2 (#194) | 19 uploads |
| DNS | `todzz.eu` at Namecheap; `servicehost.io` already on Cloudflare | |

What Hasura does here: GraphQL CRUD plus row permissions, nothing else. There are no actions,
event triggers, cron triggers, remote schemas or subscriptions. The app depends on it through
123 operations in `documents.ts`, the inline queries in the server routes, 41 tables of
permission YAML, Auth.js `HasuraAdapter`, the Chrome extension (which hard-codes
`todzz.admin.servicehost.io`) and tracker-sync. The alias, sort and activity logic lives in
Postgres itself (41 PL/pgSQL functions, 40 triggers), not in Hasura.

## Answers

**Is Cloudflare more generous than Vercel?** Yes, for the app. Workers Free gives 100k requests
a day, serves static assets free with no metering, and **allows commercial use**. Vercel Hobby is
"non-commercial personal use only", and processing payments counts as commercial. Todzz takes
Stripe payments, so it needs Vercel Pro ($20/mo) to stay legal on Vercel. Workers Free has three
limits that matter: **10 ms CPU per request**, a **3 MB gzipped** bundle, and **50 external
subrequests** per request.

**Supabase free plan?** Supabase hosts Postgres (500 MB, 2 projects, paused after 7 days without
requests). It does not host Hasura. Putting Hasura's database on Supabase while Hasura stays on
Hetzner would add a network hop to every query and gain nothing. Supabase only pays off if Hasura
is dropped and every query is rewritten for PostgREST/pg_graphql with RLS policies. Not worth it
today.

**Can Hasura run on Cloudflare?** Not on Workers: Hasura is a long-running Haskell server. It can
run in Cloudflare Containers, but those need Workers Paid ($5/mo plus usage), sleep when idle
(Hasura then takes seconds to cold-start), and still need a Postgres somewhere else. Cloudflare's
own database, D1, is SQLite. Hasura does not support it, and the PL/pgSQL functions and triggers
would not port.

**Is Hasura really needed?** Not in principle, because here it is only the CRUD-plus-permissions
layer. Removing it means rewriting all of the dependencies listed above, and it costs nothing
extra on the Hetzner box. **Keep it.** Revisit only if the Hetzner box itself goes away.

## Recommended plan

Move **only the SvelteKit app** to Cloudflare Workers Free. Keep Hasura and Postgres on Hetzner,
and move the app's own files from B2 to R2. The domain stays `todzz.eu`, so the Google OAuth,
GitHub webhook and Stripe webhook URLs do not change. There is also a speed gain: a Worker runs in
the Cloudflare location next to the user (Tallinn, Helsinki, Stockholm), a short hop from the
Helsinki Hasura, instead of in iad1. That speeds up every SSR query and `/api/auth/token` (#213,
p50 1.7 s). Even without moving, setting Vercel's function region to a European one would get
most of this latency gain.

Order: **216** slim the server bundle → **217** check passwords in Postgres → **218** switch to
Workers (needs you for DNS and secrets) → **219** app files to R2 → **220** take the DB password
out of git. Items 216, 217, 219 and 220 work on Vercel too, so they can ship before the switch.

## Spike: what was measured

I built the app with `@sveltejs/adapter-cloudflare@7.2.10` and `wrangler@4.160.0` (installed
`--no-save`, then reverted; nothing committed):

- **Builds unchanged** (55 s). The bundle only fails because of Playwright
  (`chromium-bidi` cannot be resolved). With Playwright stubbed, the bundle is **37.2 MB raw /
  2.17 MB gzipped**, under the 3 MB Free limit with little room to spare. **`googleapis` is
  30.1 MB of the 37.9 MB**; the next largest are pdf-parse (1.2 MB) and nodemailer (0.4 MB).
- **It runs in local workerd**: `/signin` returns 200 in about 30 ms warm, `/en` redirects to
  sign-in, and Hasura is reachable.
- **Under `nodejs_compat`** (on by default from compatibility date 2026-08-04): `jsonwebtoken`
  HS256 sign/verify works, `web-push` payload encryption with VAPID works, and `nodemailer` logs
  in to Gmail SMTP (`verify()` only, no mail sent). `node:crypto`, used by `r2.ts`,
  `utils/crypto.ts` and the webhook HMACs, is native in workerd.
- **bcrypt breaks the CPU limit**: a bcryptjs cost-10 compare takes **86 ms of CPU**, and
  native PBKDF2 at 100k iterations takes 48 ms. 14 of the 57 users sign in with a password.
  Postgres `pgcrypto` (installed on the server) verifies the existing `$2b$` hashes when the
  prefix is read as `$2a$` (same algorithm for passwords under 255 bytes). Tested on production,
  read-only: right password → `t`, wrong → `f`. So the check can move into Postgres (217).
- **Cannot run on Workers at all**:
  - The Playwright routes `og-screenshot.png` and `/api/og-image`. No UI links to them (the page
    uses the SVG `og-image.png`), and Vercel has no Chromium either.
  - `/api/transcribe-podcast` (child_process, ffmpeg, yt-dlp). You decide its fate in 218.

**Risk to watch after the switch:** SSR on heavy pages could exceed the 10 ms CPU limit. Workers
Free has no burst allowance. If the Cloudflare dashboard shows exceeded-CPU errors (1102), Workers
Paid at $5/mo (against $20 for Vercel Pro) raises the limits to 5 min CPU, a 10 MB bundle and
1,000 subrequests. Email: Cloudflare Email Service only sends to arbitrary recipients on Paid, so
keep Gmail SMTP through nodemailer.

## Security issues found on the way

- **`/api/test-hasura` was public.** With no sign-in, `https://www.todzz.eu/api/test-hasura`
  ran a query as the Hasura admin and returned a user's email, the endpoint and the admin
  secret's length. Nothing linked to it. **Deleted in this commit.**
- **`hasura/metadata/databases/databases.yaml` contains the production Postgres password in
  git.** The host is CapRover-internal (`srv-captain--todzz-db`), so it is not directly reachable
  from outside. Still, rotate the password and read the URL from an environment variable (220).

## Sources

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and
  [pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [nodejs_compat on by default](https://developers.cloudflare.com/changelog/post/2026-08-04-nodejs-compat-default/)
- [Containers: Workers Paid only](https://developers.cloudflare.com/containers/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/),
  [Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/),
  [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Vercel fair use: Hobby is non-commercial](https://vercel.com/docs/limits/fair-use-guidelines)
- [Supabase free tier, 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
  (third-party; confirm on supabase.com/pricing)

## Results

**Summary** — Answered the four questions and wrote the plan: the SvelteKit app moves to
Cloudflare Workers Free, Hasura and Postgres stay on Hetzner, and files move to R2. A
build-and-run spike measured bundle size, Node API compatibility and bcrypt CPU, and confirmed
that Postgres can check the existing password hashes. Removed the public `/api/test-hasura` route
that leaked a user's email. Split the rest into five Backlog follow-ups (216–220).

**Files changed**
- deleted `src/routes/api/test-hasura/+server.ts`
- modified `package.json` (0.26.0 → 0.26.1) and this file (renamed `-DONE.md`)
- created `.claude/todo/216-slimServerBundle.md`, `217-passwordCheckInPostgres.md`,
  `218-moveAppToCloudflareWorkers.md`, `219-appUploadsToR2.md`, `220-dbPasswordFromEnv.md`

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- Server unit tests: 30 files, 338 tests passed.
- Nothing referenced the deleted route (grep).
- Client and e2e suites not run: the only code change is that route deletion.
- `/verify` could not be invoked from the runner (user-only skill).

**Deviations** — The adapter switch is not committed. A push to `main` deploys to Vercel, and
`adapter-cloudflare` would break that deploy, so the switch waits for 218 together with the DNS
change.
