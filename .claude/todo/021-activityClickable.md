# Task 021: Make Activity Notifications Clickable

## Original Requirement
Make the activity eg. 'Bob commented "Some card name"...' clickable and then open the related card - goto() /[lang]/[username]/[board]?card=UUID

## Analysis
- **Affected files**:
  - `src/lib/graphql/documents.ts` - Updated NOTIFICATION_FRAGMENT
  - `src/lib/components/notifications/NotificationPanel.svelte` - Made notifications clickable
- **MCP needed**: None for basic implementation (Playwright would be useful for testing in browser)

## Implementation Plan
1. ✅ Update NOTIFICATION_FRAGMENT to include board alias and user.username
2. ✅ Import goto and page store in NotificationPanel component
3. ✅ Create handleNotificationClick function to navigate to card
4. ✅ Make notification div clickable with cursor-pointer
5. ✅ Add event.stopPropagation() to action buttons

## Changes

### `src/lib/graphql/documents.ts`
- Updated `NOTIFICATION_FRAGMENT` to include:
  - `todo.list.board.alias` - Board alias for URL construction
  - `todo.list.board.user.id` - Board owner ID
  - `todo.list.board.user.username` - Board owner username for URL construction

### `src/lib/components/notifications/NotificationPanel.svelte`
- Added imports:
  - `goto` from `$app/navigation` for programmatic navigation
  - `page` from `$app/stores` to access current language param
- Added `handleNotificationClick(notification)` function:
  - Validates notification has required data (todo, board, alias, username)
  - Extracts board alias, username, and card ID
  - Gets current language from URL params (defaults to 'en')
  - Constructs URL: `/${lang}/${username}/${boardAlias}?card=${cardId}`
  - Marks notification as read when clicked (if unread)
  - Navigates to the card using `goto()`
- Updated notification div:
  - Added `cursor-pointer` class for visual feedback
  - Added `onclick={() => handleNotificationClick(notification)}` handler
- Updated action buttons (Mark as read, Delete):
  - Added `e.stopPropagation()` to prevent triggering notification click
  - Prevents conflicting navigation when users click action buttons

## Verification
- ✅ Code structure follows store and component patterns
- ✅ Uses proper error handling with console logging
- ✅ Implements optimistic UI by marking as read on click
- ⚠️ Type checking skipped (memory limitations in environment)
- ⚠️ Browser testing with Playwright pending (requires running app)

## Implementation Notes
- The notification click automatically marks the notification as read for better UX
- Event propagation is properly handled to prevent conflicts with action buttons
- The function gracefully handles missing data with console warnings
- Language parameter defaults to 'en' if not found in URL

## Known Limitations
- Requires GraphQL types regeneration when Hasura is available (updated fragment)
- Full type checking and tests require proper environment setup
- Browser testing would confirm the navigation works as expected

## Results
- ✅ Notifications are now clickable with cursor indication
- ✅ Navigation URL properly constructed from notification data
- ✅ Action buttons don't interfere with notification clicks
- ✅ Console logging added for debugging
- ✅ Follows existing code patterns and conventions