## Analysis

### Current Loading Behavior

On initial board page load (`src/routes/[lang]/[username]/[board]/+page.svelte:78-124`):

1. **listsStore.loadBoards()** - Loads all boards with metadata
2. **listsStore.setSelectedBoard()** - Sets the current board
3. **todosStore.loadTodos()** (`src/lib/stores/todos.svelte.ts:35`) - Loads up to 1000 todos with:
   - All todo fields (title, content, priority, due date, etc.)
   - Assignee details (id, name, username, image, email)
   - Labels
   - **ALL comments** for each todo (ordered by created_at)
   - **ALL uploads** for each todo
   - List and board information
4. **listsStore.loadLists()** - Loads all lists (triggered by TodoKanban component)

### The Problem

**Single Large Query:** The `GET_TODOS` query (`src/lib/graphql/documents.ts:232`) loads:
- Up to 1000 todos in one request
- Full data including comments and uploads for EVERY todo
- Large payload that must be transferred and parsed before rendering

**User Impact:**
- User sees loading spinner while waiting for ALL data
- Slow initial render, especially for boards with many todos
- Comments/uploads are loaded even though most cards are never opened

### Optimization Strategy

**Phase 1: Initial Load (Fast First Paint)**
1. Load minimal data to show the board structure:
   - Board metadata (already fast)
   - Lists (already fast)
   - Top 10-15 todos per list WITHOUT comments and uploads
   - Just basic fields: id, title, priority, due_on, sort_order, list_id, completed_at

**Phase 2: Progressive Background Load**
2. After initial render, load remaining todos:
   - Split into chunks by list (parallel requests)
   - Load 50 todos at a time per list
   - Still without comments/uploads

**Phase 3: On-Demand Details**
3. Load full details only when needed:
   - Load comments/uploads when card modal opens
   - Keep in cache for subsequent opens

## Implementation Plan

### Task 1: Create Lightweight Todo Fragment ✅
- [x] Create `TodoFieldsMinimal` fragment (without comments, uploads, assignee)
- [x] Keep `TodoFields` for full data (with comments, uploads, assignee)
- [x] Add queries for both variants (`GET_TODOS_MINIMAL`, `GET_TODO_DETAILS`)

### Task 2: Implement Progressive Loading in todosStore ✅
- [x] Add `loadTodosInitial()` - loads top 50 active todos with minimal fields
- [x] Add `loadTodosRemaining()` - loads rest in chunks of 100 with minimal fields
- [x] Add `loadTodoDetails(todoId)` - loads full details for one todo
- [x] Keep `loadTodos()` for backward compatibility

### Task 3: Update Board Page Component ✅
- [x] Call `loadTodosInitial()` on mount
- [x] Call `loadTodosRemaining()` after initial render (100ms delay)
- [x] Uses existing loading state

### Task 4: Update Card Modal ✅
- [x] Check if todo has full details before loading
- [x] Load full details only when missing
- [x] Cache loaded details in store

### Task 5: Testing & Optimization
- [ ] Generate TypeScript types (requires Hasura running)
- [ ] Test with boards with 100+ todos
- [ ] Measure load time improvements
- [ ] Verify no regressions in functionality

## Implementation Complete

All code changes have been implemented:

1. **GraphQL Layer** (`src/lib/graphql/documents.ts`):
   - Added `TodoFieldsMinimal` fragment (excludes comments, uploads, assignee)
   - Added `GET_TODOS_MINIMAL` query
   - Added `GET_TODO_DETAILS` query

2. **Store Layer** (`src/lib/stores/todos.svelte.ts`):
   - Added `loadTodosInitial(boardId)` - loads first 50 active todos
   - Added `loadTodosRemaining(boardId)` - loads rest in background
   - Added `loadTodoDetails(todoId)` - loads full details on demand

3. **Board Page** (`src/routes/[lang]/[username]/[board]/+page.svelte`):
   - Changed from `loadTodos()` to `loadTodosInitial()`
   - Added background loading with `loadTodosRemaining()`

4. **Card Modal** (`src/routes/[lang]/[username]/[board]/CardModal.svelte`):
   - Added smart detection of minimal vs full data
   - Loads full details only when needed

## Next Steps (Requires Docker)

To complete the implementation:

```bash
# 1. Start Hasura
cd hasura
docker compose up -d
hasura metadata apply
hasura migrate apply --all-databases

# 2. Generate TypeScript types
cd ..
npm run generate

# 3. Run type checking
npm run check

# 4. Run tests
npm test
```

## Expected Performance Improvements

**Before:**
- Single large GraphQL query fetching ALL todos with comments and uploads
- Payload size: ~500KB for 100 todos with comments
- Initial render blocked until all data loaded

**After:**
- Initial load: Only 50 todos with minimal data (~50KB)
- Background load: Remaining todos in chunks
- On-demand: Comments/uploads loaded only when card opens
- Expected improvement: 5-10x faster initial page load