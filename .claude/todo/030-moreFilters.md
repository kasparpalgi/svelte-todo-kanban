# More Filters Implementation

## Original Requirement
Add to filters: assigned to me and dropdown assigned to someone else assigned to the board.

Also add checkbox "Search also content" and then search also the content of the card.

Also, labels and priority filters.

## Implementation Summary

### Changes Made

#### 1. Updated Filter Interface (`todoFiltering.svelte.ts`)
Added new filter fields to the `TodoFilters` interface:
- `searchContent?: boolean` - Flag to enable searching in card content
- `assignedToMe?: boolean` - Filter for tasks assigned to current user
- `assignedTo?: string | null` - Filter for tasks assigned to specific user (null = unassigned)
- `labelIds?: string[]` - Filter for tasks with specific labels

#### 2. Updated Filter Logic (`todoFiltering.svelte.ts`)
Enhanced the `filterTodos()` function to:
- Accept optional `currentUserId` parameter for assignment filtering
- Support content search when `searchContent` flag is enabled
- Filter by assignment (assigned to me, assigned to specific user, unassigned)
- Filter by multiple label IDs (tasks with any of the selected labels)
- Updated all related functions to pass `currentUserId` parameter

#### 3. Enhanced UI (`TodoFiltersSidebar.svelte`)
Added new filter UI sections:

**Search Enhancement:**
- Added checkbox to enable/disable content search

**Assignment Filters:**
- "Assigned to me" button (filters tasks assigned to current user)
- Dropdown menu for "Assigned to" with board members
- Option for "Unassigned" tasks

**Priority Filters:**
- Three priority buttons: High (red), Medium (blue), Low (gray)
- Multi-select support

**Label Filters:**
- Display labels from current board
- Labels shown with their assigned colors
- Multi-select support

#### 4. Added Translations
Updated translation files for English, Estonian, and Czech:
- `filters.search_content` - "Search also content"
- `filters.assignment` - "Assignment"
- `filters.assigned_to_me` - "Assigned to me"
- `filters.assigned_to_other` - "Assigned to"
- `filters.unassigned` - "Unassigned"
- `filters.priority` - "Priority"
- `filters.labels` - "Labels"

#### 5. Component Updates
Updated `TodoKanban.svelte` to pass `currentUserId` to filtering functions

### Files Modified
1. `src/lib/stores/todoFiltering.svelte.ts` - Filter interface and logic
2. `src/lib/components/todo/TodoFiltersSidebar.svelte` - UI components
3. `src/lib/components/todo/TodoKanban.svelte` - Pass user ID to filters
4. `src/lib/locales/en/common.json` - English translations
5. `src/lib/locales/et/common.json` - Estonian translations
6. `src/lib/locales/cs/common.json` - Czech translations

### Features Implemented
✅ "Assigned to me" filter
✅ Dropdown to filter by specific assignee
✅ Unassigned tasks filter
✅ "Search also content" checkbox
✅ Priority filters (high/medium/low)
✅ Label filters (multi-select)
✅ All filters support multi-selection where appropriate
✅ Filter state persisted to localStorage
✅ Active filter count displayed
✅ "Clear all" resets all filters

### Technical Details
- Filters are mutually exclusive between "assigned to me" and "assigned to specific user"
- Label filtering uses OR logic (matches if task has any selected label)
- Priority filtering uses OR logic (matches if task has any selected priority)
- Content search only active when checkbox is enabled
- All filters work together with AND logic
- Board members are loaded on mount when board is selected
- Labels are derived from current board

### Next Steps
- Test all filter combinations
- Verify filter persistence across sessions
- Test with multiple users on shared boards
- Ensure performance with large numbers of tasks