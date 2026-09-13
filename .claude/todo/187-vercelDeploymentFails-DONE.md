> Run with: Haiku 4.5 / medium

# Vercel deployment fails

## Original Requirement

[NEVER REMOVE]

Task #183 already tried to fix it but latest deploy in Vercel:

```
[vite-plugin-pwa:sveltekit:build] The 'swSrc' file can't be read. ENOENT: no such file or directory, open '/vercel/path0/.svelte-kit/output/client/service-worker.js'
```

Error occurs in `workbox-build/build/inject-manifest.js` when PWA plugin tries to inject manifest into service worker.

---

## Analysis

1. **Task #183 attempt**: Added `buildSwBeforePwa()` plugin that compiles service worker in SSR's `writeBundle` hook
2. **Current issue**: Plugin still fails because:
   - Service worker is built during SSR's `writeBundle` (late in the build)
   - PWA plugin's `@vite-pwa/sveltekit:build` closeBundle hook (which reads the SW) may fire before SSR writeBundle completes
   - In concurrent Vite 7 builds on Linux (Vercel), timing is unpredictable

3. **Root cause**: Using `writeBundle` hook is too late; need to build SW earlier, before either client/SSR `closeBundle` hooks fire

## Solution

✅ **IMPLEMENTED**: Changed `buildSwBeforePwa` plugin to use `buildStart` hook instead of `writeBundle`:
- `buildStart` fires when Vite initializes the build, before any file operations
- Ensures service worker exists before PWA plugin tries to read it
- Runs in both client and SSR builds (removed SSR-only check)
- Verified: local build succeeds with service-worker.js successfully generated and manifest injected

**Changes**:
- `vite.config.ts`: Moved from `writeBundle` to `buildStart` hook
- Removed `viteConfig` and SSR check since `buildStart` is safe to run for all builds
- Updated comments to explain the new approach

**Testing**:
- ✅ `npm run build` succeeds
- ✅ Service worker is generated before PWA plugin runs
- ✅ PWA manifest injection succeeds

---

_From Kanban card `25854e2c-730a-4254-97e0-e61600fc28c9`._

_GitHub issue #187 — end the commit subject with `(#187)`._

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
