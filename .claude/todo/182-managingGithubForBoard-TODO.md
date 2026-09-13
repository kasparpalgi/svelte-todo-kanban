> Run with: Sonnet 4.6 / medium

# Managing Github for board

## Original Requirement

[NEVER REMOVE]

I see JSON: Hetkel ühendatud:

{"owner":"life-effect","repo":"life-effect-front","full_name":"life-effect/life-effect-front"}

And below when I click enable webhook button then I get: GITHUB_WEBHOOK_SECRET not configured

Instruct the end user how to create and add it or if it is global for all users and they need to set it to environment variables then instruct me.

_From Kanban card `dd3cd1fb-f2e6-4be7-b4ef-4e2299a8c284`._

_GitHub issue #182 — end the commit subject with `(#182)`._

## Analysis

`GITHUB_WEBHOOK_SECRET` is read via `$env/dynamic/private` — it is a **global server-side environment variable**, not per-user. The same secret is used to verify every incoming webhook payload from GitHub (HMAC SHA-256 signature). Each board's webhook is registered with this same secret.

The error is thrown in `src/routes/api/github/register-webhook/+server.ts:64` and `src/routes/api/github/webhook/+server.ts:133`.

## Plan

- [x] Add `GITHUB_WEBHOOK_SECRET` to `.env.example` with generation command and explanation
- [x] Improve API error message to be more actionable
- [x] Show helpful inline "not configured" UI state in `WebhookManager.svelte` instead of raw error toast
- [ ] `npm run check` passes
- [ ] Commit

## Log

- Investigated: global server env var, same for all users/boards
- Implementing: .env.example + better error UX
