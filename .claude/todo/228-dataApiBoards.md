> Run with: Sonnet 5.5 / high

# Data API: boards, lists, labels, members, invitations

## Original Requirement

[NEVER REMOVE]

Follow-up from #226. Original request: "Backend tables are not most logical maybe everywhere so it is not just a blind one to one Hasura -> Cloudfare. Anyway, want to drop now Hasura and move to Cloudfare D1 SQLight I hink was there free to host. So plan properly each section before just moving if it could be also improved. Each subtask must end with deploy and test that is still works the same way after deploy. Finally confirm that I can dow delete the Hasura from Hetzner."

Plan: `.claude/todo/226-backend-DONE.md`, section 2. Needs `dataApiFoundation` first.

1. Move these `documents.ts` operations behind ops in `src/lib/server/ops/boards.ts`:
   GetBoards, CreateBoard, UpdateBoard, DeleteBoard, GetLists, CreateList, UpdateList,
   DeleteList, CreateLabel, UpdateLabel, DeleteLabel, GetBoardMembers, AddBoardMember,
   UpdateBoardMember, RemoveBoardMember, GetBoardInvitations, GetMyInvitations,
   GetInvitationByToken, CreateBoardInvitation, UpdateBoardInvitation,
   DeleteBoardInvitation. Replace the client-built `where` objects with explicit inputs
   (`boardId`, `alias`, …).
2. Check access with `boardRole` in every op. **Viewers are read-only** (pending the owner's
   answer in 226, Decisions 5). Hasura lets any member edit today. Accepting an invitation
   becomes one server op: check that the invitation is pending and is the caller's, then
   insert the member with the invited role and mark it accepted. This applies to both
   `/invite/[token]` and the bell.
3. Stores: `listsBoards.svelte.ts`, `boardMembers.svelte.ts`, `invitations.svelte.ts`,
   `labels.svelte.ts`, `getTopBoardPath.ts`, and the SSR loads in `+layout.server.ts` and
   `[lang]/+layout.server.ts`.

**Done when (deploy + live check):** check and tests pass (new op tests: viewer write → 403,
non-member read of a private board → 403). Deployed to Vercel and the Worker. Live as the
test user: create, rename and archive a board; reorder lists; add and remove a label; send an
invitation, see it listed, cancel it. No GraphQL request from the browser for these.

_GitHub issue #228 — end the commit subject with `(#228)`._

## Owner decisions (2026-11-12)

- **Viewers are read-only and can only comment:** they can read the board and cards, add
  comments, and edit or delete their own comments. Nothing else; the API returns 403. The
  UI hides the edit controls for viewers (create card, drag, edit fields, labels, assign,
  uploads, list and board settings).
- Stay on Workers Free and D1 Free; keep every op cheap in CPU, requests and rows read.

## Notes from #227 (data API foundation, shipped)

- `boardRole(ctx, boardId)` in `src/lib/server/access.ts` covers owner, member and public,
  as #227 asked. The Hasura boards select rule also lets an **invitee** (by email or
  username) read the board row, which the invitation UI needs. Keep that as a separate
  invitation check in these ops, not as a `boardRole` value.
- The poll (`src/lib/server/ops/poll.ts`) fingerprints the board's cards, its lists and
  `boards.updated_at`, and the board page reloads lists and boards only when that changes
  (plus a full refresh every 5 minutes). Member and label changes ride on the 5-minute
  refresh; add them to the fingerprint here if that is too slow.
