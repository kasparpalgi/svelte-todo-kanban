# Task 023: Board Activity Feed

## Original Requirement
Create all board activity icon somewhere where we can see all the past activity on the board by all users like in Trello. Plan what activity there shall be and implement.

## Analysis
The application already had basic activity logging infrastructure in place:
- Database table: `activity_logs` with action types like created, updated, deleted, completed, commented, etc.
- GraphQL queries: `GET_ACTIVITY_LOGS`, `CREATE_ACTIVITY_LOG`
- Store: `activityLogStore` with basic functionality for todo-level activities

However, it was missing:
- Board-level activity querying
- UI components to display activity feed
- Integration in the board page
- Translations for activity types

## Implementation Plan

### 1. Database & GraphQL Layer (Already Exists)
- ✅ `activity_logs` table with comprehensive action types
- ✅ GraphQL fragment and queries
- ✅ Enhanced fragment to include todo, list, and board information for context

### 2. Store Extension
- ✅ Extended `activityLogStore` with `loadBoardActivityLogs()` method
- ✅ Queries activities across all todos in a board via relationship chain (todo -> list -> board)

### 3. UI Components
- ✅ `BoardActivityButton.svelte` - Button to open activity feed (uses Activity icon from lucide-svelte)
- ✅ `BoardActivityList.svelte` - Displays formatted activity items with:
  - User avatar and name
  - Action description
  - Related task title
  - List context
  - Relative time
  - Color-coded action icons
- ✅ `BoardActivityView.svelte` - Dialog container with refresh functionality

### 4. Integration
- ✅ Added activity button to board page toolbar (next to Notes button)
- ✅ Integrated dialog with board state

### 5. Translations
- ✅ Added comprehensive activity translations to English locale
- ✅ Action types: created, updated, deleted, completed, commented, assigned, priority changed, etc.

## Activity Types Tracked
Based on the database schema, the following activities are tracked:
1. **Task lifecycle**: created, updated, deleted, completed, uncompleted
2. **Assignments**: assigned, unassigned
3. **Comments**: commented, comment_edited, comment_deleted
4. **Attachments**: image_added, image_removed
5. **Metadata**: priority_changed, due_date_changed

## Changes Made

### New Files
1. `src/lib/components/activity/BoardActivityButton.svelte` - Activity feed button
2. `src/lib/components/activity/BoardActivityList.svelte` - Activity list renderer
3. `src/lib/components/activity/BoardActivityView.svelte` - Activity dialog view

### Modified Files
1. `src/lib/stores/activityLog.svelte.ts`
   - Added `loadBoardActivityLogs(boardId)` method
   - Queries activities via `todo.list.board_id` relationship

2. `src/lib/graphql/documents.ts`
   - Extended `ACTIVITY_LOG_FRAGMENT` to include:
     - `todo.title`
     - `todo.list.name`
     - `todo.list.board.name`, `alias`

3. `src/routes/[lang]/[username]/[board]/+page.svelte`
   - Imported activity components
   - Added `showActivityDialog` state
   - Added activity button to toolbar
   - Added activity dialog rendering

4. `src/lib/locales/en/common.json`
   - Added `activity` section with:
     - UI labels (title, loading, no_activity, etc.)
     - Action descriptions for all activity types

## Features Implemented

### Board Activity Feed
- **Access**: Click the Activity button in the board toolbar
- **Content**: Shows all activity across all tasks in the board
- **Sorting**: Most recent activities first
- **Display**:
  - User who performed the action (with avatar)
  - Action type with color-coded icon
  - Task name
  - List context
  - Relative time (e.g., "2 hours ago")
- **Refresh**: Manual refresh button to reload activities
- **Responsive**: Scrollable list with max height

### Activity Item Formatting
- Color-coded icons for different action types:
  - Green: created
  - Blue: completed
  - Red: deleted, removed
  - Purple: assigned
  - Orange: priority changed
  - Gray: other actions
- Human-readable descriptions like "John created 'Fix login bug'"
- List context shown below task name

## Technical Details

### GraphQL Query Structure
```graphql
{
  activity_logs(
    where: {
      todo: {
        list: {
          board_id: { _eq: $boardId }
        }
      }
    }
    order_by: [{ created_at: desc }]
  ) {
    # ... activity fields
  }
}
```

### Permissions
Activity logs are accessible based on board permissions:
- Users can view activities for boards they own or are members of
- Defined in Hasura metadata via relationships

## Next Steps for Full Integration

### Activity Logging Integration (Not Yet Implemented)
To complete the feature, activity logging needs to be integrated into existing mutations:

1. **Todo Store** (`src/lib/stores/todos.svelte.ts`):
   - Add activity logging to `addTodo()` → action: 'created'
   - Add activity logging to `updateTodo()` → action: 'updated'
   - Add activity logging to `deleteTodo()` → action: 'deleted'
   - Add activity logging to `toggleComplete()` → action: 'completed'/'uncompleted'

2. **Comments** (in CardModal or wherever comments are created):
   - Log 'commented' when adding comments
   - Log 'comment_edited' when updating
   - Log 'comment_deleted' when removing

3. **Uploads**:
   - Log 'image_added' when uploading
   - Log 'image_removed' when deleting

4. **Assignments**:
   - Log 'assigned'/'unassigned' when changing assignee

### Example Integration Pattern
```typescript
async function addTodo(...) {
  // Create todo
  const result = await request(CREATE_TODO, ...);

  // Log activity
  if (result.success && result.data) {
    await activityLogStore.createActivityLog({
      todo_id: result.data.id,
      action_type: 'created',
      user_id: currentUserId
    });
  }
}
```

## Testing Notes

### Manual Testing Checklist
- [ ] Open board page
- [ ] Click Activity button in toolbar
- [ ] Verify dialog opens with "No activity yet" message (if no activities exist)
- [ ] Create a todo → verify activity appears after refresh
- [ ] Complete a todo → verify activity appears
- [ ] Add comment → verify activity appears
- [ ] Check activity formatting (icons, colors, descriptions)
- [ ] Test refresh button
- [ ] Test dialog close
- [ ] Verify responsive design on mobile

### Known Limitations
1. **No real-time updates** - Requires manual refresh to see new activities
2. **No pagination** - Loads first 100 activities (can be extended)
3. **No filtering** - Shows all activity types (could add filters)
4. **No activity creation integrated** - Need to add logging to mutations

## Environment Setup Required

To regenerate GraphQL types (`npm run generate`), the following environment variables are needed:
- `API_ENDPOINT_DEV` or `API_ENDPOINT`
- `HASURA_ADMIN_SECRET`
- `PUBLIC_API_ENV`

Create a `.env` file based on `.env.example` before running `npm run generate`.

## Files Structure
```
src/lib/components/activity/
├── BoardActivityButton.svelte     # Activity button component
├── BoardActivityList.svelte       # Activity list renderer
└── BoardActivityView.svelte       # Activity dialog

src/lib/stores/
└── activityLog.svelte.ts         # Extended with board-level queries

src/lib/locales/en/
└── common.json                    # Activity translations added
```

## Status
✅ **UI Implementation Complete**
⚠️ **Activity Logging Integration Pending** - Need to add `createActivityLog` calls to existing mutations
⚠️ **GraphQL Types** - Need to run `npm run generate` with proper environment setup
⚠️ **Testing** - Needs manual and automated testing once logging is integrated

## Summary
The board activity feed UI is fully implemented and ready to display activities. Users can click the Activity button on any board to see a chronological feed of all actions taken on that board's tasks. The next step is to integrate activity logging into the existing todo, comment, and upload mutations to populate the feed with real data.
