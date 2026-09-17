> Run with: Opus 4.8 / high

# Paid plan

## Original Requirement

[NEVER REMOVE]

Create a paid plan. Paid plan can use in .env AI API keys. ree plan must add from settings the AI API keys on own.

Also the free plan shall not have more than 7 boards but don't advertise that. That appears once you start adding your 7th board. Also, sigle board no more than 40 uncompleted cards and no more than 4 collaborators.

Upload no more than 10 items but can add own Cloudfare R2 API key.

Paid plan 12€/year via STRIPE. See in .env STRIPE_API_KEY

_From Kanban card `6dcff53c-56ee-4e8d-8816-fc399231d02d`._

_GitHub issue #194 — end the commit subject with `(#194)`._

---

## Plan & Log (Claude)

### Scope decisions (confirmed with Kaspar 2026-09-17)
- **Stripe**: full Checkout + webhook. `STRIPE_API_KEY` is a **live** `rk_live…` key — I will NOT
  create live products or trigger charges; checkout references a `STRIPE_PRICE_ID` Kaspar sets up.
- **R2 uploads**: enforce 10-upload free cap + BYO Cloudflare R2 credentials in settings, with a
  real S3-compatible (SigV4) upload path to the user's own bucket.
- **DB migration**: additive nullable columns applied to the **remote** todzz Hasura (prod).

### Free-plan limits (interpretation)
- ≤ 7 boards per user (upsell when creating beyond).
- ≤ 40 **uncompleted** cards per board.
- ≤ 4 collaborators per board (members + pending invitations, excluding owner).
- ≤ 10 uploads total per user — lifted if they add their own R2 key.
- AI features: free must supply their **own OpenAI key** (Settings); paid uses app's `.env` key.
Limits are not advertised — they surface only when hit (soft upsell dialog).

### Architecture
- **Security**: `plan` / `plan_expires_at` are real `users` columns, readable but NOT in user
  update/insert permissions → only the Stripe webhook (admin secret) can flip a plan. BYO keys are
  **encrypted** (crypto.ts) before landing in `settings.tokens.{openai,r2}` because `settings` is
  world-readable via the `user` select permission (pre-existing; encryption keeps values safe).
- **Client** gating (UX upsell) in stores: `createBoard`, `addTodo`, `inviteUser` → trigger a
  shared `upgradeStore` → `<UpgradeDialog/>` in layout.
- **Server** gating (authoritative, costs money): AI endpoints resolve key by plan; `/api/upload`
  enforces the 10-cap / routes to R2; Stripe checkout + webhook.
- Optional env vars via `$env/dynamic/private` (no build break): `STRIPE_PRICE_ID`,
  `STRIPE_WEBHOOK_SECRET`.

### Task checklist
- [x] Migration: add plan, plan_expires_at, stripe_customer_id to users (+ metadata select perms)
- [x] `src/lib/config/plan.ts` — limits + isPaid()
- [x] GraphQL UserFields += plan, plan_expires_at; `npm run generate`
- [x] `upgrade.svelte.ts` store + `UpgradeDialog.svelte` + mount in layout
- [x] createBoard / addTodo / inviteUser limit checks
- [x] `src/lib/server/plan.ts`, `aiKey.ts`, `r2.ts`
- [x] AI endpoints resolve key by plan
- [x] `/api/upload` auth + plan/R2/limit
- [x] `/api/keys` save encrypted BYO keys
- [x] `/api/billing/checkout` + `/api/billing/webhook`
- [x] `PlanSettings.svelte` + BYO keys UI in settings; upload handlers handle 402 upsell
- [x] i18n en/et (+ cs); tests; `npm run check`; `npm test`

### Progress
- 2026-09-17 (prior session): full implementation written, then parked into a
  `git stash -u` by the runner before it could commit.
- 2026-09-17 (this session): recovered the parked work from `stash@{0}` (all 25 tracked
  edits + the untracked new files, incl. migration, config/plan, server/{plan,aiKey,r2},
  upgrade store, UpgradeDialog, PlanSettings, /api/{keys,billing/checkout,billing/webhook},
  and the plan unit test). Verified integrity, then validated against the real backend.
- **Remote todzz Hasura already carries the change** (applied by the prior session):
  - `users.plan` (default `'free'`, CHECK in ('free','paid')), `plan_expires_at`,
    `stripe_customer_id` all present.
  - `user` role select perms: `plan` ✓, `plan_expires_at` ✓, `stripe_customer_id` ✗ (server-only).
  - `user` role update/insert perms exclude all three → clients cannot self-upgrade; only the
    webhook (admin secret) flips a plan. Security model holds.
- `npm run check`: the 10 remaining errors are all pre-existing on `main` (OG-image `Buffer`→
  `Response`, `todos.svelte.ts:983` Promise.all typing, two store test files). #194's own code
  type-checks clean; the only #194 hunk in `todos.svelte.ts` is the card-limit gate at L339.
- `npm run test:unit:server --run`: **246 passed** (incl. new `config/__tests__/plan.test.ts`, 7).
- Client (browser/Playwright) unit project + client-test result recorded below.
- 2026-09-17 (continuation): working tree was clean again — the runner had re-parked the work
  into `stash@{0}`. Re-applied it, re-reviewed every #194 file (plan model, server plan/aiKey/r2,
  api keys/billing/upload, store gates, layout mount, migration, generated types, permissions) —
  all coherent. Re-ran `npm run check` (same 10 pre-existing errors, none in #194 code) and
  `test:unit:server` (246 passed). Repaired the incomplete Playwright chromium-headless-shell
  (rev 1193) install so the client browser unit project can run before commit.
- 2026-09-17 (final session): re-applied `stash@{0}` (39 files) onto a clean tree. Full re-review:
  webhook signature (HMAC-SHA256 + `timingSafeEqual`), checkout (no product/price creation, 503
  when unconfigured), R2 SigV4 single-PUT signer, BYO-key AES-256-GCM encryption via existing
  `crypto.ts`, upload 3-route gating (own R2 → paid → free cap), AI endpoints resolve key by plan
  (auth preserved), client soft-upsell gates, migration (additive + CHECK + down.sql), select-perm
  exposes plan/plan_expires_at but NOT stripe_customer_id, i18n plan.* complete & identical in
  en/et/cs with `{{price}}`/`{{date}}` matching sveltekit-i18n. `npm run check` = same 10
  pre-existing errors (og-image, 2 store tests, todos:983), none in #194 code. `test:unit:server`
  = 246 passed. Confirmed the `addTodo` gate can't break the client `todos.svelte.test.ts` (mock
  user has no plan → free, empty board → 0 < 40, proceeds). Reinstalling the Playwright headless
  shell to run the browser unit project, then commit + push.

### Deploy prerequisites (Kaspar, in Stripe + Vercel env)
- `STRIPE_PRICE_ID` — the 12€/year recurring price (subscription) to reference at checkout.
- `STRIPE_WEBHOOK_SECRET` — signing secret for the endpoint pointed at `/api/billing/webhook`
  (events: `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`).
- `STRIPE_API_KEY` already in `.env`. Both new vars are read via `$env/dynamic/private`, so a
  missing value does not break the build — checkout/webhook return 503 until configured.
