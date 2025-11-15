# Board Loading Performance Analysis

## Executive Summary

Current LCP: 6.82s (sometimes), typically 2-3s
**Target: <1.5s consistently**

**Root Cause**: Massive GraphQL payload loading unnecessary data upfront

---

## Current Loading Behavior

### What Loads When Opening a Board

#### 1. Server-Side (Blocking)
- Auth session check only ✅ (minimal)

#### 2. Client Initial Load (Blocking - First Paint)

**Boards Query:**
```graphql
GET_BOARDS {
  id, name, alias, sort_order, github, is_public, settings
  labels { ...LabelFields }  # Full label objects
  user { id, username, email }
  board_members { ...BoardMemberFields }  # Full member objects with user data
}
```
- **Problem**: Loads ALL boards user has access to
- **Problem**: Loads all labels and members for every board
- If user has 20 boards, loads all 20 with nested data

**Initial Todos Query (first 50):**
```graphql
GET_TODOS(limit: 50) {
  id, title, content, due_on, priority, sort_order, completed_at, ...
  assignee { id, name, username, image, email }  # Full user object
  labels { label { ...LabelFields } }  # Full label array
  comments(order_by: {created_at: asc}) { ...CommentFields }  # ALL comments!
  uploads { id, url, created_at }  # ALL uploads
  list {
    id, name, sort_order
    board { id, name, alias, sort_order, github, settings }
  }
}
```

**CRITICAL PROBLEMS:**
1. **Comments loaded for ALL 50 todos** - Even though user likely only opens 1-2 cards
2. **Uploads loaded for ALL 50 todos** - Unnecessary for board view
3. **Full assignee objects** - Only need name/image for avatar
4. **Full label arrays** - Only need color/name for badges
5. **Duplicate board/list objects** for every todo

**Estimated Payload Size:**
- 50 todos × (base + comments + uploads + nested objects) = **~500KB-2MB**
- Most of this data is NOT displayed in the initial board view!

#### 3. Background Load (After 100ms, Non-Blocking)

**Remaining Active Todos (51+):**
- Same massive TODO_FRAGMENT
- Loads in chunks of 100
- Same problems as above, multiplied

**Completed Todos:**
- Up to 100 completed todos
- Same massive fragment
- Often hidden/collapsed in UI

#### 4. On-Demand Loads
- Comments (when card opens) - DUPLICATE of data already loaded ❌
- Activity logs (when viewing)
- Notes (when opening notes)

---

## Performance Bottlenecks (Prioritized by Impact)

### 🔴 CRITICAL - Biggest Wins (50-70% improvement)

#### **1. Massive TODO Fragment**
**Impact**: Loads 10-20x more data than needed for board view

**Current**:
```typescript
TODO_FRAGMENT includes:
- comments array (often 5-20 comments per todo)
- uploads array (often 2-10 files per todo)
- Full assignee object (5 fields)
- Full labels array (3-10 labels)
- Full list + board objects (duplicated across todos)
```

**Solution**: Split into minimal + full fragments
```typescript
TODO_MINIMAL_FRAGMENT: {
  // Only data needed for card display
  id, title, priority, due_on, completed_at, sort_order
  assigned_to  // Just ID, not full object
  label_ids    // Just IDs, not full objects
  comment_count, upload_count  // Counts only
  list_id      // Just ID
}

TODO_FULL_FRAGMENT: {
  // Load only when opening card modal
  All current fields including comments, uploads, etc.
}
```

**Estimated Improvement**: 60-80% reduction in initial payload

---

#### **2. No Local Caching (IndexedDB)**
**Impact**: Every board switch refetches everything

**Current Flow**:
1. User opens Board A → 2s load
2. User switches to Board B → 2s load
3. User switches back to Board A → 2s load again! ❌

**Solution**: Dexie.js (IndexedDB) caching similar to example
```typescript
// Cache structure
boardsCache: {
  board_id: BoardData,
  ttl: 24 hours,
  lru: true (max 50 boards)
}

todosCache: {
  board_id: TodoData[],
  ttl: 24 hours,
  lru: true
}

// Flow:
1. Check IndexedDB first
2. Render cached data instantly (<50ms)
3. Fetch fresh data in background
4. Update if changed
```

**Estimated Improvement**: 90%+ faster on re-opens (instant vs 2s)

---

### 🟡 HIGH IMPACT - Medium Wins (20-40% improvement)

#### **3. Load ALL Boards Upfront**
**Impact**: Unnecessary data loaded

