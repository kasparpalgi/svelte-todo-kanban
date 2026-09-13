> Run with: Haiku 4.5 / medium

# Vercel deployment fails

## Original Requirement

[NEVER REMOVE]

Task #183 already tried to fix it but latest deploy in Vercel:

16:03:13.904

error during build:
16:03:13.904

[vite-plugin-pwa:sveltekit:build] The 'swSrc' file can't be read. ENOENT: no such file or directory, open '/vercel/path0/.svelte-kit/output/client/service-worker.js'
16:03:13.904

    at injectManifest (/vercel/path0/node_modules/workbox-build/build/inject-manifest.js:70:15)
16:03:13.904

    at async Object.handler (file:///vercel/path0/node_modules/@vite-pwa/sveltekit/dist/index.mjs:266:33)
16:03:13.904

    at async PluginDriver.hookParallel (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22768:17)
16:03:13.905

    at async file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:23769:13
16:03:13.905

    at async catchUnfinishedHookActions (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:23218:16)
16:03:13.905

    at async rollupInternal (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:23745:5)
16:03:13.905

    at async buildEnvironment (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:33860:12)
16:03:13.906

    at async Object.build (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:34220:19)
16:03:13.906

    at async Object.buildApp (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-Bm2ujbhY.js:34217:153)
16:03:13.907

    at async CAC.<anonymous> (file:///vercel/path0/node_modules/vite/dist/node/cli.js:641:3)
16:03:14.023

Error: Command "npm run build" exited with 1

---
Remember to use Vercel CLI that is now logged in and installed.

_From Kanban card `25854e2c-730a-4254-97e0-e61600fc28c9`._

_GitHub issue #187 — end the commit subject with `(#187)`._
