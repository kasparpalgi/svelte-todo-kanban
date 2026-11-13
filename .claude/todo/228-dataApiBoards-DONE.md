> Run with: Opus 5.5 / high
> Machine: mac

# Data API: boards, lists, labels, members, invitations

## Original Requirement

[NEVER REMOVE]

> Run with: Sonnet 5.5 / high

# Data API: boards, lists, labels, members, invitations

## Original Requirement

\[NEVER REMOVE\]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -&gt; Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, section 2. Needs `dataApiFoundation` first.

1. Move these `documents.ts` operations behind ops in `src/lib/server/ops/boards.ts`: GetBoards, CreateBoard, UpdateBoard, DeleteBoard, GetLists, CreateList, UpdateList, DeleteList, CreateLabel, UpdateLabel, DeleteLabel, GetBoardMembers, AddBoardMember, UpdateBoardMember, RemoveBoardMember, GetBoardInvitations, GetMyInvitations, GetInvitationByToken, CreateBoardInvitation, UpdateBoardInvitation, DeleteBoardInvitation. Replace the client-built `where` objects with explicit inputs (`boardId`, `alias`, …).
2. Check access with `boardRole` in every op. **Viewers are read-only** (pending the owner's answer in 226, Decisions 5). Hasura lets any member edit today. Accepting an invitation becomes one server op: check that the invitation is pending and is the caller's, then insert the member with the invited role and mark it accepted. This applies to both `/invite/[token]` and the bell.
3. Stores: `listsBoards.svelte.ts`, `boardMembers.svelte.ts`, `invitations.svelte.ts`, `labels.svelte.ts`, `getTopBoardPath.ts`, and the SSR loads in `+layout.server.ts` and `[lang]/+layout.server.ts`.

**Done when (deploy + live check):** check and tests pass (new op tests: viewer write → 403, non-member read of a private board → 403). Deployed to Vercel and the Worker. Live as the test user: create, rename and archive a board; reorder lists; add and remove a label; send an invitation, see it listed, cancel it. No GraphQL request from the browser for these.

*GitHub issue #228 — end the commit subject with* `(#228)`*.*

_From Kanban card `9c8e16d7-9af8-470e-8e79-047ccb6219dc`, moved to the agent list._

_GitHub issue #228 — end the commit subject with `(#228)`._

## Results

**Summary** — Boards, lists, labels, members and invitations go through `POST /api/data/<op>`
now. The browser sends no GraphQL for them. Shipped in `5ba3ddd`, live on www.todzz.eu (Vercel)
and on the Worker (version `7c875d9e`).

- **22 ops** in `src/lib/server/ops/`: `boards.ts` (getBoards, getBoard, createBoard,
  updateBoard, deleteBoard), `lists.ts`, `labels.ts`, `members.ts` (getBoardMembers,
  updateBoardMember, removeBoardMember) and `invitations.ts` (getBoardInvitations,
  getMyInvitations, createBoardInvitation, cancelInvitation, acceptInvitation,
  declineInvitation). They take explicit inputs (`id`, `boardId`, `alias`, a strict `set`).
  The server builds every `where`; the client sends none. A `set` with a column the app never
  writes (for example `user_id`) gets a 400.
- **Access, in code, on every op** (`requireRole` in `access.ts`, built on `boardRole`):
  - Reading: anyone who can see the board. Members and invitations are for members only.
  - Changing the board, its lists and its labels: owners and editors. **Viewers are
    read-only** (403), and so are public-board visitors.
  - Owner only: deleting a board, changing a member's role, sending and cancelling
    invitations. A member can still leave the board themselves.
  - Strangers get 403. Moving a list to another board also needs edit rights on that board.
- **The invitee rule** stays out of `boardRole`, as the #227 note said: `getBoards` and
  `getBoard` also show a board with a *pending* invitation addressed to the caller. Before,
  any invitation counted, declined ones included. The email and username come from the
  user's row, not from the session.
- **Accepting is one server op** for the bell and for `/invite/<token>`. It checks that the
  invitation is the caller's, is pending and has not expired. Then one Hasura mutation (one
  transaction) adds the member with the invited role and marks the invitation accepted. An
  existing owner is never downgraded; the old upsert could do that. Accepting an
  already-accepted invitation just returns its board.
- **The landing redirect** (`getTopBoardPath`, moved to `src/lib/server/topBoardPath.ts`)
  runs on these ops on the server, so `/`, `/<lang>`, `/signin` and the invite page no
  longer mint a Hasura JWT for it. It goes to the last board, else the user's own first
  board, else a board they belong to. It never picks a board they are only invited to.
