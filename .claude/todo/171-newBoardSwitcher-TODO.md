> Run with: Sonnet 4.6 / high

# New tasks' fixes (board switcher & invoices)

## Original Requirement

[NEVER REMOVE]

New board switcher was implemented but the top part of it not visible. How to see it? Added to the outer div `mt-36` and in localhost looks good and also Vercel deploy looks green so confusing. I have tried in incognito and another browser.

Also, invoices functionality was implemented. Where can I see it?

_From Kanban card `74165cb6-d463-41c2-ab80-b4b2295244ad`._

_GitHub issue #171 — end the commit subject with `(#171)`._

---

## Analysis

### Board Switcher

- `BoardSwitcherModal.svelte` backdrop: `fixed inset-0` with NO z-index
- The `[lang]/+layout.svelte` header has `sticky top-0 z-50`
- Without a z-index the modal renders BEHIND the header → header covers top of modal
- Workaround `mt-36` shifts the inner div down so it's fully below the header (~144px)
- Proper fix: add `z-[60]` to backdrop div + remove `mt-36` from inner div

### Invoices

- Page route: `src/routes/[lang]/[username]/[board]/invoices/+page.svelte`
- Access via UserMenu → Invoices menu item (FileText icon) – only when a board is selected
- URL pattern: `/{lang}/{username}/{boardAlias}/invoices`
- Bug: `import { page } from '$app/stores'` (Svelte 4) should be `$app/state` (Svelte 5)

## Action Log

- [x] Fixed `BoardSwitcherModal.svelte`: added `z-[60]` + semi-transparent backdrop to outer div, removed `mt-36` from inner div
- [x] Fixed `invoices/+page.svelte`: changed `$app/stores` → `$app/state`
- [x] TypeScript check passed
- [x] Committed

### Round 2 — modal still clipped (root cause: `backdrop-filter`)

**Root cause**: `BoardSwitcherModal` was rendered inside `<header>` (via `BoardSwitcher → UserMenu → nav → header`). The header has `backdrop-blur` (`backdrop-filter: blur(...)`), which in CSS creates a new containing block for `fixed`-position descendants. This clamped the `fixed inset-0` backdrop to the 68px header height instead of the full viewport.

- [x] Moved modal rendering to `[lang]/+layout.svelte` (outside `<header>`) using `actionState.showBoardSwitcher` flag
- [x] `BoardSwitcher.svelte` now just sets `actionState.showBoardSwitcher = true` (no inline modal)
- [x] Modal positioned with `items-start pt-[4.5rem]` — appears just below header with ~15px gap
- [x] Increased backdrop from `bg-black/50` → `bg-black/70` for dark mode visibility
- [x] Commits: bb1707f, 012d061, 82f270e
- [x] Confirmed working in browser as test@e-stonia.co.uk
