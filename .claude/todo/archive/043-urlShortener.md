In route [lang] check the url that is not known language prefix if it is a known url shortener and then let users create URL shorteners. 

In the top right there is profile pic, settings geat and logout icon. Instead add hamburger menu and open dropdown when clicked. Side drawer on mobile. Under that add: Shortener, Splitwise, Settings, Logout.

URL shortener everybody can see own URLs, delete them and add new. URLs will become todzz.eu/a or todzz.eu/sdlkfgjlsakfjmamfma.s

Plan all the steps below in this file.

---

# Plan — URL Shortener + Hamburger Menu + Global Splitwise

## Context

Three connected changes:

1. **URL shortener** — users create short links at `todzz.eu/<alias>` that redirect to any target URL. Each user sees/manages only their own shortcuts (create, list, delete). Anyone (unauthenticated too) can follow a short URL.
2. **Root-level redirect handling** — because the `[lang]` route accepts any first segment, `todzz.eu/a` currently matches `params.lang='a'`. The layout must detect non-language single-segment paths, look up the alias, and redirect before falling through to auth/login or the default locale page.
3. **Header hamburger menu** — replace the three top-right icons (profile avatar, settings gear, logout) in `UserMenu.svelte` with a single hamburger trigger. Desktop: `DropdownMenu`. Mobile: right-side slide-in sheet. Menu items: **Shortener, Splitwise, Settings, Logout**. Splitwise becomes a new global aggregation page at `/[lang]/splitwise`.

Known language prefixes are `en`, `cs`, `et` (from `src/lib/i18n/languages.ts`). BoardSwitcher and the notification bell stay as-is.

---

## Files to modify / create

### Database & Hasura metadata
- **New migration** `hasura/migrations/default/<timestamp>_create_table_public_url_shortcuts/up.sql` and `down.sql` — creates `url_shortcuts` table (`id`, `user_id`, `alias` UNIQUE, `target_url`, `visit_count`, `created_at`, `updated_at`).
- **New metadata** `hasura/metadata/databases/default/tables/public_url_shortcuts.yaml` — permissions: `user` role full CRUD scoped to `user_id = X-Hasura-User-Id`; `public` role select on `[alias, target_url]` with no filter (for anonymous redirect).
- **Update** `hasura/metadata/databases/default/tables/tables.yaml` — register the new table.

### GraphQL
- **Edit** `src/lib/graphql/documents.ts` — add: `GET_URL_SHORTCUTS` (user-scoped list), `CREATE_URL_SHORTCUT`, `UPDATE_URL_SHORTCUT`, `DELETE_URL_SHORTCUT`, `GET_URL_SHORTCUT_BY_ALIAS` (public lookup, alias filter), `GET_ALL_USER_EXPENSES` (for global splitwise).
- Run `npm run generate` after edits.

### Store
- **New** `src/lib/stores/urlShortcuts.svelte.ts` — factory pattern (mirror `src/lib/stores/labels.svelte.ts`). State `{ items, loading, error }`; methods `loadShortcuts`, `createShortcut`, `updateShortcut`, `deleteShortcut`; browser guard, optimistic update with rollback, returns `{ success, message }`.
- **New util** `src/lib/utils/shortcutAlias.ts` — `generateRandomAlias()` (8-char `[a-z0-9]`) and `RESERVED_ALIASES` set: `['en','cs','et','api','signin','signout','logout','extension-auth','terms','dggc','penon','podcasts','invoices','shortener','splitwise','logs','settings','stats','mail']`. `validateAlias(alias)` returns `{ ok: boolean, error?: string }` — rejects reserved, empty, or chars outside `[A-Za-z0-9._-]`.

### Routing — shortcut redirect
- **Edit** `src/routes/[lang]/+layout.server.ts` — at the TOP (before auth redirect):
  - Build `pathSegments = url.pathname.split('/').filter(Boolean)`.
  - If `pathSegments.length === 1` AND `params.lang` not in `['en','cs','et']`, query `GET_URL_SHORTCUT_BY_ALIAS`.
  - If a row exists with matching alias, `throw redirect(302, target_url)` (add `http://` prefix if the stored URL lacks a scheme).
  - Otherwise continue with existing auth + `getTopBoardPath` logic unchanged.
