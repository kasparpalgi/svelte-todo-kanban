> Run with: Opus 5.5 / medium
> Machine: mac

# Boardswitcher start typing and enter

## Original Requirement

[NEVER REMOVE]

When I open board switcher then a small input area in top that is by default focused so one can start typing and ENTER will open the most top one filtered after typing.

_From Kanban card `691517c7-3be7-4dc7-bf66-00843beb5981`, moved to the agent list._

_GitHub issue #238 — end the commit subject with `(#238)`._

## Results

**Summary** — The board switcher now has a filter input at the top that is focused as soon as the
modal opens. Typing narrows both the Active and Archived lists (case-insensitive match on board name,
alias and owner username). On the Active tab, Enter opens the top match, and Escape closes the modal.
Focus is set with an `{@attach}` on mount, because a plain `autofocus` attribute did not take inside
the modal. The new e2e test caught that.

**Files changed**
- created `src/lib/utils/filterBoards.ts` — pure filter helper
- created `src/lib/utils/__tests__/filterBoards.test.ts` — 4 unit tests
- created `e2e/board-switcher-filter.spec.ts` — opens the switcher, asserts focus, filters to nothing, filters to the test board, Enter navigates
- modified `src/lib/components/listBoard/BoardSwitcherModal.svelte` — search input + Enter/Escape handling
- modified `src/lib/locales/{en,et,cs}/common.json` — `board.filter_boards`
- modified `package.json` — 0.29.0 → 0.30.0

**Verification**
- `npm run check` — 0 errors, 0 warnings
- `npm test` — 49 files / 466 tests passed
- Svelte autofixer — no issues
- `npx playwright test --project=authenticated e2e/board-switcher-filter.spec.ts` (test user, fresh build) — passed

**Deviations** — Enter does nothing on the Archived tab, because archived boards can only be
restored, not opened. Filtering still applies there.