**Current**: Loads all boards user has access to (could be 50+)

**Solution**:
- Load only selected board + last 5 accessed boards
- Lazy load others when board selector opens
- Store recent boards in localStorage

**Estimated Improvement**: 30-50% reduction if user has many boards

---

#### **4. Comments/Uploads Loaded for All Todos**
**Impact**: Massive unused data

**Current**: 50 todos × average 5 comments = 250 comments loaded but not displayed

**Solution**:
- Remove comments/uploads from initial TODO fragment
- Load on-demand when card opens
- Use aggregate queries for counts: `comments_aggregate { count }`

**Estimated Improvement**: 40-60% reduction in payload

---

#### **5. Redundant Board/List Objects**
**Impact**: Duplicate data in payload

**Current**: Every todo includes full board + list objects
- 50 todos of same board = 50 copies of same board data

**Solution**:
- Normalize data: Load boards/lists separately
- Todos only include IDs
- Client-side join in store

**Estimated Improvement**: 10-20% reduction

---

### 🟢 MEDIUM IMPACT - Small Wins (5-15% improvement)

#### **6. Full User Objects for Assignees**
**Impact**: Unnecessary fields

**Current**: Full user object (5 fields) for each assigned todo

**Solution**: Only load name, username, image for avatar display

**Estimated Improvement**: 5-10% reduction

---

#### **7. No Code Splitting for Modals**
**Impact**: Larger initial JS bundle

**Current**: CardModal, ImportDialog, etc loaded upfront

**Solution**:
```typescript
const CardModal = lazy(() => import('./CardModal.svelte'));
```

**Estimated Improvement**: 10-15% faster initial load

---

#### **8. No Virtual Scrolling**
**Impact**: Rendering 100+ DOM nodes

**Current**: All todos rendered, even off-screen

**Solution**: Virtual scrolling for Kanban columns with 50+ cards

**Estimated Improvement**: 20-30% faster rendering with large boards

---

## Improvement Plan (Prioritized)

### Phase 1: Quick Wins (Biggest Impact, Lowest Effort)

**1. Split TODO Fragment** ⭐⭐⭐⭐⭐
- Effort: Medium (2-3 hours)
- Impact: 60-80% payload reduction
- Implementation:
  1. Create `TODO_MINIMAL_FRAGMENT` in documents.ts
  2. Create `GET_TODOS_MINIMAL` query
  3. Update `loadTodosInitial()` to use minimal fragment
  4. Update `loadTodoDetails()` to use full fragment when opening card
  5. Add aggregate queries for counts

**2. Lazy Load Comments/Uploads** ⭐⭐⭐⭐⭐
- Effort: Low (1 hour)
- Impact: 40-60% payload reduction
- Implementation:
  1. Remove `comments` and `uploads` from TODO_FRAGMENT
  2. Add `comments_aggregate { count }` and `uploads_aggregate { count }`
  3. Load comments/uploads only in CardModal when opened
  4. Already have `commentsStore.loadComments(todoId)` ✅

**3. Optimize Board Loading** ⭐⭐⭐⭐
- Effort: Low (1 hour)
- Impact: 30-50% reduction (if many boards)
- Implementation:
  1. Add `recentBoardIds` to localStorage
  2. Load only selected + recent 5 boards initially
  3. Lazy load all boards when board selector clicked

---

### Phase 2: IndexedDB Caching (Biggest UX Win)

**4. Implement Dexie.js Caching** ⭐⭐⭐⭐⭐
- Effort: High (4-6 hours)
- Impact: 90%+ faster re-opens
- Implementation:
  1. Install Dexie.js: `npm install dexie`
  2. Create `src/lib/db/cache.ts`:
     ```typescript
     import Dexie from 'dexie';

     class CacheDB extends Dexie {
       boards: Dexie.Table<CachedBoard, string>;
       todos: Dexie.Table<CachedTodos, string>;

       constructor() {
         super('TodosCache');
         this.version(1).stores({
           boards: 'id, lastAccessed, ttl',
           todos: 'boardId, lastAccessed, ttl'
         });
       }
     }

     export const cacheDB = new CacheDB();
     ```
  3. Update stores to check cache first
  4. Background refresh after cache hit
  5. LRU eviction (keep last 50 boards)
  6. 24-hour TTL

---

### Phase 3: Advanced Optimizations

**5. Normalize Data Structure** ⭐⭐⭐
- Remove duplicate board/list objects from todos
- Separate stores for normalized data

**6. Virtual Scrolling** ⭐⭐⭐
- For boards with 50+ cards per column
- Use `svelte-virtual` or `@tanstack/virtual`

