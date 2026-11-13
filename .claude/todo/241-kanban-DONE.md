> Run with: Opus 5.5 / xhigh

# kanban?

## Original Requirement

[NEVER REMOVE]

other than kanban view option(s):

research others

combined all projects backlog

prioritise projects depending on sort order already on kanban

_From Kanban card `2f7fbb72-c7db-4bd9-bc9f-7f0c5e333e3c`, moved to the agent list._

_GitHub issue #241 — end the commit subject with `(#241)`._

## Research — what other tools offer besides the kanban

| Tool | Views | One view across projects | How projects get an order |
| --- | --- | --- | --- |
| Trello | Board, Table, Calendar, Timeline, Dashboard, Map (Premium) | Workspace **Table** and **Calendar**: cards from up to 20 boards, filter by list / label / member / due | Boards have no rank |
| Linear | List ⇄ Board (Cmd/Ctrl+B), Timeline for projects | "My Issues", plus custom views over all teams | Project priority, issue priority, a Backlog status |
| ClickUp | List, Board, Table, Calendar, Gantt, Timeline, Workload | **All Tasks** (was "Everything"): the whole workspace, list by default | Priority flags |
| Asana* | List, Board, Timeline, Calendar, Gantt, Dashboard | My Tasks; Portfolios | Portfolio priority field |
| Jira* | Backlog, Board, List, Timeline, Calendar | Plans rank issues across projects | One rank across the plan |
| Notion* | Table, Board, List, Calendar, Timeline, Gallery, Chart | One database can hold every project | Sort by a property |
| GitHub Projects* | Table, Board, Roadmap | One project holds issues from many repos | Manual row order |
| Todoist* | List, Board, Calendar | Today / Upcoming over all projects | Sidebar project order, p1–p4 |

\* From product knowledge, not re-checked on the web this session. Sources checked:
[Trello workspace views](https://support.atlassian.com/trello/docs/workspace-views),
[Linear custom views](https://linear.app/docs/custom-views),
[Linear display options](https://linear.app/docs/display-options),
[ClickUp All Tasks / Everything view](https://help.clickup.com/hc/en-us/articles/6310138041367-Add-an-Everything-view).

What this means for ToDzz:

1. **A list of the same cards is what every tool has next to the board.** → #253 (board ⇄
   list toggle).
2. **A view across all projects is the main reason to use these tools at scale** (Trello
   Workspace Table, ClickUp All Tasks, Todoist Today). → built this session: `/[lang]/backlog`.
3. **Project order.** The other tools rank projects separately from cards (Asana
   portfolios, Linear project priority, Jira plans). ToDzz already has a project order:
   the board order in the switcher (`boards.sort_order`). As asked, the backlog uses it:
   board 1's cards, then board 2's, and so on, each board in its kanban order.
4. **Calendar comes next** (Trello, Todoist, ClickUp, Notion, Asana); cards already have
   `due_on`. → #255.
5. **Not worth it yet:** Timeline / Gantt (cards have no start date), Workload (boards are
   mostly one person), Gallery / Map (no use case here). A sortable table can grow out of the
   backlog rows later if needed.

## Results

**Summary** — Answered the research (above) and built the combined backlog.
`/[lang]/backlog` lists every open card from the boards you own or belong to, in one
numbered list (#1…n). Boards come in the board-switcher order. Inside each board, lists go
left to right and cards top to bottom, with the same `|| 999` defaults the kanban uses.
Each board is a section headed by its icon, colour, name (links to the board) and card
count. A row shows rank, title, the high-priority dot, the due badge (red when overdue) and
the list name, and it links to `?card=` on its board. Cards come from one `getTodos` call
per board, the same call a board refresh makes, 4 boards at a time. Sections appear as
boards arrive, and a board that fails is counted ("cards of N board(s) could not be
loaded") while the others still show. The board header has a new **Backlog** button. No new
server op and no schema change, so it runs the same on Hasura now and on D1 after #234.

**Files changed**
- created `src/routes/[lang]/backlog/+page.svelte`, `src/lib/stores/backlog.svelte.ts`,
  `src/lib/utils/backlog.ts` (`rankBacklog`, pure)
- created `src/lib/utils/__tests__/backlog.test.ts` (4), `src/lib/stores/__tests__/backlog.svelte.test.ts` (2)
- modified `src/routes/[lang]/[username]/[board]/+page.svelte` (Backlog button),
  `src/lib/locales/{en,et,cs}/common.json` (`backlog.*`), `package.json` (0.37.0)
- follow-ups for the Backlog column: `253-boardListView.md`, `254-backlogActions.md`,
  `255-calendarView.md`

**Verification**
- `npm run check`: 0 errors, 0 warnings.
- Unit tests (`vitest --run`, client + server): 60 files, 617 passed, 5 skipped; the new 6
  are among them.
- `npm run build` (adapter-cloudflare): OK. The backlog page's server chunk is 6.66 kB.
- Svelte autofixer on the new page: no issues. ESLint on the new files: clean. The board
  page had 15 lint errors before this change and still has the same 15.
- e2e (`npm test`'s Playwright step): did NOT run. This machine has no Chrome at
  `/opt/google/chrome/chrome` (the config uses `channel: 'chrome'`), so the setup project
  fails before any spec starts. Nothing in `e2e/` covers the new page yet.
- Not checked in a browser against live data. After deploy, open
  `/en/backlog` and check that the order matches the switcher and each board.

**Deviations**
- The request was a research question, so this run answered it and built one slice. The
  other views are follow-ups, not built.
- `boards.sort_order` is one number per board, set by its owner (BoardManagement reorders
  only boards you own). A board shared with you sits wherever its owner's number puts it,
  in the backlog exactly as in the switcher. A per-user board order would need a column on
  `board_members` and was not part of this request.
- The backlog is read-only for now: a row opens the card on its board. Filters, completing
  a card in place and an in-page card dialog are #254.