- **Verify** `src/lib/graphql/client.ts` accepts unauthenticated requests. If it always requires a token, add a lightweight helper `publicRequest()` that calls Hasura without the `Authorization` header so `public` role permissions apply.

### Shortener management page
- **New** `src/routes/[lang]/shortener/+page.svelte` — form (alias input, optional; target URL input, required; create button) plus list of user's shortcuts showing alias (as clickable full URL `todzz.eu/<alias>`), target, created_at, visit_count, delete button. Uses `urlShortcutsStore`, `$t('shortener.*')`, `displayMessage()`, `ConfirmDialog` for deletes. Dark-mode and mobile-responsive Tailwind. Auto-generate alias when left blank (client-side preview) then validate via `validateAlias`.
- **New** `src/routes/[lang]/shortener/+page.server.ts` — guards auth (redirect to `/signin` if no session), preloads `data.shortcuts` via server-side `request()` with session token.

### Global Splitwise page
- **New** `src/routes/[lang]/splitwise/+page.svelte` — aggregates expenses across all boards the user has access to (owned + member). Shows list grouped by board, with totals per user (who owes whom) similar to existing `src/routes/[lang]/[username]/[board]/expenses/+page.svelte`.
- **New** `src/routes/[lang]/splitwise/+page.server.ts` — auth-guarded, loads all expenses via `GET_ALL_USER_EXPENSES` (no `board_id` filter — Hasura row permissions on `expenses` already scope to accessible boards).
- **Reuse** components/logic from `src/lib/components/expenses/` and `src/lib/stores/expenses.svelte.ts` — do not duplicate. Add a second method `loadAllExpenses()` if the existing store is board-scoped.

### Hamburger menu UI
- **Edit** `src/lib/components/auth/UserMenu.svelte` — remove the three separate buttons. Replace with:
  - Single trigger: `Menu` icon from `lucide-svelte` inside a `Button variant="ghost" size="sm"`.
  - Desktop (`md:`+): use `DropdownMenu` from `$lib/components/ui/dropdown-menu` with 4 items (Shortener → `/[lang]/shortener`, Splitwise → `/[lang]/splitwise`, Settings → `/[lang]/settings`, Logout → `handleLogout`). Each item shows an icon + label. Include a header showing the user's avatar + name + email.
  - Mobile: conditionally render a right-side sheet instead (use `md:hidden` + `hidden md:block` tailwind to switch).
  - `handleLogout` and `clearAllStorage` logic preserved from existing component.
- **New** `src/lib/components/ui/sheet/Sheet.svelte` (+ `index.ts`) — thin wrapper over `bits-ui` `Dialog` with right-side slide-in animation and `w-80` width. Follow the structure of `src/lib/components/ui/dialog/`.
- **Keep** `BoardSwitcher` and `UnifiedNotificationBell` untouched in `src/routes/[lang]/+layout.svelte`.

### i18n
- **Edit** `src/lib/locales/en.json` and `src/lib/locales/et.json` — add `menu.*` (shortener, splitwise, settings, logout), `shortener.*` (title, createButton, aliasLabel, targetLabel, randomizeButton, deleteConfirm, emptyState, visits, reservedError, invalidCharsError, aliasTakenError), and `splitwise.*` (title, emptyState, allBoards). If `cs.json` exists, add there too.

---

## Key reused utilities / patterns

- Factory store pattern: `src/lib/stores/labels.svelte.ts` (reference).
- GraphQL request client: `src/lib/graphql/client.ts` — `request(OPERATION, variables)`.
- Permission YAML shape with user-scoped filter: `hasura/metadata/databases/default/tables/public_labels.yaml`.
- Session retrieval server-side: `locals.auth()` as in existing `src/routes/[lang]/+layout.server.ts`.
- `displayMessage(msg, ms?, success?)` from `$lib/stores/errorSuccess.svelte` for user feedback.
- `loggingStore.info|warn|error('Component', 'msg', {data})` — pattern seen throughout.
- `ConfirmDialog` from `src/lib/components/ui/ConfirmDialog.svelte` for destructive actions.
- `getUserInitials()` from `src/lib/utils/getUserInitials.ts` — reuse in the menu header.

---

## Verification (end-to-end)

