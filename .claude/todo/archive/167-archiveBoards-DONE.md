# Archive boards

## Original Requirement

[NEVER REMOVE]

Archive boards and be able to see archived boards. Also, restore from there.

Re-think how the boards management works, too. At the moment I click at the top and dropdown opens that is scrollable and at the bottom is "Manage boards" - I'd say it shall be in the top right and the whole board switching shall be wider and open in the mid screen in modal

_From Kanban card `9a0c35a0-6210-40c7-bc20-72ec44558e33`, moved to the agent list._

_GitHub issue #167 — end the commit subject with `(#167)`._

## Plan

1. DB: migration adding nullable `boards.archived_at timestamptz` + index; apply to Hasura (`hasura migrate apply` + `hasura metadata apply`, per this repo's documented workflow in root `CLAUDE.md`).
2. Hasura metadata: expose `archived_at` in `boards` select/update permitted columns for role `user`.
3. GraphQL: add `archived_at` to `BOARD_FRAGMENT`; `npm run generate`.
4. Store (`listsBoards.svelte.ts`): `loadBoards()` excludes archived; add `archivedBoards`/`sortedArchivedBoards`, `loadArchivedBoards()`, `archiveBoard(id)`, `restoreBoard(id)` — optimistic with rollback.
5. UI: rework `BoardSwitcher.svelte` from a scrollable dropdown into a wide, mid-screen modal (matching `BoardManagement.svelte`'s modal style) with a "Boards" / "Archived Boards" tab toggle and "Manage Boards" + close moved to the top-right of the modal header (not at the bottom of a list).
6. `BoardManagement.svelte`: add "Archive" action per owned board + an "Archived Boards" section with Restore.
7. i18n: add new keys to `en`, `et`, `cs`.
8. Tests for store archive/restore logic.
9. `npm run check` + `npm test`; manual smoke test if possible.

_Note: a prior session attempted this task but its file edits were never committed (working tree was clean at task start) — redoing from scratch._

## Log

- Investigated current state: no archive-related code exists anywhere in the repo (confirmed via grep); starting fresh.
- Discovered the DB column/index (`boards.archived_at`) and Hasura permissions were already applied to production by a prior, uncommitted session attempt (confirmed via `information_schema.columns`/`pg_indexes` query against `https://todzz.admin.servicehost.io`). Recreated the matching migration files locally at version `1794000000000_add_archived_at_to_boards` (the version already recorded as applied in the server's migration tracking table — `hasura migrate apply --version ... --skip-execution` confirmed "Version already applied") so git now tracks what's live, rather than re-running the SQL.
- `hasura metadata export` confirmed the boards table's select/update permissions on the server already include `archived_at`; local `public_boards.yaml` now matches.

## Changes

- `hasura/migrations/default/1794000000000_add_archived_at_to_boards/{up,down}.sql`: nullable `boards.archived_at timestamptz` + `idx_boards_archived_at` index (already live in production; migration files reconstructed to match).
- `hasura/metadata/databases/default/tables/public_boards.yaml`: `archived_at` added to `user` role select/update permitted columns (already live; metadata file synced).
- `src/lib/graphql/documents.ts`: `BOARD_FRAGMENT` now selects `archived_at`; ran `npm run generate`.
- `src/lib/stores/listsBoards.svelte.ts`: `loadBoards()` filters `archived_at: { _is_null: true }`; added `archivedBoards` state + `sortedArchivedBoards`, `loadArchivedBoards()`, `archiveBoard(id)`/`restoreBoard(id)` (optimistic with rollback); `updateBoard`'s allowed-keys type includes `archived_at`.
- `src/lib/components/listBoard/BoardSwitcher.svelte`: rewritten from a scrollable dropdown into a wide (`max-w-3xl`), mid-screen modal with an "Active Boards"/"Archived Boards" tab toggle on the left of the header and "Manage Boards" + close button on the top-right. Archived tab lists archived boards with a Restore action.
- `src/lib/components/listBoard/BoardManagement.svelte`: owned-board dropdown gets an "Archive" action (confirms first, calls `listsStore.archiveBoard`); added an "Archived Boards" card below the main list with a Restore button per board.
- i18n: added `board.switch_board`, `active_boards`, `archived_boards`, `no_archived_boards`, `archive_board`, `archive_board_confirm`, `restore_board`, `board_archived`, `board_restored`, `failed_archive`, `failed_restore` to `en`, `et`, `cs`.
- `src/lib/stores/__tests__/listsBoards-archive.test.ts` (new): covers `loadBoards` excluding archived, `loadArchivedBoards`, `archiveBoard` success + rollback-on-failure, `restoreBoard` success (5 tests).

## Verification

- [x] `npm run check` — clean for all files touched by this task (9 pre-existing errors remain in unrelated files: `og-image`/`og-screenshot` routes and a chart component).
- [x] `npx eslint` on changed files — same error count profile as the pre-change versions (verified via `git stash` diff); no new lint errors introduced. One pre-existing `no-unused-vars` warning on `ListsState` in the store was incidentally fixed.
- [x] `npx vitest run --project=server` — 201/201 tests pass, including the 5 new archive/restore tests.
- [ ] `npm test` (full suite incl. browser-mode "client" project) — blocked by a pre-existing, unrelated local environment issue: Playwright's `chromium_headless_shell` (revision 1193) download repeatedly fails to complete/hangs on this machine (same issue hit in the prior session attempt). Not caused by this change.
- [ ] Manual browser click-through of the new switcher modal — not performed this session; recommend a quick manual check: open the app, click the board-name button, confirm the wide modal opens with tabs on the left and "Manage Boards" + close on the top-right, archive a board from Manage Boards, confirm it appears under the Archived tab, then restore it.

## Results

- DB column + Hasura permissions confirmed live in production (were already applied by a prior session; this session reconciled the local migration/metadata files to match and rebuilt all the application code, which had not been committed).
- Store correctly separates active vs. archived boards with optimistic archive/restore and rollback on failure.
- Board switcher reworked per the original request: wide, mid-screen modal instead of a scrollable dropdown, with "Manage Boards" relocated to the top-right and a dedicated "Archived Boards" tab supporting restore.
- `BoardManagement.svelte` also supports archiving owned boards and restoring from its own "Archived Boards" section.
- Known follow-up: a live manual click-through and the full browser-mode test project remain unverified in this session due to the sandbox's Playwright browser download issue — worth a quick manual smoke test.

## Session 2 (2026-09-11) — closing out

- Re-opened this task expecting to redo the work described above, but `git status` was clean and a grep of the codebase showed the archive feature (store methods, `BoardSwitcherModal.svelte`, `BoardManagement.svelte` archive/restore UI, `archived_at` migration + Hasura permissions, i18n keys in en/et/cs) is **already present on `main`**.
- `git log` confirms it shipped via `502c8af feat(boards): add board archiving with restore and rework switcher UI (#167)`, followed by several polish commits (`5aa0317`, `211520b`, `197a61a`, `9dc8e3c`, `2d922b0`, `bb1707f`, `012d061`, `82f270e` — the last few fixing the switcher's z-index/positioning under GitHub issue #171). So the session-1 work above did get committed after all, just not reflected back into this task log at the time.
- Re-verified rather than re-implementing:
  - `npm run check`: 10 pre-existing errors, none in archive-related files (all in unrelated `og-image`/`og-screenshot` routes, `todos.svelte.ts`, and pre-existing test fixture typing) — same profile as noted in session 1.
  - `npx vitest run --project=server src/lib/stores/__tests__/listsBoards`: `listsBoards-archive.test.ts` — 5/5 passing.
  - i18n keys (`archived_boards`, `no_archived_boards`, etc.) confirmed present in `en/common.json`, `et/common.json`, `cs/common.json`.
  - Attempted a manual browser smoke test via claude-in-chrome against the running dev server (`localhost:5173`, confirmed serving 200 via curl) but the extension couldn't render either `localhost:5173` or `127.0.0.1:5173` (repeated "Frame with ID 0 is showing error page") — an environment/tooling issue unrelated to the app code, not pursued further given the feature is already live and tested.
- No code changes made this session — nothing to commit. Task is functionally complete on `main`.