**7. Image Lazy Loading** ⭐⭐
- Lazy load todo upload images
- Use intersection observer

**8. Code Splitting** ⭐⭐
- Lazy load heavy modals
- Dynamic imports for heavy components

---

## Recommended Implementation Order

### **First: Split TODO Fragment** (Implement NOW)

**Why**:
- Biggest single impact (60-80% reduction)
- Low risk, straightforward change
- Foundation for other improvements

**What to change**:

1. **Create minimal fragment** (`src/lib/graphql/documents.ts`):
```typescript
export const TODO_MINIMAL_FRAGMENT = graphql(`
  fragment TodoMinimalFields on todos {
    id
    title
    priority
    due_on
    has_time
    completed_at
    sort_order
    assigned_to  # Just ID
    list_id      # Just ID
    github_issue_number
    github_url
    min_hours
    max_hours
    actual_hours

    # Counts instead of full arrays
    comments_aggregate { aggregate { count } }
    uploads_aggregate { aggregate { count } }
    labels_aggregate { aggregate { count } }

    # Only for display
    assignee {
      id
      name
      username
      image
    }

    # Minimal list info
    list {
      id
      name
      board {
        id
        name
      }
    }
  }
`);

export const TODO_FULL_FRAGMENT = graphql(`
  fragment TodoFullFields on todos {
    ...TodoMinimalFields  # Include minimal

    # Full data only when needed
    content
    created_at
    updated_at
    comment_hours

    labels {
      label {
        ...LabelFields
      }
    }

    comments(order_by: {created_at: asc}, limit: 50) {
      ...CommentFields
    }

    uploads {
      id
      url
      created_at
    }

    list {
      id
      name
      sort_order
      board {
        id
        name
        alias
        sort_order
        github
        settings
      }
    }
  }
`);
```

2. **Update queries**:
```typescript
// For board view
export const GET_TODOS_MINIMAL = graphql(`
  query GetTodosMinimal($where: ..., $order_by: ..., $limit: ..., $offset: ...) {
    todos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      ...TodoMinimalFields
    }
  }
`);

// For card detail view
export const GET_TODO_FULL = graphql(`
  query GetTodoFull($id: uuid!) {
    todos(where: {id: {_eq: $id}}) {
      ...TodoFullFields
    }
  }
`);
```

3. **Update stores** (`src/lib/stores/todos.svelte.ts`):
```typescript
// Use minimal for initial load
async function loadTodosInitial(boardId?: string) {
  const data = await request(GET_TODOS_MINIMAL, { ... });
  // ...
}

// Use full when opening card
async function loadTodoDetails(todoId: string) {
  const data = await request(GET_TODO_FULL, { id: todoId });
  // ...
}
```

**Expected Result**:
- Initial payload: 500KB → 150KB (70% reduction)
- LCP: 2-3s → 1-1.5s
- Board interactive much faster

---

### **Second: IndexedDB Caching**

(After first improvement is working)

---

### **Third: Other Optimizations**

(After caching is in place)

---

## Metrics to Track

**Before**:
- LCP: 6.82s (worst), 2-3s (typical)
- Initial payload: ~500KB-2MB
- Time to interactive: 2-3s
- Re-open same board: 2s

**Target After Phase 1**:
- LCP: <1.5s consistently
- Initial payload: ~150-300KB
- Time to interactive: <1s
- Re-open same board: <1s (with cache)

---

## Implementation Notes

### Testing
- Test with boards containing:
  - 10 todos (small)
  - 50 todos (medium)
  - 200+ todos (large)
- Test with slow 3G network throttling
- Measure with Chrome DevTools Performance tab

### Migration Strategy
- Keep both fragments during transition
- Feature flag for gradual rollout
- Monitor error rates

### Edge Cases
- Offline mode
- Cache invalidation on updates
- Concurrent modifications

---

## Conclusion

**Biggest Win**: Split TODO fragment into minimal/full versions
- **Effort**: 2-3 hours
- **Impact**: 60-80% payload reduction
- **Risk**: Low
- **Implement**: First

**Second Biggest**: IndexedDB caching
- **Effort**: 4-6 hours
- **Impact**: Instant re-opens
- **Risk**: Medium
- **Implement**: Second

**Combined Expected Result**:
- Initial load: 2-3s → <1s
- Re-opens: 2s → <50ms (instant)
- LCP: Consistently <1.5s

---

Generated: 2025-11-15
Status: Ready for implementation
