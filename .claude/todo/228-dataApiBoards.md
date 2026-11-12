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