- **Found and fixed: invitations had no token.** The DB trigger that made tokens was dropped
  long ago (migration `1759511279416`). Every production invitation since has
  `token = null`, and the store sends the invite email only when a token exists. So
  **invite emails have not been sent for a long time.** `createBoardInvitation` now
  generates the token (a random UUID).

**Files changed**
- created: `src/lib/server/ops/{boards,lists,labels,members,invitations}.ts`,
  `src/lib/server/ops/__tests__/boards.test.ts`
- moved: `src/lib/utils/getTopBoardPath.ts` → `src/lib/server/topBoardPath.ts` (rewritten),
  and its test → `src/lib/server/__tests__/topBoardPath.test.ts`
- modified: `src/lib/server/access.ts` (`requireRole`, `isMember`, `isOwner`, `identity`,
  `invitedWhere`), `src/lib/server/ops/index.ts`, `src/lib/graphql/documents.ts` (+
  `GET_LIST_BOARD`, `GET_LABEL_BOARD`, `GET_MEMBER_BOARD`, `GET_INVITATION_BOARD`,
  `GET_USER_IDENTITY`, `GET_INVITATION`, `ACCEPT_INVITATION`; − `ADD_BOARD_MEMBER`,
  `GET_INVITATION_BY_TOKEN`), `src/lib/graphql/generated/*`, the stores `listsBoards`,
  `boardMembers`, `invitations` and `labels`, `src/routes/+layout.server.ts`,
  `src/routes/[lang]/+layout.server.ts`, `src/routes/signin/+page.server.ts`,
  `src/routes/invite/[token]/+page.server.ts` and its test, the store tests
  `listsBoards-archive` and `boardLoadRace`, `package.json` / `package-lock.json`
  (0.30.0 → 0.31.0), `.claude/todo/229-dataApiCards.md` (handover notes)

**Verification**
- `npm run check`: 0 errors, 0 warnings. `vitest --run`: 50 files, 490 tests passed. The
  new op tests check every write op (a viewer, a public visitor and a stranger get 403; an
  editor gets through), the owner-only ops, a non-member reading a private board's members
  (403), the `getBoards` scope, `getLists`, accept/decline (only the caller's invitation,
  not expired, joins with the invited role) and the inviter and token on create.
  ESLint is clean on the new files. The 3 errors it still reports are older `any`s on lines
  this change didn't touch.
- `vite build` passes. Pushed `5ba3ddd` to `main`, Vercel status "success".
  `npx wrangler deploy` uploaded version `7c875d9e`.
- **Local UI (dev server on the prod Hasura), as the test user:** sign-in landed on
  `/et/test/tests-board` through the new server redirect. Through the UI: created a list;
  created, renamed and archived a board; opened its members (`getBoardMembers`); invited a
  username, saw it under pending invitations, and cancelled it. During these flows the only
  requests to `todzz.admin.servicehost.io` were `GetTodos` (cards, #229). Boards, lists and
  invitations went only through `/api/data/*`.
- **Live on www.todzz.eu, as the test user:** create, rename, archive (listed under
  archived), restore; two lists reordered (`BA`); a label added (visible on the board) and
  removed; an invitation sent (with a token), listed, cancelled, gone. Against someone
  else's private board, reading members, renaming the board and adding a list all gave
  403. Adding a list to a public board gave 403.
- **Live on the Worker:** the same flow (board, list reorder, invitation, 403 for a
  stranger) passed.
- All test boards, lists and invitations were deleted afterwards (0 `zz228*` rows left).
- `/verify` was not invoked as a skill from the runner; the checks above are the ones that
  match this change.

**Deviations**
- The ops are split over five files, not one `boards.ts`, to keep each under 150 lines.
- The ops return plain rows (a board, a list, `{ deleted }`), not the old Hasura mutation
  shapes. Only the stores changed; components didn't.
- There is no `addBoardMember` op: only invitations added members, and `acceptInvitation`
  covers that. `updateBoardInvitation` became `acceptInvitation` and `declineInvitation`.
- `/invite/<token>` for an expired or declined invitation now lands on the user's top
  board, not on a board they can't open.
- Beyond the plan: the invitation token fix (above).
- Not done here, noted in `229-dataApiCards.md`:
  - Hiding the edit controls from viewers in the UI. The server already refuses their
    writes; the owner's decision groups the UI with the card controls.
  - Adding and removing a label on a card, and the board page's SSR OG lookup. Both are
    card work.
  - The archive confirm shows an empty board name. This bug was there before.
