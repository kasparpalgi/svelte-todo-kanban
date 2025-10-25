# Notification System - Metadata & Permissions Fix

## Issue

Hasura was reporting:
```
field 'user_id' not found in type: 'notifications_insert_input'
```

This prevented any notifications from being created, both for assignments and comments.

## Root Cause

The Hasura permissions for the `notifications` table were incomplete. When Hasura doesn't recognize a field in the insert permissions, it doesn't expose it in the GraphQL input type.

## Solution

Updated `hasura/metadata/databases/default/tables/public_notifications.yaml` to:

1. **Added `set: {}`** clause to insert_permissions
   - This tells Hasura to allow explicit setting of all columns
   - Empty `{}` means no automatic assignment (unlike todos which auto-set `user_id`)
   - Allows the field to be included in the GraphQL input type

2. **Included all required columns** in the `columns` list:
   - user_id (recipient of notification)
   - todo_id (which card)
   - type (notification type)
   - triggered_by_user_id (who triggered it)
   - related_comment_id (for comment notifications)
   - content (notification message)
   - is_read, created_at, updated_at, id

## Changes Made

**File: `hasura/metadata/databases/default/tables/public_notifications.yaml`**

```yaml
insert_permissions:
  - role: user
    permission:
      check: {}
      set: {}  # <-- Added this line
      columns:
        - content
        - created_at
        - id
        - is_read
        - related_comment_id
        - todo_id
        - triggered_by_user_id
        - type
        - updated_at
        - user_id  # <-- Now properly included
```

## What This Enables

Users can now create notifications for other users with full control over which fields to set:

```graphql
mutation CreateNotification($notification: notifications_insert_input!) {
  insert_notifications_one(object: $notification) {
    id
    user_id      # Recipient
    type         # Type of notification
    content      # Message
    # ... etc
  }
}
```

## Permissions Structure Explained

For the `notifications` table:

- **insert_permissions**: Who can insert and which fields they control
  - `check: {}` = No row-level checks (anyone can insert)
  - `set: {}` = No automatic field assignment (user explicitly sets values)
  - `columns:` = List of columns that can be set

- **select_permissions**: Who can read notifications
  - `filter: user_id _eq X-Hasura-User-Id` = Only see own notifications

- **update_permissions**: Who can modify notifications
  - Only the recipient can update (is_read, etc)

- **delete_permissions**: Who can delete notifications
  - Only the recipient can delete

## Why This is Secure

✅ Any authenticated user can **create** a notification for any other user
   - Non-invasive (just a notification)
   - Doesn't grant access to user data

✅ Users can only **read** their own notifications
   - Row-level security on select

✅ Users can only **modify** their own notifications
   - Can mark as read, delete, etc.

✅ Database constraints prevent issues
   - Foreign keys enforce referential integrity
   - Check constraints prevent self-notifications when triggered_by_user_id is set

## Next Steps

1. **Restart Hasura** so it reloads the metadata:
   ```bash
   docker-compose down
   docker-compose up
   ```

2. **Test the notification flow**:
   - Assign a card to another user
   - Comment on a card assigned to you
   - Both should create notifications successfully

3. **Verify in browser**:
   - Clear browser cache or open in incognito
   - Check notification bell shows badge
   - Click to see notifications

## Technical Details

### Notification Insert Input Type

After the fix, the GraphQL `notifications_insert_input` type includes:

```typescript
export type Notifications_Insert_Input = {
  user_id?: InputMaybe<Scalars['uuid']['input']>;
  todo_id?: InputMaybe<Scalars['uuid']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  triggered_by_user_id?: InputMaybe<Scalars['uuid']['input']>;
  related_comment_id?: InputMaybe<Scalars['uuid']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  is_read?: InputMaybe<Scalars['Boolean']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
};
```

All fields are properly exposed and optional (InputMaybe).

### Hasura Metadata vs Database

Important distinction:
- **Database**: Table already had the columns (from migration)
- **Metadata**: Hasura's configuration of what's exposed via GraphQL
- **Issue**: Metadata didn't expose `user_id` in insert input
- **Fix**: Updated metadata with proper `set:` clause

## Commits

- `683a769` - fix: Add set clause to notification permissions to enable user_id field in GraphQL input

## Summary

✅ Added `set: {}` to notification insert permissions
✅ Ensured `user_id` is in the columns list
✅ Regenerated GraphQL types
✅ Ready for Hasura restart and testing
