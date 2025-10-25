# Notification Visibility Fix - Polling & Refresh

## Problem

Notifications were being created successfully in the database, but users couldn't see them in the notification bell dropdown.

### Root Cause

The notification store loaded notifications on component mount, but:

1. **When a notification is created for User B**:
   - User A creates the notification in the mutation
   - GraphQL returns the notification object to User A
   - User A's local store tries to add it, but User A isn't the recipient
   - The notification filters to User A because of RLS (Row-Level Security)

2. **User B doesn't see it until they**:
   - Manually refresh the page
   - Or wait for periodic polling (which didn't exist)
   - Or click the bell (which would need to reload)

## Solution

Added two mechanisms to keep notifications fresh:

### 1. **Load on Bell Open**

When the user clicks the notification bell, reload notifications:

```typescript
$effect(() => {
  if (isOpen && user?.id) {
    notificationStore.loadNotifications(user.id);
  }
});
```

This ensures:
- ✅ Fresh data when bell is clicked
- ✅ New notifications appear immediately
- ✅ No delay waiting for polling interval

### 2. **Periodic Polling**

Poll for new notifications every 30 seconds:

```typescript
onMount(() => {
  if (user?.id) {
    notificationStore.loadNotifications(user.id);

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      if (user?.id) {
        notificationStore.loadNotifications(user.id);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }
});
```

This ensures:
- ✅ Notifications appear within ~30 seconds even if bell isn't clicked
- ✅ Badge count updates automatically
- ✅ Cleanup prevents memory leaks
- ✅ Non-intrusive background polling

## How It Works Now

### Notification Creation Flow

```
User A: Assigns card to User B
  ↓
GraphQL Mutation: CreateNotification
  ↓
Database: Notification inserted
  ↓
(30s later) or (User B clicks bell)
  ↓
Poll/Refresh: loadNotifications(user_id)
  ↓
GraphQL Query: GET_NOTIFICATIONS where user_id = User B
  ↓
RLS Filter: Only shows notifications for User B
  ↓
Store Update: notificationStore.notifications = [new notification]
  ↓
UI Update: Badge shows count, notification appears in dropdown
  ↓
User B sees: 💬 "User A commented: test..."
```

## Performance Considerations

**Polling Interval: 30 seconds**

- ✅ Good balance between freshness and server load
- ✅ Not too frequent (not every second = excessive requests)
- ✅ Not too infrequent (30 seconds = acceptable delay)
- ✅ Can be adjusted based on needs

**Can be customized:**

```typescript
const POLL_INTERVAL_MS = 30000; // Currently 30 seconds

// Adjust to:
// 10000 = 10 seconds (more fresh, more requests)
// 60000 = 1 minute (less fresh, fewer requests)
```

**Network Impact:**

- Each poll sends 1 GraphQL query
- Query is lightweight (just fetches notification list)
- Database has indexes on notifications(user_id) for fast filtering
- Only fetches when component is mounted

## Row-Level Security (RLS) Explanation

The reason polling is needed:

### Insert RLS
```yaml
check: {}  # Anyone can create
columns: [user_id, ...]
```
Allows User A to create notification with `user_id = User B`

### Select RLS
```yaml
filter:
  user_id:
    _eq: X-Hasura-User-Id
```
User B can only see notifications where `user_id = User B`

### Why This Design

✅ User A can notify User B
✅ User B sees only their own notifications
✅ Prevents users from seeing others' notifications
✅ Prevents users from reading others' notifications

## Commits

- `d441c40` - feat: Add notification refresh on bell open and periodic polling every 30 seconds
- `7ea5cf5` - fix: Remove async from onMount to fix TypeScript type error

## Testing Instructions

1. **Assign a card** to User B
2. **Switch to User B's account**
3. **Two ways to see notification**:
   - **Instant**: Click bell icon → notification appears
   - **Delayed**: Wait up to 30 seconds → badge updates, notification appears
4. **Add comment** on User B's card as User A
5. **See notification** appear in dropdown

## Future Improvements

For real-time notifications without polling:

1. **GraphQL Subscriptions**:
   - Replace polling with WebSocket subscriptions
   - Instant updates when notifications created
   - No unnecessary polling

2. **Server Sent Events (SSE)**:
   - Browser connects to server
   - Server pushes notifications
   - More efficient than polling

3. **Service Workers + Background Sync**:
   - Show notifications even when tab closed
   - Native browser notifications
   - Better user experience

## Summary

✅ Notifications now visible on bell click
✅ Automatic polling every 30 seconds
✅ Badge count updates regularly
✅ Non-blocking, background operation
✅ Type safe, clean implementation
✅ Ready for production
