# COMPLETED: Remove "List" and all its related code ✅

## Original Requirement

[NEVER REMOVE]

At the moment there's in the top option to switch between list and kanban and from user settings what is default. Leave only kanban.

_From Kanban card `4dc6bd08-4d4f-40f2-91e2-aba737a57f8f`._

_GitHub issue #173 — end the commit subject with `(#173)`._

## Plan

1. ✅ Identify all list-related code:
   - TodoList.svelte component
   - View mode toggle in board page
   - View mode settings in user settings
   - View preference storage in user store

2. Remove:
   - Delete TodoList.svelte
   - Remove view mode toggle from board page (+page.svelte)
   - Remove view mode setting from settings page
   - Remove updateViewPreference from user store
   - Remove viewMode from user settings schema
   - Clean up any conditional renders

3. Keep: TodoKanban as the only view

## Progress

### Step 1: Examine key files ✅
- [x] src/routes/[lang]/[username]/[board]/+page.svelte - has viewMode toggle and TodoList import
- [x] src/routes/[lang]/settings/+page.svelte - has viewMode toggle
- [x] src/lib/stores/user.svelte.ts - has updateViewPreference function
- [x] src/lib/components/todo/TodoList.svelte - entire component to remove
- [x] src/lib/stores/states.svelte.ts - has viewMode in actionState

### Step 2: Remove list view code ✅
- [x] Remove TodoList import from board page
- [x] Remove viewMode state and related logic from board page
- [x] Remove view mode toggle UI from board page (List/LayoutGrid buttons removed)
- [x] Remove "Add todo" card from board page (only shown in list view)
- [x] Remove localStorage viewMode logic from board page
- [x] Remove viewMode from settings page UI
- [x] Remove toggleViewMode function from settings page
- [x] Remove viewMode from formData
- [x] Remove updateViewPreference function from user store
- [x] Remove viewMode getter from user store
- [x] Remove viewMode from actionState in states.svelte.ts
- [x] Remove TodoList.svelte file
- [x] Remove List/Layers icons from imports

### Step 3: Verification ✅
- [x] No remaining viewMode references in codebase
- [x] No remaining TodoList references in codebase
- [x] No remaining updateViewPreference references
- [x] TypeScript check passes (10 errors remaining, all pre-existing)
- [x] Fixed syntax error in board page

## Done! 🎉
All list view code has been removed. Only Kanban view remains.
