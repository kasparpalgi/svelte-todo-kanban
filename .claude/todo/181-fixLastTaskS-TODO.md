# Fix last task's attention

## Original Requirement

[NEVER REMOVE]

The cache-less redeploy unblocked it, but the underlying
  @vite-pwa/sveltekit + Vite 7 build-order fragility remains —
  a future cache state could reintroduce the "only SSR
  builds" failure and silently freeze prod again. I did not
  change any build config (couldn't validate a fix against the
  cloud-only failure, and didn't want to risk your prod). If
  you want, I can harden it as a follow-up — pin
  @sveltejs/adapter-vercel explicitly (Vercel recommends it
  over adapter-auto) and/or bump @vite-pwa/sveltekit — on a
  branch so it's validated before it touches production.

_From Kanban card `ba6df91f-9786-4ec6-8079-fc134c971a56`._

_GitHub issue #181 — end the commit subject with `(#181)`._

---

## Planning / Log

- Current state: `svelte.config.js` uses `@sveltejs/adapter-auto` (^7.0.0), not `@sveltejs/adapter-vercel`.
  `@vite-pwa/sveltekit` is pinned `^1.0.0` (currently resolves to 1.1.0 available on npm), Vite is `^7.0.4`.
- **Found prior history that changes the risk picture**: this repo already tried `@sveltejs/adapter-vercel`
  once and reverted it same-day:
  - `f297036` "fix: Vercel adapter" → `cbe7685` "chore: adapter vercel instead auto" (switched TO vercel)
  - `b6219ae` "fix: switch from adapter vercel to auto" (switched BACK to auto, same day, 2025-11-17)
  No commit body explains the failure mode for either switch. This means re-pinning `adapter-vercel` now
  is not a clean "recommended hardening" — it's redoing something that was already tried and reverted in
  this exact codebase, for reasons not recorded.
- Given CLAUDE.md's guidance to check with the user before hard-to-reverse/shared-system changes, and that
  this is a prod build-config change with an unexplained prior revert, asking the user how to proceed before
  touching `svelte.config.js` rather than guessing.
