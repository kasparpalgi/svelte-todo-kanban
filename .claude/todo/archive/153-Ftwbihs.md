Many times when I login to the new device I end up first in the "Ftwbihs's board" by user @ftwbihs. When new user registers everybody will end up there in a first place.

Before you start working with checking the backend at /hasura

1. Update /hasura/.env and make sure /hasura/config.yaml is up to date (you can get all info fron /.env and we work with online API endpoint)
2. Make sure the Hasura metadata locally is up to date
3. See if in claude instructions it is instructed how to work with backend with Hasura CLI

---

## Prep (done)

1. **hasura/.env** — updated `HASURA_ADMIN_SECRET` to the real value from root `.env`
   (`3wfMgw3hDOHa0W9UVL06Z28Q`) and `AUTH_SECRET` to match. `config.yaml` already points
   to the online endpoint `https://todzz.admin.servicehost.io` with the correct admin secret — no change needed.
2. **Hasura metadata** — `hasura metadata export` pulled the latest from the online server.
   It was behind (e.g. the new `url_shortcuts` table was missing). `hasura metadata diff` is now empty.
3. **CLAUDE.md / .claude/context.md** — both already document the Hasura CLI workflow
   (`hasura console`, `hasura metadata apply`, `hasura migrate ...`). No doc change required.

## Root cause

New users / fresh devices land on the public **"Ftwbihs's board"** because of two combined facts:

- `boards` `select_permission` for role `user` exposes **all `is_public: true` boards** to every user
  (`hasura/metadata/databases/default/tables/public_boards.yaml`, the `is_public: { _eq: true }` clause).
- `getTopBoardPath()` (`src/lib/utils/getTopBoardPath.ts`) fallback query runs `GET_BOARDS`
  **with no `where` filter**, ordered by `sort_order asc, name asc, limit 1`. With the user's JWT,
  Hasura returns own boards **plus every public board**, so the globally lowest-sorted public board
  (Ftwbihs's) wins. New users (who get no board on signup) have nothing of their own, so they always
  land there; existing users hit it too on a device with no cached `lastBoardAlias`.

Both `/` (`src/routes/+layout.server.ts`) and `/[lang]` (`src/routes/[lang]/+layout.server.ts`)
redirect through `getTopBoardPath`, so a single fix covers both.

## Fix

Scope the `getTopBoardPath` fallback to boards the user **owns**, then **is a member of** — never
arbitrary public boards. A user with no boards returns `null` (no misdirect).

## Changes

- **`src/lib/utils/getTopBoardPath.ts`** — fallback no longer runs an unfiltered `GET_BOARDS`.
  It now queries the user's **own** boards (`where: { user_id: { _eq: userId } }`) first, then
  boards they're a **member** of (`where: { board_members: { user_id: { _eq: userId } } }`),
  and returns `null` if neither exists. Returns `null` early when there is no `userId`.
- **`src/routes/[lang]/+page.svelte`** — replaced the bare `<Loader />` with a real empty state.
  After the fix a boardless (new) user is no longer misdirected, so they land here; the page now
  offers a "create your first board" form and redirects to the new board on success. Reactively
  forwards to an existing own/member board if one shows up. All strings via `$t()`, dark-mode tokens,
  reuses existing i18n keys (`board.no_boards_yet`, `board.create_board_prompt`,
  `board.board_name_label`, `board.board_name_placeholder`, `board.create_board`, `board.board_created`).
- **`hasura/.env`** — admin secret + auth secret synced from root `.env`.
- **`hasura/metadata/**`** — `hasura metadata export` synced local metadata with the online server.
- **`src/lib/utils/__tests__/getTopBoardPath.test.ts`** — new unit tests (6 cases).

## Verification

- [x] `npm test` — full suite green (152 tests, incl. 6 new `getTopBoardPath` cases)
- [x] `npm run check` — no new errors/warnings introduced (9 pre-existing errors in unrelated files remain)
- [x] `hasura metadata diff` — empty (local == server)
- Note: the boards `select` permission intentionally keeps exposing `is_public` boards (sharing
  feature) — that was **not** changed; only the redirect logic was scoped.

## Results

- New users / fresh devices no longer auto-land on `@ftwbihs`'s public board.
- Users land on their own board (then a member board) when one exists, falling back to a
  functional "create your first board" page otherwise.