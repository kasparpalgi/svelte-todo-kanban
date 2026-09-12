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
