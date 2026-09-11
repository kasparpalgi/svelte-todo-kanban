> Run with: Opus 4.8 / high

# Customiseable themes

## Original Requirement

[NEVER REMOVE]

Each board shall have nice customisation. Icon in board selection, color and/or board background. Think like Trello is but tastier.

_From Kanban card `398afdce-5406-4c72-b224-bde1bac7f847`, moved to the agent list._

_GitHub issue #46 — end the commit subject with `(#46)`._

## Analysis

Boards already have a `settings` jsonb column (`BoardFieldsFragment.settings: any`) used
for `agent_list_id`, `enable_hour_tracking`, `enable_model_effort`. Board customization
(icon / color / background) fits there — **no DB migration, no GraphQL/codegen change**.
`listsStore.updateBoard(id, { settings })` already exists and does optimistic updates.

Customization surfaces in three places:
1. **Board selection** — `BoardSwitcher.svelte` (top button) + `BoardSwitcherModal.svelte`
   (grid cards): show the board icon + accent color.
2. **Board main view** — `[board]/+page.svelte`: apply the chosen background to the board
   container and show icon + accent color in the header.
3. **Board management** — `BoardManagement.svelte`: a "Customize" dropdown entry opening a
   new customizer dialog.

Affected files:
- NEW `src/lib/constants/boardCustomization.ts` — presets (icons, accent colors, backgrounds)
  + `BoardCustomization` type + pure `getBoardCustomization(board)` resolver.
- NEW `src/lib/components/listBoard/BoardCustomizer.svelte` — the picker dialog.
- `src/lib/components/listBoard/BoardManagement.svelte` — wire dropdown + dialog.
- `src/lib/components/listBoard/BoardSwitcher.svelte` — icon on the switcher button.
- `src/lib/components/listBoard/BoardSwitcherModal.svelte` — icon + accent on cards.
- `src/routes/[lang]/[username]/[board]/+page.svelte` — background + header icon.
- `src/lib/locales/{en,et,cs}/common.json` — new `board.*` i18n keys.
- NEW `src/lib/constants/__tests__/boardCustomization.test.ts` — unit tests for resolver.

## Implementation Plan
1. `boardCustomization.ts`: define `ICON_PRESETS` (emoji), `COLOR_PRESETS` (accent hex +
   name key), `BACKGROUND_PRESETS` (id + light/dark CSS). Resolver reads `board.settings`
   defensively (settings may be null / string / object) and returns
   `{ icon, color, backgroundId, backgroundStyle }` with safe defaults.
2. `BoardCustomizer.svelte`: dialog with emoji grid, color swatches, background swatches +
   "None"; live preview; Save calls `updateBoard(id, { settings: { ...existing, icon, color, background } })`.
3. Wire into BoardManagement dropdown ("Customize board").
4. Render icon/accent in BoardSwitcher + BoardSwitcherModal; background + icon on board page.
5. i18n keys in all 3 locales.
6. Unit tests for resolver; `npm run check` + `npm test`.

## Changes
- **NEW** `src/lib/constants/boardCustomization.ts` — `ICON_PRESETS` (20 emoji),
  `COLOR_PRESETS` (10 accent hexes), `BACKGROUND_PRESETS` (7 translucent gradient tints
  incl. `none`), and the pure `getBoardCustomization(board)` resolver. Reads `settings`
  defensively (null / JSON string / object), validates values against presets, returns
  `{ icon, color, backgroundId, backgroundStyle }`.
- **NEW** `src/lib/components/listBoard/BoardCustomizer.svelte` — picker dialog with live
  preview, emoji grid, color swatches, background swatches. Saves by merging into existing
  `settings` (unrelated keys preserved) via `listsStore.updateBoard`.
- `src/lib/types/listBoard.ts` — added `CustomizeProps`.
- `BoardManagement.svelte` — "Customize board" dropdown entry + dialog wiring; icon/accent
  shown next to owned board names.
- `BoardSwitcher.svelte` — selected board's icon replaces the Layers glyph; name tinted.
- `BoardSwitcherModal.svelte` — icon + accent (left border) / background tint on cards.
- `[board]/+page.svelte` — background tint on the board container; icon + accent in header.
- `src/lib/locales/{en,et,cs}/common.json` — 27 new `board.*` keys (customize labels,
  color names, background names) in all three locales.
- **NEW** `src/lib/constants/__tests__/boardCustomization.test.ts` — 10 resolver unit tests.

Design note: chose translucent gradient overlays for backgrounds so text/cards stay
readable in both light and dark mode without per-theme values. No DB migration or GraphQL
codegen — the `settings` jsonb column already exists and is `any`-typed.

## Verification
- [ ] Playwright/browser MCP: **skipped** — Chrome extension not connected and Playwright
  Chromium not installed in this environment. Verified via type-check + unit tests instead.
- [x] `npm run check`: 10 errors / 6 warnings — identical to the clean baseline (confirmed
  via `git stash`); **zero introduced** by this task. All pre-existing errors are in
  unrelated files (og-image servers, todos store, todo test fixtures).
- [x] `npm test` (server project): **211 passed**, including 10 new resolver tests. The
  `client` browser project can't launch locally (no Chromium) — unrelated to this change.

## Results
- What works: per-board icon, accent color, and background, editable from Board management,
  reflected in the board switcher button, switcher modal cards, and the board page header +
  container. Persisted in `board.settings`, merged non-destructively, optimistic via store.
- Known issues: none from this change. Pre-existing repo-wide type errors remain untouched.

## Follow-up fix (mobile white stripes) — 2026-09-11
User reported: with a board background set, white stripes appeared on the left/right
below the main menu on mobile. Cause: the parent `<main class="w-full px-4">` adds 16px
side padding, so the board container's background only filled inside that padding.
Fix in `[board]/+page.svelte`: board container is now `relative -mx-4 min-h-screen px-4`
(`-mx-4` cancels main's `px-4` so the background is full-bleed; `px-4` restores a
consistent gutter); the header block dropped its own `px-4` (→ `py-6`) to avoid a doubled
gutter.

## Browser verification (mobile, 390px) — 2026-09-11
Installed Playwright Chromium (build 1228, arm64) and logged in via the Test Login
provider. NOTE: this env's app points at a shared/production Hasura, so no board data was
created (an initial create attempt failed on a FK check — nothing written; all further
write attempts avoided). Verified the layout fix DB-free by injecting the exact shipped
container markup into the real authenticated page's `<main>` (real compiled Tailwind) and
measuring:
- main padding 16px L/R; container left=0, right=390, width=390 = full viewport → **no
  side stripes**, background fills edge-to-edge.
- header content still at 16px from the edge → **gutter preserved**.
Screenshot captured confirming the tinted section spans edge-to-edge on mobile.

## Log
- Explored board store/components/route; confirmed `settings` jsonb is the right home.
- Implemented constants module, customizer dialog, and wired all three display surfaces + i18n.
- Added unit tests (10, all green). `npm run check` clean vs baseline; server tests 211 green.
- Follow-up: fixed mobile white-stripe bug (full-bleed container) and verified in Chromium
  on a 390px mobile viewport (screenshot). Did not write to the shared/production DB.
