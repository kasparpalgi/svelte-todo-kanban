> Run with: Sonnet 5.5 / medium

# Lighter cold start for `/api/data/[op]`

## Original Requirement

[NEVER REMOVE]

Follow-up from #236. Owner: "remember, we want to stay on free. Be always clever and
lightweight and simple."

#236 brought the board page under Workers Free's 10 ms CPU when warm. Its live check also
showed that the browser's data calls (`/api/data/getBoards`, `getLists`, `getMe`,
`getClients`, `getNotifications`, `updateTodo` …) cost **110–140 ms of CPU on the first
request in a fresh isolate** (warm they are 3–10 ms). The route imports every op at once
(`src/lib/server/ops/index.ts`), so a fresh isolate evaluates zod, drizzle, the D1 ops and
all their schemas before answering. A board load makes ~8 of these calls, and a new
isolate is common at low traffic, so these are the requests most likely to see error 1102.

1. Measure per op, cold and warm, from the Workers observability events (`cpuTimeMs` per
   request; #236's Results show the query). A local `wrangler dev` CPU profile through the
   inspector (`--inspector-port`) shows which modules a cold request evaluates.
2. Load each op's module only when it is called (a map of `() => import(...)`), so a call
   evaluates its own op and not all of them. Check that zod's locales are not pulled in.
3. Keep behaviour and the op contract tests unchanged.

**Done when (deploy + live check):** deployed to the Worker; the first `getBoards` in a
fresh isolate costs under 40 ms of CPU and warm ops stay under 10 ms, with numbers in the
Results; the e2e suite passes against the Worker URL.

## Results

**Summary** — `/api/data/[op]` now loads only the called op's module. New `ops/loaders.ts` maps every op name (81, enforced by `satisfies Record<OpName, …>`) to `() => import(...)`; the route and `runOp` use it, and `d1/index.ts` became lazy `d1Loaders`. The eager `ops/index.ts` registry stays for types and the contract tests, so behaviour and tests are unchanged. The route imports `index` as a type only.

**Files changed** — created `src/lib/server/ops/loaders.ts`; modified `src/routes/api/data/[op]/+server.ts`, `src/lib/server/ops/run.ts`, `src/lib/server/ops/d1/index.ts`.

**Verification** — `npm run check`: 0 errors. `npm test`: 611 passed, 5 skipped. NOT done: deploy, cold/warm CPU measurement (target: first `getBoards` < 40 ms, warm < 10 ms), the check that zod locales stay out of the bundle, and e2e against the Worker URL. No Cloudflare credentials in this run.

**Deviations** — None in code; live check left to a person.

**Needed from a human** — deploy the Worker (`npx wrangler deploy`, with CLOUDFLARE_API_TOKEN/ACCOUNT_ID), read `cpuTimeMs` for the first `getBoards` in a fresh isolate and for warm ops from Workers observability (query in #236 Results), then run `E2E_BASE_URL=https://todzz.svelte-todo-kanban.workers.dev npx playwright test`. If cold is still over 40 ms, profile with `wrangler dev --inspector-port`.
