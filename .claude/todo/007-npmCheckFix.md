## Task: Fix all TypeScript type issues

### Problem
`npm run check` was showing 15 errors and 7 warnings across multiple files.

### Errors Fixed

#### 1. **Test files - Missing required fields** (8 errors)
Files: `todoFiltering.svelte.test.ts`, `todos.svelte.test.ts`

**Issue**: Mock objects missing required fields from GraphQL fragments
- Board mocks missing `alias` field
- Todo mocks missing `labels` and `comments` arrays

**Fix**: Updated all mock objects with required fields:
```typescript
// todoFiltering.svelte.test.ts & todos.svelte.test.ts
const createMockTodo = (overrides: Partial<TodoFieldsFragment> = {}): TodoFieldsFragment => ({
  // ... existing fields
  labels: [],      // Added
  comments: [],    // Added
  __typename: 'todos',
  ...overrides
});

// All board mocks
board: {
  id: 'board1',
  name: 'Main Board',
  alias: 'main-board',  // Added
  sort_order: 1,
  __typename: 'boards'
}
```

#### 2. **Todo update - Missing `priority` field** (1 error)
File: `src/lib/stores/todos.svelte.ts:157`

**Issue**: `updateTodo` function type didn't include `priority` field, but card page was trying to update it

**Fix**: Added `priority` to the Pick type:
```typescript
async function updateTodo(
  id: string,
  updates: Partial<
    Pick<TodoFieldsFragment, 'title' | 'content' | 'completed_at' | 'due_on' | 'sort_order' | 'priority'> & {
      list_id?: string | null;
    }
  >
): Promise<StoreResult> {
```

#### 3. **Missing type declarations** (2 errors)
Files: `src/routes/api/github/+server.ts`, `src/routes/api/invitations/send/+server.ts`

**Issue 1**: Wrong import path for RequestEvent type
```typescript
// Before (incorrect)
import type { RequestEvent } from '../auth/github/$types';

// After (correct)
import type { RequestEvent } from './$types';
```

**Issue 2**: Missing @types/nodemailer package
```bash
npm install --save-dev @types/nodemailer
```

#### 4. **SortableBoardItem - dnd-kit type issues** (3 errors)
File: `src/lib/components/listBoard/SortableBoardItem.svelte`

**Issue**: Incorrect handling of reactive box values from @dnd-kit/svelte

**Fix**: Access `.current` property for reactive boxes:
```typescript
// Line 59-61: Transform handling
const style = $derived(
  transform?.current
    ? `transform: ${CSS.Transform.toString(transform.current)}; transition: ${transition || ''};`
    : ''
);

// Line 78: Attributes and listeners
<button {...attributes.current} {...listeners.current} class="cursor-grab active:cursor-grabbing">

// Line 82: Null check for editingBoard
{#if editingBoard?.id === board.id && editingBoard}
```

### Summary

**Before**: 15 errors, 7 warnings
**After**: 0 errors, 7 warnings ✅

**Warnings remaining**: 7 accessibility warnings in CardLabelManager.svelte (non-blocking)
- Elements with menuitem role needing tabindex
- Click handlers needing keyboard event handlers
- Non-interactive elements with click handlers

These are best-practice warnings, not type errors, and don't prevent the app from building.

### Status
✅ **COMPLETED** - All TypeScript type errors fixed. Project passes `npm run check`.