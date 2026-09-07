# Task 130: Add Todo Subscribers Feature

## Original Requirement
It is good that there's a assigned user of a card. Let's leave it like that. The main assignee. But let's make it possible to add optionally other users to the card also and let's call them subscribers. They just will get notifications on cards they are subscribed to.

## Implementation Summary

### ✅ Completed Changes

#### 1. Database Schema
- **Created migration**: `hasura/migrations/default/1732138800000_create_todo_subscribers_table/`
  - `up.sql`: Creates `todo_subscribers` table with composite primary key (todo_id, user_id)
  - Indexes on both todo_id and user_id for performance
  - Foreign keys with CASCADE delete to todos and users tables
  - `down.sql`: Rollback script to drop the table

#### 2. Hasura Metadata
- **Created**: `hasura/metadata/databases/default/tables/public_todo_subscribers.yaml`
  - Permissions for user role (insert, select, update, delete)
  - Object relationships to `subscriber` (user) and `todo`
  - Users can only subscribe to todos they have access to (board members or public boards)
  - Users can only unsubscribe themselves
- **Updated**: `hasura/metadata/databases/default/tables/public_todos.yaml`
  - Added array relationship `subscribers` to todos table
- **Updated**: `hasura/metadata/databases/default/tables/tables.yaml`
  - Added reference to `public_todo_subscribers.yaml`

#### 3. GraphQL Operations (`src/lib/graphql/documents.ts`)
- **Updated TODO_FRAGMENT**: Added `subscribers` field with nested subscriber user data
- **Added mutations**:
  - `SUBSCRIBE_TO_TODO`: Subscribe a user to a todo
  - `UNSUBSCRIBE_FROM_TODO`: Unsubscribe a user from a todo
- **Added queries**:
  - `GET_TODO_SUBSCRIBERS`: Get all subscribers for a specific todo
  - `GET_USER_SUBSCRIPTIONS`: Get all todos a user is subscribed to

#### 4. Store Updates (`src/lib/stores/todos.svelte.ts`)
- **Added imports**: SUBSCRIBE_TO_TODO, UNSUBSCRIBE_FROM_TODO, GET_TODO_SUBSCRIBERS
- **Added methods**:
  - `subscribeToTodo(todoId, userId)`: Subscribe a user with optimistic update
  - `unsubscribeFromTodo(todoId, userId)`: Unsubscribe a user with optimistic update
  - `getTodoSubscribers(todoId)`: Fetch subscribers for a todo
- All methods follow the store pattern with browser guards and error handling

#### 5. UI Components
- **Created**: `src/lib/components/todo/CardSubscribers.svelte`
  - Single bell icon button showing subscriber count
  - Dropdown with full list of board members (excluding assigned user)
  - Checkbox interface to manage multiple subscribers
  - Shows avatars and names for all subscribers
  - Visual indication for currently subscribed users
  - Full multilingual support (EN, ET, CS)
  - Filters out assigned user (they're already notified)
- **Updated**: `src/lib/components/todo/CardDetailView.svelte`
  - Imported CardSubscribers component
  - Added CardSubscribers next to CardAssignee in the UI

#### 6. Multilingual Support
- **Added translations** to `src/lib/locales/en/common.json` (English)
- **Added translations** to `src/lib/locales/et/common.json` (Estonian)
- **Added translations** to `src/lib/locales/cs/common.json` (Czech)
- Translation keys added:
  - `todo.subscribers` - Label for subscribers
  - `todo.manage_subscribers` - Button tooltip
  - `todo.subscribed_success` - Success message for subscribe
  - `todo.unsubscribed_success` - Success message for unsubscribe
  - `todo.no_members_to_subscribe` - Empty state message
  - `todo.you` - Current user indicator
  - `todo.subscribers_count` - Subscriber count message (with plural support)

#### 7. Notification Logic (`src/lib/stores/comments.svelte.ts`)
- **Updated comment creation**:
  - When a comment is added, notifications are sent to:
    1. The assigned user (if different from comment author)
    2. All subscribers (excluding comment author and assigned user to avoid duplicates)
  - Maintains a Set of notified users to prevent duplicate notifications
  - All notifications are non-blocking (errors logged but don't fail the operation)

### Features Implemented
✅ Main assignee remains unchanged
✅ Multiple users can subscribe to a todo
✅ Subscribers receive notifications for comments
✅ Visual UI with bell icon showing subscriber count
✅ Single dropdown for managing all subscribers
✅ Assigned user automatically excluded from subscriber list (already notified)
✅ Full multilingual support (EN, ET, CS)
✅ Prevents duplicate notifications
✅ Proper permissions (board owners/editors can manage subscribers)
✅ Database relationships and constraints

### Technical Details
- **Database**: PostgreSQL with composite primary key ensuring one subscription per user per todo
- **GraphQL**: Type-safe operations with auto-generated TypeScript types
- **UI**: Accessible dropdown with avatar support
- **Notifications**: Integrated with existing notification system
- **Permissions**: Hasura row-level security ensures users can only subscribe to todos in boards they can access

### Next Steps for User
1. Run `npm install` (if dependencies need updating)
2. Start Hasura: `cd hasura && docker-compose up -d`
3. Apply migrations: `cd hasura && hasura migrate apply --all-databases`
4. Apply metadata: `cd hasura && hasura metadata apply`
5. Generate types: `npm run generate`
6. Start dev server: `npm run dev`
7. Test the feature on a todo card

### Testing Recommendations
- Create a board with multiple members
- Open a todo card
- Use the bell icon to subscribe/unsubscribe
- Click the subscriber count to see the dropdown
- Add/remove subscribers from the list
- Add a comment and verify subscribers receive notifications
- Check that duplicate notifications aren't created

### Known Limitations
- Tests not yet written (would need to be added in a future task)
- Type generation skipped in this environment (will work when user runs locally)
- No UI tests for the new component yet