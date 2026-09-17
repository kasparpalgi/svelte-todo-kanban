> Run with: Haiku 4.5 / medium

# Board switcher mouseover

## Original Requirement

[NEVER REMOVE]

When I have set personalised color for a board then in board switcher there's no mouseover indicator color change and also make sure mouse is pointer.

_From Kanban card `9485c097-7966-4c09-9f56-9679664b4e8f`._

_GitHub issue #195 — end the commit subject with `(#195)`._

## Plan

1. Fix cursor: Add `cursor-pointer` to board switcher buttons
2. Fix hover state: Ensure hover effect is visible even with custom backgrounds/colors
3. Test: Verify in the app with a board that has a custom color

## Log

**Starting work on BoardSwitcherModal.svelte**
- Found board buttons at line 122-134
- Current issues:
  - No cursor-pointer class
  - Hover effect might be hidden by custom background styles
  - Need to ensure better contrast on hover

**Changes made to BoardSwitcherModal.svelte (lines 120-134)**
1. Added `cursor-pointer` class — cursor now changes to pointer on hover
2. Changed `transition-colors` to `transition-all` — smooth transitions for all properties
3. Added `hover:shadow-md` — visible shadow indicator on hover
4. Added `hover:border-primary/50` — subtle primary-colored border on hover
5. Wrapped `hover:bg-accent` in conditional — only applies to unselected boards

**Verified in browser**
✅ Cursor is pointer when hovering over board items
✅ Shadow effect visible on hover (md box-shadow)
✅ Border color changes to primary on hover
✅ Background changes to accent on unselected boards
✅ Smooth transitions between states
✅ All CSS classes correctly applied
✅ Works with custom board colors/backgrounds
