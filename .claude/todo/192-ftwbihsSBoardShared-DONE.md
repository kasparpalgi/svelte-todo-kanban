> Run with: Opus 4.8 / high

# Ftwbihs's board Shared @ftwbihs 1  josep oriol 6 Shared @lumen00

## Original Requirement

[NEVER REMOVE]

In the top of my board switcher: 

Ftwbihs's boardShared

@ftwbihs1

josep oriol 6Shared

@lumen00

Never wanted those. There was once already issue with ftwbihs but it was fixed. Not sure how those appeared suddenly. Some bug somewhere. See relations and records in database for user email [kaspar@e-stonia.co.uk](mailto:kaspar@e-stonia.co.uk) (that is me).

_From Kanban card `7f76f657-452b-4f56-a872-5996a7c04a6b`._

_GitHub issue #192 — end the commit subject with `(#192)`._

---

## Investigation (2026-09-17)

Queried the remote `todzz` Hasura DB (admin) for user `kaspar@e-stonia.co.uk`
(id `87130678-…`, username `kaspar1`).

**The two unwanted boards:**
| Board | alias | owner | is_public |
|---|---|---|---|
| Ftwbihs's board | ftwbihss-board | ftwbihs | **true** |
| josep oriol 6 | lumen00s-board | lumen00 | **true** |

**Relations for kaspar1:** the only `board_members` / `board_invitations` row is
membership of his *own* board ("Kaspar1's board"). He has **no** member row and
**no** invitation to either unwanted board. The board_members rows on those boards
are just their own owners.

### Root cause
The `boards` select permission (`hasura/.../public_boards.yaml`) is a UNION:
owner **OR** member **OR** invited **OR** `is_public = true`. That last clause is
required so a public board can be opened by direct URL. But
`listsStore.loadBoards()` / `loadArchivedBoards()` fetch *every readable board*
with no user scoping, so **every public board on the whole platform lands in
everyone's board switcher.** Currently 3 public boards exist → they leak into all
71 boards' switchers. This is a general bug, not specific to kaspar.

`BoardSwitcherModal.svelte` used to re-filter by isOwner/isMember client-side (the
earlier "ftwbihs fix"); that filter was later removed (see the comment at lines
63–66) because it also dropped *invited* boards — which re-introduced the leak.

No DB write is warranted: the public boards belong to other users and are
legitimately theirs to make public. The fix is client-side scoping.

### Plan
1. `listsBoards.svelte.ts`: add a `boardScopeWhere(user)` helper (owner OR member
   OR invited-by-email/username, **excluding** public-only) and apply it in
   `loadBoards` + `loadArchivedBoards`. No user → return `[]` (don't show strangers').
2. Add `loadBoardByAlias(alias)` so direct navigation to a public board still works
   (fetches the single board by alias, sets it selected, without polluting the
   switcher list).
3. `[board]/+page.svelte` `loadBoardData`: fall back to `loadBoardByAlias` when the
   board isn't in the scoped list.
4. Refresh the stale comment in `BoardSwitcherModal.svelte`.
5. Tests + `npm run check` + `npm test`; verify live as kaspar1.

## Actions log

**Changes made:**
- `src/lib/stores/listsBoards.svelte.ts`
  - Added `boardScopeWhere()` — builds `{ _or: [ owner, member, invited-by-email/username ] }`
    from the signed-in user; returns `null` when there is no user.
  - `loadBoards()` / `loadArchivedBoards()` now wrap their date filter in
    `{ _and: [ <archived filter>, scope ] }`; when there is no user they clear the
    list and return `[]` instead of fetching every public board.
  - Added `loadBoardByAlias(alias)` (exported) — fetches one board by alias
    (still permission-checked) and selects it, so public boards still open by URL.
- `src/routes/[lang]/[username]/[board]/+page.svelte` — `loadBoardData` falls back to
  `loadBoardByAlias` when the board isn't in the (now scoped) switcher list.
- `src/lib/components/listBoard/BoardSwitcherModal.svelte` — refreshed the stale comment.
- `src/lib/stores/__tests__/listsBoards-archive.test.ts` — fixed the `user.svelte` mock
  path (`./` → `../`, it never actually intercepted before), updated the two `where`
  assertions to the scoped shape, and added tests for invitation scoping, the no-user
  case, and `loadBoardByAlias`.

**No DB writes.** The public boards belong to other users and are legitimately theirs
to keep public; the bug was purely the client fetching every readable board.

## Verification
- `npm run check`: 10 errors / 6 warnings — all pre-existing in unrelated files
  (todos store, og-image servers), confirmed identical on a stash baseline. **Zero new.**
- `npm run test:unit:server -- --run`: **232 passed**, including the 8 in
  listsBoards-archive.test.ts. (The `client`/browser vitest project can't run here —
  its Playwright chromium build 1193 won't download in this sandbox; it failed the same
  way before any change, so not a regression.)
- **Live** (dev server + real authenticated session as user `@kaspar`, owner of the
  `Todzz` public board): opened the board switcher — every listed board is `@kaspar`'s
  own; the two strangers' public boards (`Ftwbihs's board @ftwbihs`, `josep oriol 6
  @lumen00`) and all "Shared" badges are gone. Screenshot captured.
- DB before/after (production data, admin SQL) for the reporter and the test account both
  confirmed: buggy query returned owned + members + **3 stranger public boards**; scoped
  query returns only owned/member/invited.

## Result
Fixed. Strangers' public boards no longer leak into anyone's board switcher; public
boards remain viewable by direct URL. Root cause was client-side (unscoped board fetch),
not a data corruption — nothing in kaspar's records needed changing.

## Results

The agent finished the run but never renamed the file, so the runner completed it. The tree was clean and the agent's commits are in — see the `.log` beside this file for the full session.
