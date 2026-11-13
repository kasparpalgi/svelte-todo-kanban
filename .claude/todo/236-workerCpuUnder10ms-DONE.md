> Run with: Opus 5.5 / high

# Fit the board page into Workers Free's 10 ms CPU

## Original Requirement

[NEVER REMOVE]

Follow-up from #226. Owner: "remember, we want to stay on free. Be always clever and
lightweight and simple."

On the Worker (#218), the board page `/en/test/tests-board` took **p50 21.7 ms, p90 27.9 ms
and max 73 ms of CPU** over 20 warm runs. Workers Free allows 10 ms per request. Cloudflare
served every request in #218, but it may stop doing so (error 1102). Workers Paid is not an
option, so the page has to get lighter.

1. Measure first: CPU per route from the Workers GraphQL `workersInvocationsAdaptive`
   (`cpuTime`, µs) using `CLOUDFARE_FULL_ACCESS_API_TOKEN` (memory `cloudflare-worker-deploy`),
   or a local `wrangler dev` CPU profile. Split the board request into Auth.js session
   decode, the Hasura token mint, the GraphQL calls and their JSON, and the Svelte SSR of
   the layout and page.
2. Cut the biggest parts, simplest first. For example: render only the shell on the server
   and let the cards load in the browser (the store already loads them on mount); mint no
   Hasura token during SSR; drop server work whose result the client fetches again anyway.
   Keep the page looking the same while it loads (no layout jump).
3. Check `/[lang]`, `/signin`, `/[lang]/settings` and `/api/auth/token` the same way.

**Done when (deploy + live check):** deployed to the Worker. The board page's p90 is under
10 ms of CPU over 20 warm runs, with numbers in the Results. As the test user on the
Worker URL, the board looks and behaves as before (load, drag, open a card, the poll).

_GitHub issue #236 — end the commit subject with `(#236)`._

_From Kanban card `040af1ec-db75-4d8d-94ce-5c532789ae6f`, moved to the agent list._

## Results

**Summary** — The board page now fits Workers Free's 10 ms. Warm, on the live Worker, it takes
**p50 6 ms, p90 9 ms, max 10 ms** of CPU (25 runs, one kept-alive connection). Before this
change it was p50 7 ms, p90 92 ms over the same kind of run.

How it was measured: the Workers observability API
(`POST /accounts/{id}/workers/observability/telemetry/query`, `CLOUDFARE_FULL_ACCESS_API_TOKEN`)
returns `cpuTimeMs` and the path for each request. The script signed in as the test user,
sent each route 25 times over one kept-alive connection with its own User-Agent marker, and
read back only those events. Breakdowns came from CPU profiles of `wrangler dev` taken through
its inspector port (`--inspector-port`, CDP `Profiler.*`). Local numbers run ~3–5× higher than
on the Worker, so they only gave proportions.

What was found:
- **Warm requests were already near the limit.** #229 had removed the token mint, so the
  22 ms from #218 was down to 4–9 ms. The board still ran a Hasura lookup for OG tags
  (board + role + optional card) that only a link-preview bot can use, and bots never send
  a session cookie. Every request also logged: Auth.js's session callback had a
  `console.log`, and i18n warned once per untranslated key during SSR (about 8 lines per
  board render).
- **The p90 came from fresh isolates.** Wrangler bundles everything into one script and
  evaluates each module the first time a request uses it. At this traffic level a
  request often lands in a fresh isolate, and the board's first render then evaluated
  Tiptap, ProseMirror, markdown-it and date-fns (dialogs that SSR never shows), and, on
  every page, zod + drizzle + the whole ops layer (the root layout's `/` redirect helper).
  Those requests cost 65–170 ms. Startup (global scope) is not counted against the 10 ms,
  but this lazy evaluation is.
- `/api/auth/token` signed with `jsonwebtoken`, which goes through Node's crypto polyfill
  and parses the key on every call.

What changed:
- Board `+page.server.ts`: a signed-in render makes no Hasura call. Bots get the same
  basic OG tags as before. The browser already loads the board and its cards on mount, and
  the SSR HTML is the same shell as before, so nothing moves while the page loads.
- `CardModal`, `NotesView`, `BoardActivityView` (page) and `TodoEditForm` (card) load
  with `browser ? import(...) : null`. The browser starts loading them at once, as before.
  The server never imports them, so the editor dropped out of the Worker bundle:
  1068 → 806 KiB gzip, startup 51 → 33 ms.
- Root and `[lang]` layouts import `topBoardPath` only on the redirect paths that use it.
- `/api/auth/token` signs with `jose` (WebCrypto) instead of `jsonwebtoken`. Same claims,
  header `{"alg":"HS256","typ":"JWT"}`; Hasura accepts the new token (checked live).
- Removed the per-request session `console.log`. i18n now logs errors only.

**Live numbers (Worker, CPU ms, 25 warm runs each on one connection)**

| Route | Before p50 / p90 / max | After p50 / p90 / max |
| --- | --- | --- |
| `/en/test/tests-board` | 7 / 92 / 94 | **6 / 9 / 10** |
| `/en/settings` | 7 / 68 / 139 | 4 / 6 / 8 |
| `/signin` (signed in → redirect) | 6 / 11 / 17 | 6 / 7 / 11 |
| `/api/auth/token` | 6 / 29 / 32 | 4 / 5 / 7 |
| `/en` (→ top board) | 5 / 10 / 12 | 5 / 8 / 40 |

Board raw values, after: `6 6 7 5 9 9 6 9 9 6 7 6 7 8 5 10 5 5 7 8 5 6 5 5 6`. Over 20
requests on separate connections it was p50 7, p90 12, with one fresh isolate at 44 ms
(before: 50–170 ms each, about 1 in 4 requests). A 40-run sample on the previous deploy
gave p50 4, p90 9. Right after a deploy every machine loads the new version, so the first
minute shows many fresh isolates; the table is from after that minute.

**Files changed**
- modified: `src/routes/[lang]/[username]/[board]/+page.server.ts`, `+page.svelte`,
  `src/lib/components/todo/TodoItem.svelte`, `src/routes/+layout.server.ts`,
  `src/routes/[lang]/+layout.server.ts`, `src/routes/api/auth/token/+server.ts`,
  `src/hooks.server.ts`, `src/lib/i18n/index.ts`, `package.json` and `package-lock.json`
  (0.35.0 → 0.35.1; `jose` added, `jsonwebtoken` and `@types/jsonwebtoken` removed)
- created: `.claude/todo/247-dataOpsColdStart.md` (Backlog follow-up)

**Verification**
- Deployed to the Worker (version `42dc50aa`, rebased on main including #240); measured
  as above.
- Live e2e as the test user (`E2E_BASE_URL=https://todzz.svelte-todo-kanban.workers.dev`):
  **32 passed**. That covers loading the board, drag reorder, opening a card (Close, Escape,
  upload area) and lists. An earlier run on the previous deploy had a drag flake and the
  #240 race; both re-runs of drag passed, and #240 is fixed on main.
- The poll and data calls during e2e all returned 200.
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 580 passed, 5 skipped.
- Svelte autofixer on the new lazy-component pattern: no issues.
- Playwright used its own Chromium through a temporary config, because the config asks for
  Google Chrome, which isn't installed here. The temporary config was deleted.

**Deviations**
- Auth.js session decode wasn't replaced. Profiles showed it at well under 1 ms on the
  Worker, so a hand-rolled session reader wasn't worth the risk.
- The board still renders its header on the server, not "only the shell": that HTML
  already has no cards, and dropping it would make the header jump in.
- Not fixed here: zod still loads on a fresh isolate through `TodoItem`'s edit schema, about
  3 ms. The browser's `/api/data/*` calls cost 110–140 ms on a fresh isolate (the whole ops
  layer loads at once), which is outside this task's routes, so it is filed as
  `247-dataOpsColdStart.md`.
