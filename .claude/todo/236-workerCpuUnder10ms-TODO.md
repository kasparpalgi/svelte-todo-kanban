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
