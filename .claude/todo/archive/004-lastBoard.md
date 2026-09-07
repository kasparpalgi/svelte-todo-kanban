## Task: Store and use last opened board from user.settings

### Problem
Need to store the last opened board's alias in `user.settings` JSONB field and use it for redirects on signin and layout instead of always using the top board by sort_order.

### Solution Implemented

#### 1. **Updated `setSelectedBoard` in `listsBoards.svelte.ts`** (lines 353-382)
When user switches boards, now automatically updates `user.settings.lastBoardAlias`:
```typescript
async setSelectedBoard(board: BoardFieldsFragment | null) {
  console.log('[ListsStore] setSelectedBoard called', {
    boardAlias: board?.alias,
    boardId: board?.id
  });

  state.selectedBoard = board;
  if (browser) {
    if (board) {
      localStorage.setItem('selectedBoardId', board.id);

      // Update user.settings.lastBoardAlias
      const { userStore } = await import('./user.svelte');
      const user = userStore.user;
      if (user?.id && board.alias) {
        console.log('[ListsStore] Updating user.settings.lastBoardAlias', {
          userId: user.id,
          boardAlias: board.alias
        });

        const currentSettings = user.settings || {};
        await userStore.updateUser(user.id, {
          settings: { ...currentSettings, lastBoardAlias: board.alias }
        });
      }
    } else {
      localStorage.removeItem('selectedBoardId');
    }
  }
}
```

#### 2. **Updated `loadBoards` in `listsBoards.svelte.ts`** (lines 66-129)
Now restores selected board with priority order:
1. First try `user.settings.lastBoardAlias` (from database)
2. Fallback to `localStorage.selectedBoardId`
3. Fallback to first board by sort_order

Added comprehensive logging:
```typescript
console.log('[ListsStore] loadBoards - restoring selected board', {
  lastBoardAlias,
  totalBoards: state.boards.length
});
```

#### 3. **Updated `getTopBoardPath` in `+layout.server.ts`** (lines 23-94)
Now checks for last opened board before falling back to top board:
```typescript

const lastBoardAlias = session?.user?.settings?.lastBoardAlias;
console.log('[Layout] Last board alias from settings:', lastBoardAlias);

if (lastBoardAlias) {
  // Try to find the board with this alias
  const dataByAlias: GetBoardsQuery = await request(
    GET_BOARDS,
    {
      where: { alias: { _eq: lastBoardAlias } },
      limit: 1
    },
    session
  );

  // ... redirect to found board
}

// Fallback: Get the top board by sort order
// ... existing logic
```

#### 4. **Updated `getTopBoardPath` in `signin/+page.server.ts`** (lines 8-82)
Same logic as layout - checks `lastBoardAlias` first, then falls back to top board.

### Console Logging Added

All debug logging uses prefixes for easy filtering:
- `[ListsStore]` - for listsBoards.svelte.ts
- `[Layout]` - for +layout.server.ts
- `[Signin]` - for signin/+page.server.ts

Example logs:
```
[ListsStore] setSelectedBoard called
[ListsStore] Updating user.settings.lastBoardAlias
[ListsStore] loadBoards - restoring selected board
[Layout] === GETTING TOP BOARD ===
[Layout] Last board alias from settings: my-board
[Layout] Found last opened board
[Layout] ✓ Redirecting to last opened board: /en/username/my-board
```

### Flow

1. **User switches board** → `setSelectedBoard()` called → Updates both localStorage AND `user.settings.lastBoardAlias` in DB
2. **User signs in** → `signin/+page.server.ts` checks `session.user.settings.lastBoardAlias` → Redirects to that board if exists → Falls back to top board
3. **User visits `/`** → `+layout.server.ts` checks `session.user.settings.lastBoardAlias` → Redirects to that board if exists → Falls back to top board
4. **App loads boards** → `loadBoards()` restores selected board from `user.settings.lastBoardAlias` → Falls back to localStorage → Falls back to first board

### Database Field
Uses existing `users.settings` JSONB column to store:
```json
{
  "lastBoardAlias": "my-board-alias",
  "viewMode": "kanban",
  // ... other settings
}
```

### Type Check Results
Type check shows 15 pre-existing errors in test files (missing `alias` field in mocks) and one component (missing `priority` field). These are unrelated to this implementation.

### Status
✅ **COMPLETED** - All functionality implemented with comprehensive logging for debugging.