1. `docker-compose up -d` and from `hasura/`: `hasura migrate apply --all-databases && hasura metadata apply` — confirm migration applies cleanly and table is visible in Hasura console.
2. `npm run generate` — confirm new types appear in `src/lib/graphql/generated/graphql.ts`.
3. `npm run check` — must pass.
4. `npm test` — must pass (add at least: store unit tests for create/delete with mocked `request`; util tests for `validateAlias` reserved words + generator output shape).
5. `npm run dev` and in browser:
   - Sign in. Header shows hamburger (no separate gear/logout icons). Click → dropdown with 4 items. Each item navigates correctly.
   - Resize to mobile viewport — hamburger opens a right-side drawer instead of dropdown.
   - Navigate to `/en/shortener`. Create a shortcut with alias `mytest` → target `https://example.com`. List shows it.
   - In a new incognito window open `http://localhost:5173/mytest` — redirects to `https://example.com` without signin.
   - Try alias `en` or `api` — shows reserved-word error.
   - Try alias `mytest` again — shows duplicate / alias-taken error (Hasura unique constraint surfaces).
   - Delete the shortcut, confirm list updates optimistically.
   - `/en/splitwise` — shows aggregated expenses across all the user's boards.
   - Visit `/en` logged in — still redirects to top board (existing behavior unchanged).
6. Confirm dark-mode and i18n (switch locale in settings → shortener + splitwise strings translate).

---

## Out of scope

- Visit-count incrementing (column exists, but no atomic update on redirect wired up yet — can land in a follow-up).
- Custom domains for shortcuts.
- QR-code rendering for shortcuts.
- Bulk import / export of shortcuts.

---

## Implementation status (run `npm run generate` once migration is applied)

All code is in place. Type check still reports 8 errors in `src/lib/graphql/documents.ts` for the new `url_shortcuts` operations because the live Hasura schema doesn't include the new table yet. Steps to clear them:

1. Start Docker Desktop.
2. From `hasura/`: `hasura migrate apply --all-databases && hasura metadata apply` to apply the new migration locally.
3. Either temporarily set `PUBLIC_API_ENV=development` in `.env` (so codegen introspects the local schema) or apply the migration to the production Hasura, then run `npm run generate`.
4. Optionally swap the inline `UrlShortcut` interface in `src/lib/stores/urlShortcuts.svelte.ts` for the auto-generated `UrlShortcutFieldsFragment`.

The 9 remaining pre-existing errors (og-image `Buffer` types, todo test fragment mismatches) are unrelated to this task.

Public alias lookup uses the `anonymous` Hasura role (matches `HASURA_GRAPHQL_UNAUTHORIZED_ROLE`). New helper: `publicRequest()` in `src/lib/graphql/client.ts`.

Files added:
- `hasura/migrations/default/1776619794782_create_table_public_url_shortcuts/{up,down}.sql`
- `hasura/metadata/databases/default/tables/public_url_shortcuts.yaml` (registered in `tables.yaml`)
- `src/lib/utils/shortcutAlias.ts` + tests
- `src/lib/stores/urlShortcuts.svelte.ts` + tests
- `src/lib/components/ui/sheet/{sheet-content.svelte,index.ts}`
- `src/routes/[lang]/shortener/{+page.svelte,+page.server.ts}`
- `src/routes/[lang]/splitwise/{+page.svelte,+page.server.ts}`

Files modified:
- `src/lib/graphql/{client.ts,documents.ts}` — `publicRequest`, 5 new shortcut ops, `GET_ALL_USER_EXPENSES`
- `src/routes/[lang]/+layout.server.ts` — alias redirect before auth guard
- `src/lib/components/auth/UserMenu.svelte` — hamburger + sheet
- `src/lib/stores/expenses.svelte.ts` — `loadAllExpenses()`
- `src/lib/locales/{en,et,cs}/common.json` — `menu.*`, `shortener.*`, `splitwise.*`

---

## Decisions (from clarification)

- **Splitwise link** → new global `/[lang]/splitwise` page that aggregates across all accessible boards.
- **Unauthenticated redirect** → yes, public Hasura permission on `(alias, target_url)` so anyone can follow a short link.
- **Alias rules** → user-provided OR auto-random, with reserved-word blocklist (languages + top-level routes).
