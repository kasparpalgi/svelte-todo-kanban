When I open a card in a board or the board then after around 10sec I will see in the browser's console:

POST https://filtering.adblock360.com/ab/set-current-domain net::ERR_CONNECTION_TIMED_OUT
(anonymous) @ VM449 personal:17
...
D2M74xE9.js:1 [ErrorBoundary] Unhandled promise rejection {reason: 'TypeError: Failed to fetch', ...}
...

In the screen I see:

Something went wrong
The application encountered an unexpected error

Error Message:

Failed to fetch

Technical Details
TypeError: Failed to fetch
    at https://www.todzz.eu/et/kaspar/personal?card=aias:20:3585
    ...

Wird is that this happens only in Vercel live app but in localhost dev server works all well.

---

## Analysis

**Root cause**: `ErrorBoundary.svelte` listened for ALL `unhandledrejection` events globally and showed a full-screen error for ANY unhandled promise rejection — including transient network errors (`TypeError: Failed to fetch`).

In production (Vercel), network requests to the Hasura GraphQL endpoint or `/api/auth/token` can fail or time out (~10 sec). This also happens when users have ad blockers (e.g., adblock360) that block requests to certain domains. These create "Failed to fetch" TypeErrors.

The stores already handle these errors gracefully (try/catch, set error state, return `[]`), but the `ErrorBoundary` was intercepting them as `unhandledrejection` events (which can happen from `$effect` blocks calling async functions without `.catch()`) and crashing the entire UI.

**Why only production**: In localhost, requests to `localhost:8080` (Hasura) never time out and aren't blocked by ad blockers.

**Contributing factors**: Several `$effect` blocks called async store functions without `.catch()`, creating potential unhandled rejections if any error escaped the stores' internal try-catch.

## Changes

- `src/lib/components/ErrorBoundary.svelte`: Filter out network errors (`TypeError: Failed to fetch`, `Load failed`, `NetworkError when attempting to fetch resource.`, `Failed to get JWT token`) — these are transient and handled by the stores. Still log them but don't show the full-screen error UI.

- `src/routes/[lang]/[username]/[board]/+page.svelte`: Added `.catch()` to `loadBoardData(boardAlias)` and `invitationsStore.loadMyInvitations()` calls inside `$effect` blocks.

- `src/lib/components/notifications/UnifiedNotificationBell.svelte`: Added `.catch()` to all async calls in `$effect` blocks and `onMount` polling interval.

## Verification

- [x] Type check passed (pre-existing errors only, not from these changes)
- [x] `npm run check` passed with no new errors
