> Run with: Opus 4.8 / high

# Previos todo task implemented assigning to multiple users

## Original Requirement

[NEVER REMOVE]

And tested but I can't see in Vercel how to assign to multiple users

_From Kanban card `df100080-4ff1-4cd7-82db-660e380028bb`._

_GitHub issue #180 — end the commit subject with `(#180)`._

## Plan (Opus 4.8, 2026-09-12)

Context established:
- #130 implemented multi-assignee (`todo_assignees` junction, `CardAssignee.svelte` multi-select
  dropdown of board members with checkboxes + avatar stack). #179 added card avatars + webhook fan-out.
- Prod app = `https://todo.e-stonia.co.uk`; dev & prod share the SAME Hasura
  (`todzz.admin.servicehost.io`), so the data layer is identical. Codegen (targets remote Hasura)
  succeeded for #130, so `todo_assignees` is tracked in prod too.
- `CardAssignee` lists `board_members` for the todo's board. Owner is auto-added as a member by the
  `board_creator_as_owner` trigger, so a solo board shows exactly one checkbox (yourself).

Hypothesis for "can't see how to assign to multiple users": the assignee control is a small
`Users`-icon outline button in the card detail; on a solo board its dropdown shows only yourself, so
there is no visible path to *multiple* users — it reads as not-a-multi-assign feature. Need to
confirm live before choosing a fix (discoverability vs. a real prod bug).

### Steps
1. Reproduce live on prod with the test account (sign in, open a card, inspect the assignee control
   + console/network for GraphQL errors on `assignees`).
2. Decide: (a) real bug (metadata/permissions/query) → fix; or (b) discoverability → improve the
   CardAssignee affordance (clearer label/tooltip, and guidance to invite members when solo).
3. Implement, `npm run check` + `npm test`, re-verify live, commit to main `(#180)`.

## Log

### Session (Opus 4.8, 2026-09-12)

**Root cause (confirmed live).** Ran the app against the real remote Hasura (dev `.env` has
`PUBLIC_API_ENV=production`, so localhost hits the same backend as Vercel) and signed in as the test
user. Opened a card and clicked the assignee control: the dropdown works and IS a multi-select, but:
1. It only lists **existing board members**. On a board where you're the only member it shows just
   yourself, with **no path to add anyone** — so there is no visible way to assign *multiple* users,
   and no hint that inviting people to the board is the prerequisite. (The prod domain
   `todo.e-stonia.co.uk` didn't resolve from here, but dev==prod on Hasura + same `main` code, so the
   local repro is faithful.)
2. The Estonian label for `todo.assign_to` was **"Muuda omanikku" (Change owner)** and `unassigned`
   was **"omanikuta" (without owner)** — singular-ownership wording that makes a multi-assignee
   control read as single-assignee. (en `assign_to`="Assign to", cs="Přiřadit" were fine.)

The feature (from #130/#179) is otherwise present and correct end-to-end — `todo_assignees` is
tracked on the remote Hasura (codegen succeeded), the store/webhook fan-out and tests all pass. This
was a **discoverability** gap, not a broken feature.

**Fix (discoverability + wording), all in the assignee picker:**
- `src/lib/components/todo/CardAssignee.svelte`:
  - Added a hint line under the label — `todo.assign_hint` "Select one or more board members" — so it
    reads as multi-select.
  - Added a **"Manage Members"** action (UserPlus icon, reuses `board.manage_members`) at the bottom
    of the dropdown that opens the board-management modal (`actionState.edit='showBoardManagement'`),
    from which each board's ⋯ → Manage Members reaches the invite dialog.
  - `openBoardManagement()` first drops the `?card=` search param (via `page`/`goto`) to **close the
    card detail dialog** — otherwise the card dialog's `bg-black/50` overlay sits on top of the
    board-management modal and blocks it (caught during live verification).
- i18n: added `todo.assign_hint` to en/et/cs; fixed et `assign_to` → "Määra vastutajad" and
  `unassigned` → "Määramata".

**Verification.**
- `npm run check`: the only 10 errors are the pre-existing ones (todos store, store test fixtures,
  og-image/og-screenshot routes) noted in the prior DONE log — CardAssignee/states are clean, no new
  errors.
- `npx vitest run`: **283/283 pass** (both server & client projects).
- Live (dev, signed in as test user): confirmed the dropdown now shows the hint + "Manage Members",
  and the full route works — assignee dropdown → Manage Members → Board Management → board ⋯ → Manage
  Members → **Board Members** dialog with the Invite Users field. Card dialog closes cleanly first
  (no stuck overlay). Cleaned up the temporary list/card created for the test.

**Left for the user:** this makes multi-assign discoverable; assigning >1 person still requires the
board to actually have >1 member (invite them via the now-linked Manage Members). A future polish
could deep-link straight to *this* board's members dialog instead of the all-boards modal (would need
a small `actionState` signal), but that was out of scope for a safe fix here.
