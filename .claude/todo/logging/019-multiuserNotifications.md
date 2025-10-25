# Multi-User Notifications System

## Original Requirement

1. Assign cards to users who are on the board (by default assign myself if I create)
2. Cards I'm assigned to: when edited, image added, and comment added. But in the full log (on the card), we want to see also the image removed, the comment removed, comment edited. Priority changed.
3. Cards I have commented on, assign me for notifications (if I'm not assigned to the card) when I check a checkbox while adding a comment.

## Analysis

This task requires:
1. **Card Assignment System**: Add `assigned_to` field to todos, allowing assignment to board members
2. **Notification System**: Create notifications table and store for tracking user activity
3. **Activity Logging**: Create activity logs for complete audit trail of card changes
4. **Notification Triggers**: Fire notifications when:
   - Card is assigned to a user
   - Card is edited
   - Image is added/removed
   - Comment is added/edited/removed
   - Priority is changed
   - User who commented should be notified if not already assigned

## Implementation Status

### ✅ COMPLETED

#### Database Layer (3 migrations created)
- Migration 1759599000001: Added `assigned_to` UUID column to todos table
- Migration 1759599000002: Created notifications table with proper schema
- Migration 1759599000003: Created activity_logs table for audit trail

#### Hasura Configuration
- Updated `public_todos.yaml` metadata:
  - Added `assignee` object relationship
  - Added `assigned_to` to all permission columns (insert, select, update)
- Created `public_notifications.yaml` metadata with full CRUD permissions
- Created `public_activity_logs.yaml` metadata for read access
- Updated `tables.yaml` to include new tables

#### GraphQL Layer
- Updated `TODO_FRAGMENT` to include `assigned_to` and `assignee` object with user details
- Added `NOTIFICATION_FRAGMENT` with full notification fields
- Added `GET_NOTIFICATIONS` query with filtering and aggregation
- Added `CREATE_NOTIFICATION` mutation
- Added `UPDATE_NOTIFICATION` mutation
- Added `MARK_NOTIFICATIONS_AS_READ` mutation
- Added `DELETE_NOTIFICATION` mutation
- Added `ACTIVITY_LOG_FRAGMENT` with action tracking
- Added `GET_ACTIVITY_LOGS` query
- Added `CREATE_ACTIVITY_LOG` mutation
- Ran `npm run generate` successfully - all GraphQL types generated

#### Store Layer
- Created `notifications.svelte.ts` store with:
  - `loadNotifications(userId, limit, offset)` - fetch user's notifications
  - `createNotification(notification)` - create new notification
  - `markAsRead(notificationId)` - mark single notification as read
  - `markMultipleAsRead(ids)` - batch mark read with optimistic updates
  - `deleteNotification(notificationId)` - remove notification
  - Unread count tracking
  - Error handling and logging

- Created `activityLog.svelte.ts` store with:
  - `loadActivityLogs(todoId, limit, offset)` - fetch activity for a todo
  - `createActivityLog(log)` - log a user action
  - Error handling and logging

### 🔄 IN PROGRESS / TODO

#### Frontend Integration
- [ ] Update `todos.svelte.ts` store to:
  - Import notification and activity log stores
  - Add `assigned_to` field to type definitions for updateTodo
  - Auto-assign creator when creating todo: `assigned_to: currentUserId`
  - Create notifications on card updates, images, and comments
  - Create activity logs for all mutations

- [ ] Update comment store to:
  - Trigger assignment notification when user comments
  - Trigger notifications to assigned user when comment is added
  - Create activity logs for comment actions

- [ ] Create UI Components:
  - `CardAssignee.svelte` - assignee picker dropdown
  - `NotificationBell.svelte` - bell icon with unread count
  - `NotificationPanel.svelte` - notification list with read/delete
  - `ActivityTimeline.svelte` - activity log display on card detail

#### Application Logic
- [ ] Implement notification creation helpers in todos store
- [ ] Implement activity log helpers for different action types
- [ ] Hook into comment creation to trigger notifications
- [ ] Hook into image upload/delete to trigger notifications
- [ ] Wire assignee changes to create notifications

#### Testing
- [ ] Unit tests for notification store (CRUD operations)
- [ ] Unit tests for activity log store
- [ ] Component tests for UI components
- [ ] E2E tests with Playwright
- [ ] Run `npm run check` - must pass
- [ ] Run `npm test` - must pass

## Changes Made

### Database Migrations
- `hasura/migrations/default/1759599000001_add_assigned_to_todos/` - assignment column
- `hasura/migrations/default/1759599000002_create_notifications/` - notifications table
- `hasura/migrations/default/1759599000003_create_activity_logs/` - audit trail table

### GraphQL
- `src/lib/graphql/documents.ts` - 20+ new operations and fragments added

### Stores
- `src/lib/stores/notifications.svelte.ts` - complete notification management (✅)
- `src/lib/stores/activityLog.svelte.ts` - complete activity logging (✅)
- `src/lib/stores/todos.svelte.ts` - imports updated (🔄 needs integration)

### Hasura Metadata
- `hasura/metadata/databases/default/tables/public_todos.yaml` - updated
- `hasura/metadata/databases/default/tables/public_notifications.yaml` - created
- `hasura/metadata/databases/default/tables/public_activity_logs.yaml` - created
- `hasura/metadata/databases/default/tables/tables.yaml` - updated to include new tables

## Key Database Schema

### notifications table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (recipient),
  todo_id UUID NOT NULL,
  type VARCHAR(50) CHECK (type IN ('assigned', 'commented', 'edited', 'image_added', 'image_removed', 'comment_edited', 'comment_removed', 'priority_changed')),
  triggered_by_user_id UUID (who triggered it),
  related_comment_id UUID (for comment-related notifications),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### activity_logs table
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (who did it),
  todo_id UUID NOT NULL,
  action_type VARCHAR(50) CHECK (...),
  field_name VARCHAR(100) (if updating a field),
  old_value TEXT,
  new_value TEXT,
  changes JSONB (full change object),
  created_at TIMESTAMPTZ
);
```

### todos table updates
- Added `assigned_to UUID REFERENCES users(id)` column
- Allows NULL for unassigned cards

## Next Steps

1. **Create helper functions** in todos store for:
   - Auto-assigning creator: `async assignCreator(todoId, userId)`
   - Creating notifications: `async notifyOnUpdate(todoId, type, triggeredBy, content)`
   - Creating activity logs: `async logActivity(todoId, action, changes, user)`

2. **Hook into mutations**:
   - `addTodo` → assign creator + create assignment notification
   - `updateTodo` → create activity log + notifications for interested users
   - Comments creation → notify assigned users + create assignment notification for commenter

3. **Create UI Components** for assignee selection and notification panel

4. **Test thoroughly** with Playwright and unit tests

## Verification Checklist

- [ ] Database migrations applied: `hasura migrate apply`
- [ ] Metadata reloaded: `hasura metadata reload`
- [ ] GraphQL types generated: `npm run generate` ✅
- [ ] Notification store working with dummy data
- [ ] Activity log store working with dummy data
- [ ] `npm run check` passes
- [ ] `npm test` passes
- [ ] Playwright browser tests pass

## Notes

- All GraphQL operations are properly typed and generated
- Hasura permissions properly configured for RLS
- Notification table is optimized with appropriate indexes
- Activity log table separate from diagnostic logs for audit purposes
- Unread notification count tracking implemented in store
- Optimistic updates implemented with rollback on error
- All stores follow the established factory pattern
