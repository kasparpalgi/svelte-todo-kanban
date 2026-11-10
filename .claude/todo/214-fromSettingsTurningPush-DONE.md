> Run with: Opus 5.5 / xhigh
> Machine: karel

# From settings turning push notifications

## Original Requirement

[NEVER REMOVE]

Gives error: registration fail

_From Kanban card `96c614e6-d7fa-4c3c-a422-9af798e10f6d`, moved to the agent list._

_GitHub issue #214 — end the commit subject with `(#214)`._

## Results

**Summary** — The VAPID setup was fine. The real cause is the user's browser:
"Registration failed - push service error" is what `pushManager.subscribe()` throws in
Chromium forks that ship without Google's push service (Brave by default, Opera, others).
What I checked:
- the production `PUBLIC_VAPID_PUBLIC_KEY` (read from the live page's env) is a valid 65-byte
  P-256 key that matches the private key in `.env`;
- the deployed `service-worker.js` has its `push`/`notificationclick` handlers;
- production already holds 4 working subscriptions (`fcm.googleapis.com`, `jmt17.google.com`,
  `web.push.apple.com`), so Chrome and Safari work.

The app still made this worse in two ways, both now fixed:
1. **The Switch stayed ON after a failed subscribe.** A one-way `checked` prop let bits-ui flip
   it locally, so the toggle looked enabled when nothing was subscribed. It now uses a function
   binding (`bind:checked={() => store.subscribed, handleToggle}`), so it always shows the
   store's real state. A regression test failed on the old code (`aria-checked="true"`).
2. **The error was the raw browser text, and nothing was logged.** A `push service` failure now
   shows a translated hint: in Brave, turn on "Use Google services for push messaging" under
   Settings → Privacy and security; Chrome, Firefox and Safari work out of the box (en/et/cs).
   Subscribe/unsubscribe failures now go to `loggingStore.warn('PushNotifications', …)`, which
   saves them to `/logs` with the user agent, so the next failure names its browser.

For the user: if this was Brave, turn that setting on, reload, then toggle again. Any other
browser that shows the same message has no push service and cannot get push notifications.

**Files changed**
- created `src/lib/components/settings/__tests__/PushNotificationSettings.svelte.test.ts`
- modified `src/lib/components/settings/PushNotificationSettings.svelte`
- modified `src/lib/stores/pushNotifications.svelte.ts`
- modified `src/lib/locales/{en,et,cs}/common.json` (`settings.push.error_no_service`)
- modified `package.json`, `package-lock.json` (0.25.1 → 0.25.2)

**Verification**
- `npm run check` — 0 errors, 0 warnings
- unit/component tests (`npm run test:unit:all -- --run`) — 40 files, 417 tests passed, including
  the 2 new ones
- `svelte-autofixer` on the component — no issues
- Playwright e2e (second half of `npm test`) — 33 failures. That is the same count #212
  (`212-fixStalePlaywrightE2e.md`) records on unmodified main, for the reasons it lists
  (`storageState` path, new sign-in form). No e2e spec covers the settings page. I restored the
  regenerated `playwright-report/`, so none of that run's output is committed.
- Headless repro against production: Chrome gives `AbortError: Registration failed - permission
  denied` because headless has no push support, so it does not reproduce the user's browser.
  Real-device delivery after the fix was not tested.

**Deviations** — None in scope. I could not see which browser the user had, so the hint names
Brave (the common case) and the new `/logs` entry will record the exact browser next time.
