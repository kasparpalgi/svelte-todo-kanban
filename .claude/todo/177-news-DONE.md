# News

## Original Requirement

[NEVER REMOVE]

Make it possible from .env ADMIN users to send push to all users notification with a news. Makes sound nad appears in the phone and in app. In app can click and see it + all previous.

_From Kanban card `cdde76ee-152a-456b-a451-9cdaf36f7d61`._

_GitHub issue #177 — end the commit subject with `(#177)`._

## Planning / Log

Requirement calls for real OS-level push ("appears in the phone"), so this needs
actual Web Push (VAPID), not just foreground `Notification()` while a tab is open.
A prior task (#134) explored this fork and stalled without building anything —
confirmed via `.claude/todo/134-pushNotifications.log`: no `web-push` dep, no
`push_subscriptions` table, no custom service worker exists yet in this repo.

Plan:
1. `ADMIN_EMAILS` env var (comma-separated) — server-side only, checked against
   the session user's email to gate the "post news" action.
2. DB: `push_subscriptions` table (user_id, endpoint unique, p256dh, auth) +
   Hasura permissions (user manages own rows).
3. Reuse the existing `notifications` table for the in-app "news" feed: new
   `type = 'news'` notification row per user when admin posts news. Bell/panel
   already renders notifications list — filter a News view off `type='news'`
   ("click and see it + all previous").
4. `web-push` npm package + generated VAPID keypair (`VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`; public key exposed to client via
   `PUBLIC_VAPID_PUBLIC_KEY`).
5. Switch `@vite-pwa/sveltekit` from generateSW to `injectManifest` with a
   custom `src/service-worker.ts` that precaches (workbox) **and** handles
   `push` (show system notification — sound is OS-default) + `notificationclick`
   (focus/open app, navigate to news).
6. Client: Settings toggle to request permission + `pushManager.subscribe`,
   POST to `/api/push/subscribe`.
7. `/api/admin/news` POST endpoint: verify admin email, insert notification
   rows for every user (admin-secret GraphQL), then `web-push.sendNotification`
   to every stored subscription, pruning dead (404/410) subscriptions.
8. Admin-only "Post news" UI (visible only when server confirms `isAdmin`).

Proceeding with implementation.

### Progress
- [x] `web-push` + `@types/web-push` installed.
- [x] VAPID keypair generated; `ADMIN_EMAILS`/`VAPID_*`/`PUBLIC_VAPID_PUBLIC_KEY` added to
      `.env` (real values, local) and `.env.example` (placeholders).
- [x] Migration `1797000000000_create_news_and_push_subscriptions`: `news` table,
      `push_subscriptions` table, `notifications.todo_id` now nullable,
      `notifications.related_news_id` FK, `type` check widened to include `'news'`.
      Applied via `hasura migrate apply` + `hasura metadata apply` (both green).
- [x] Hasura metadata: `public_news.yaml` (no `user`-role perms — server writes via
      admin secret only), `public_push_subscriptions.yaml` (`user` role owns its own
      rows), `public_notifications.yaml` updated with `news` relationship + column.
- [x] GraphQL documents: `CREATE_PUSH_SUBSCRIPTION` (upsert on `endpoint`),
      `DELETE_PUSH_SUBSCRIPTION`; `NOTIFICATION_FRAGMENT` extended with
      `news { id title body url }`. No dedicated subscribe/unsubscribe API
      routes needed — client calls Hasura directly via `request()` under the
      `user` role (own-row insert/update/select/delete), verified live against
      the dev Hasura instance with a signed test JWT.
- [x] `/api/admin/news` (POST): gates on `isAdminEmail(session.user.email)`,
      writes a `news` row + one `notifications` row per user (admin secret,
      `triggered_by_user_id` intentionally omitted — the self-notify check
      would reject the admin's own row), then `sendPushToAll` fans out real
      Web Push and prunes dead (404/410) subscriptions.
- [x] Service worker: `@vite-pwa/sveltekit` switched to `strategies:
      'injectManifest'`, custom `src/service-worker.ts` (workbox precache +
      `push` → `showNotification` + `notificationclick` → focus/open).
      Confirmed via `npm run build` that the compiled SW contains both
      listeners and precaches correctly.
- [x] Client: `PushNotificationSettings.svelte` (permission + subscribe toggle)
      and `AdminNewsPanel.svelte` (title/body/url form, POSTs to
      `/api/admin/news`) added to `/[lang]/settings`, gated by
      `isAdmin` from `[lang]/+layout.server.ts`. Bell (`UnifiedNotificationBell`)
      renders `type: 'news'` with a 📢 icon and opens a dialog with the full
      news body + link on click (existing history/pagination already covers
      "all previous" since it lists every past notification, read or not).
- [x] i18n: `settings.push.*` and `settings.news.*` added to en/cs/et.
- [x] `npm run check` clean (0 new errors — pre-existing unrelated og-image
      Buffer-type errors and a11y warnings only).
- [x] Verified live in-browser (Playwright): settings page renders the push
      toggle; admin panel correctly hidden for a non-admin test user.
      Verified live against Hasura with a signed JWT for the `user` role:
      push_subscriptions upsert/select/delete, and the news→notifications
      join query the bell actually runs — all pass; test rows cleaned up.

### Follow-ups intentionally left out of scope
- No UI to browse *all* news in one place beyond the notification bell's
  history (bell already lists every past notification up to its existing
  pagination limit, filterable by the 📢 icon).
- Real push delivery to a physical device wasn't tested (no reachable device);
  verified instead via the full chain: SW compiles with push handlers, DB
  round-trip works, and `web-push` is wired with real VAPID keys.


