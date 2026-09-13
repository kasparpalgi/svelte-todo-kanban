> Run with: Sonnet 4.6 / medium

# Get Vercel CLI working if not working

## Original Requirement

[NEVER REMOVE]

And see the latest deployment failures and if latest all green then that's it, otherwise fix the deployment failure.

_From Kanban card `f611fa0d-c326-4818-8fab-f4d236fdc7c3`._

_GitHub issue #183 — end the commit subject with `(#183)`._

---

## Investigation

**Root cause**: On Linux/Vercel (Node 22), Vite 7 fires the SSR environment's `closeBundle`
hook immediately after the SSR build phase completes — before the client build has run.
The `@vite-pwa/sveltekit` SSR `closeBundle` expects `service-worker.js` to already
exist in `.svelte-kit/output/client/` (placed there by the core `vite-plugin-pwa`'s
CLIENT `closeBundle` via `buildSW`). On macOS/Node 26, all closeBundles fire after all
environments complete, so the ordering works. On Linux, it doesn't.

Error: `[vite-plugin-pwa:sveltekit:build] The 'swSrc' file can't be read. ENOENT: no such file or directory, open '/vercel/path0/.svelte-kit/output/client/service-worker.js'`

This started with the `c93cc15` bump from `@vite-pwa/sveltekit` 1.0.0→1.1.0 (which
brought in `workbox-build` 7.3.0→7.4.1 and triggered a fresh npm install that exposed
the ordering race that was previously hidden by Vercel's build cache).

## Fix

Added `scripts/prebuild-sw.mjs` and a `prebuild` npm script. The script uses esbuild
(bundled with Vite) to compile `src/service-worker.ts` → `.svelte-kit/output/client/service-worker.js`
BEFORE the main Vite build starts. This placeholder file satisfies the SSR `closeBundle`'s
file-existence check. The CLIENT build's own `buildSW` step then overwrites it with the
correctly-manifested version (using fresh client asset hashes).

Files changed:
- `package.json`: added `"prebuild"` script
- `scripts/prebuild-sw.mjs`: new esbuild compilation script

Local clean build verified: `rm -rf .svelte-kit/output && npm run build` ✓ (precache
manifest has 130+ asset entries)
