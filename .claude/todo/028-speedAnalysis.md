I am already not loading everything at once when I open a board @file src/routes/[lang]/[username]/[board]/+page.svelte and I improved the loading speed but I still get Largest Contentful Paint (LCP) 6.82s sometimes. At most cases below 3s and often under 2s that I didn't have before downloadig content of the pages in multiple parts.

But now deep analyse again EVERYTHING that is loaded when I open the board and write here what is loaded initially and what later and what could be improved further. 

Create todo list what could be improved so that in the top is are the biggest wins and we move down to smaller wins. 

After that implement the first biggest win.

----

Here's also an example of how I have done speed improvement in another app but it is your analyse decision in how high to put or if to put into list this approach. From that app's README:

### Local caching for fast re-opening

The application caches the last ~200 properties, purchases, and property owners locally using **Dexie.js (IndexedDB)** with a 24-hour TTL. When you re-open a cached item, it loads instantly from IndexedDB while silently refreshing from the server in the background. The cache uses LRU (Least Recently Used) eviction when the 300-item limit is reached.

**Recent items tracking**: The last 10 accessed properties and purchases are stored in localStorage for quick access lists.

### Multi-part purchase loading

To improve load speed, purchases are loaded in multiple parts:

1. **Core data first**: Essential purchase info loads immediately (makes page interactive fast)
2. **Sections in parallel**: Comments, tasks, related properties, user access, and property owners load simultaneously in the background without blocking the UI
3. **Cache update**: Complete data is cached to IndexedDB for instant future access

This approach ensures the page is interactive within milliseconds while heavy data loads progressively.

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

Lighthouse:

{
  "lighthouseVersion": "12.8.2",
  "requestedUrl": "https://www.todzz.eu/et/kaspar/perroz",
  "mainDocumentUrl": "https://www.todzz.eu/et/kaspar/perroz",
  "finalDisplayedUrl": "https://www.todzz.eu/et/kaspar/perroz",
  "finalUrl": "https://www.todzz.eu/et/kaspar/perroz",
  "fetchTime": "2025-11-15T21:32:47.515Z",
  "gatherMode": "navigation",
  "runWarnings": [],
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  "environment": {
    "networkUserAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "hostUserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "benchmarkIndex": 2682.5,
    "credits": {}
  },
  "audits": {
    "viewport": {
      "id": "viewport",
      "title": "Has a `<meta name=\"viewport\">` tag with `width` or `initial-scale`",
      "description": "A `<meta name=\"viewport\">` not only optimizes your app for mobile screen sizes, but also prevents [a 300 millisecond delay to user input](https://developer.chrome.com/blog/300ms-tap-delay-gone-away/). [Learn more about using the viewport meta tag](https://developer.chrome.com/docs/lighthouse/pwa/viewport/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "warnings": [],
      "metricSavings": {
        "INP": 0
      },
      "details": {
        "type": "debugdata",
        "viewportContent": "width=device-width, initial-scale=1"
      },
      "guidanceLevel": 3
    },
    "first-contentful-paint": {
      "id": "first-contentful-paint",
      "title": "First Contentful Paint",
      "description": "First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).",
      "score": 0.98,
      "scoreDisplayMode": "numeric",
      "numericValue": 642.4782,
      "numericUnit": "millisecond",
      "displayValue": "0.6 s",
      "scoringOptions": {
        "p10": 934,
        "median": 1600
      }
    },
    "largest-contentful-paint": {
      "id": "largest-contentful-paint",
      "title": "Largest Contentful Paint",
      "description": "Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)",
      "score": 0.89,
      "scoreDisplayMode": "numeric",
      "numericValue": 1212.4782,
      "numericUnit": "millisecond",
      "displayValue": "1.2 s",
      "scoringOptions": {
        "p10": 1200,
        "median": 2400
      }
    },
    "first-meaningful-paint": {
      "id": "first-meaningful-paint",
      "title": "First Meaningful Paint",
      "description": "First Meaningful Paint measures when the primary content of a page is visible. [Learn more about the First Meaningful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-meaningful-paint/).",
      "score": null,
      "scoreDisplayMode": "notApplicable"
    },
    "speed-index": {
      "id": "speed-index",
      "title": "Speed Index",
      "description": "Speed Index shows how quickly the contents of a page are visibly populated. [Learn more about the Speed Index metric](https://developer.chrome.com/docs/lighthouse/performance/speed-index/).",
      "score": 0.85,
      "scoreDisplayMode": "numeric",
      "numericValue": 1439.432639162748,
      "numericUnit": "millisecond",
      "displayValue": "1.4 s",
      "scoringOptions": {
        "p10": 1311,
        "median": 2300
      }
    },
    "screenshot-thumbnails": {
      "id": "screenshot-thumbnails",
      "title": "Screenshot Thumbnails",
      "description": "This is what the load of your site looked like.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "filmstrip",
        "scale": 3000,
        "items": [
          {
            "timing": 375,
            "timestamp": 60259828613,
            "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAH0AdYDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k="
          },
          {
            "timing": 750,
            "timestamp": 60260203613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k="
          },
          {
            "timing": 1125,
            "timestamp": 60260578613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k="
          },
          {
            "timing": 1500,
            "timestamp": 60260953613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//Z"
          },
          {
            "timing": 1875,
            "timestamp": 60261328613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//2Q=="
          },
          {
            "timing": 2250,
            "timestamp": 60261703613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//Z"
          },
          {
            "timing": 2625,
            "timestamp": 60262078613,
            "data": "data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Z"
          },
          {
            "timing": 3000,
            "timestamp": 60262453613,
            "data": "data:image/jpeg;base64,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eGei3b7S4yz/AIXp8Doa+asw+Ocztkkvd8lstwTqWgXDfvONzcBseweOUWGsqqTEJNyyolZK2V8ZfG0timYMwHOGsoIcA4gtBym1lyTnF1rnQCw+A6l4vTD44wx0pnlqm2/20xamxfE4n0LXCngjMTSWBgcDI99wwE5Rz7WueC1WHn6/8P8Amaqq9Y9zHBzTYhejLqcLrqeDBp4pDCZ2TtmZFPGXslGRzSNOkXB1sFFtNjBxzEhVmlhprRMiyx8XZRbM49Lj1/YtDyl3sM/b5pyl3sM/b5qUJ5fV5fsHiFFhf+YU/wB8KKWZ0gANg3jYKXC/8wp/vhTPjI+v+mb1PC/xH+ARPTN6nhf4j/AIuJp8U30XW/ujzTfRdb+6PNVEXei3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmrWFSRuxGnDS++ccR/dapXcF/zWm++s58ZH2n0zep4X+I/wAAiemb1PC/xH+ARcSvhKIi70WIqOqmjD4qad7Dwc2MkdqgILSQQQRoQV+o/R1WVtB6DtkKih2kw7Z6NmJyGpnrnNDZYRJKXRtDgQXGwNtOB1WG02w2yu3+IVm2UMlfNQ1lUykjbh81PSh2QZZJ3GfQ6g6DU5b6308+pvulvy8i+81noo2MwLBd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EREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAV3Bf81pvvqkruC/5rTffWc+Mj7T6ZvU8L/Ef4BE9M3qeF/iP8Ai4lfCURF3oIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgK7gv+a0331SV3Bf8ANab76znxkfafTN6nhf4j/AInpm9Twv8AEf4BFxK+EoiLvRJDHvHht7DiT1BWt1F7sfmSo6DjP+H/ADNUygx3UXux2nzTdRe7HafNdTs5sfU4/QNqaPEMPY91UykEEu9D948Oc3URloFmONy6wA1srUWwdRJh/wDiLcawgYYcoZWEziNzi8sy23WYEEa3aBYg3UscZuovdjtPmm6i92O0+a6/FNg8UwuKrbWz0TK+lhdUzUAkcZmxNfkL7huS19bZr21suSS7GO6i92O0+abqL3Y7T5rJFRjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayV+PCa2TD31jKaYwNIGYRusQQ45gbWsMup+IQa7dRe7HafNN1F7sdp81kiDHdRe7HafNRzQtyF0YykcRxuFMs2cJPw3/AMJQaxT08Qfdz75R1dJUCuUv1HzHwCoy3UXux2nzTdRe7HafNZLppdhsfEcMtNQyVkMsEdRvKdpc1ofG2QAkgahrgT0DrWbHL7qL3Y7T5puovdjtPmugGx+0RaCMGriDIYtIibODnMIPVZzHD7QVnS7G49UVBh5BJC8CQ3mIYDkiErgCePMLTp0OHWlwOc3UXux2nzTdRe7HafNZIqMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWS9AubDigw3UXux2nzTdRe7HafNbCtwqtooIZqmmmjjlbmu6Nwy84ixuOPNv9hVFBjuovdjtPmm6i92O0+ayRBWqIgwB7L5SbEdRUCuVXq/zjwKpqidkbWx5pWk5xzLHTpFyvczOZ+hZzeOrud9uvghtuorOLuabg/6ecdP9/wA1iBcgIMszOf8AoWc7hq7m/Zr4pmZdn6FnN46u5326+C6L/hKqlrcQpqOQTPpKt1NcgND8ocbgXJvzeAB+3RVJNmsSjkw5r4mj/EL7gk2DrAE8fvDXhqpcJcNRdnO/Qs14au5v2a+KZmXadzHpxF3c77dfBbqPZbE3xwSBsIbMwSMLpABYiI6k8Prmft6lNh+y09TW4lSTymKeiYHua1ly65GmpbbilwXDn7ss4bpmvA3dzfs18V7mjzNO4jsOIu7X7dVuMS2bqsOwySrq5YWlr4miMEkuEgeQQbWI5h6bLSIDy3I4CNoJNwbnT4cVPgv+a0331Wf9FWcF/wA1pvvqZ8ZV9p9M3qeF/iP8Aiemb1PC/wAR/gEXEr4SiIu9Fqg4z/h/zNUyhoOM/wCH/M1TKDaYRj+JYQyNuHVG5DKqOsbZjTaWMODTqOFnuFuBvqFtG7dY22MRNdQCmAaBT8gg3Is4vBEeTLfMSb2106gtEylacOfUukLHB+RjC0WeemxvfTp06utbqXZOoa1xFTAwsc9r3TuEbG5XmMnMT7QsPt6FJpLhHWbY45W0U1NV1bZt9GYZJ3wsM74y/OWGW2ctzdF/hw0XPLes2ZrHwulbLTZAASS5wBFgS4G1nAXAJF+IWUey1Y9ofv6Nsepc98uVrG5ntDiSOBMbrdPC4CbFw0CK7i1D/h9UyHfRzF0McpLL2Gdgdb42vxGipKqIiICIiAiIgIiIClbM9tO+AEbt72vIt0tBA/iKiRAREQFmzhJ+G/8AhKwWbOEn4b/4Sg1iuUv1HzHwCpq5S/UfMfAIJF0R2zxw0kdMaxu5jhNO1u6ZowxNiIvb2GNF/hfiudW9otn31cD5I5JA5lO+d0Ziu4WZmaLAnR1nWJtoAbagGTXdG6qfSTjj4qbkz4YJxHI2qlMMbzUufPLK64LdG/piMnDS/wABq37aY5JU00z6mIuphIIm8njyNa+FsDm5ctrGNjW2t0X4klQ4ds9LX0okgltIWtcGuaA0lz8oGa/2km2ll43ZqqeTuqmjlGR7w6KUvacvRmAsHG+jSb9drhTYuGjRb47L1vKNwySmfKSGta155zszwWi44jdvvfTTjqFVxXCf8OpoZTV01QZJHx2gcXAZQ03zWsfp/lZWy2rREVUREQEREBERAREQSyzPlZCx5GWJmRunRmLvFxUSIgIiII6r1f5x4FU1cqvV/nHgVTQWXX3UF2gDIbHr5x1/+dSwXptuorOJOU3B6Dc6D/50rxUXzjWKGQyHEq0vJDi7fvvcG4N78brCTFcRllgllr6t8kDs0T3TOJjOmrTfQ6Dh1BU0UobA43ipaQcTriHWuDUP1tlt0/8AY3ujqChbiVc2WSVtbUtlkaGveJXAuAFgCb6gABVUShamxKunhdFPW1MkTrZmPlcWmxJFwT0Fzj+Z61VRFRi/6Ks4L/mtN99Vn/RVnBf81pvvrOfGR9p9M3qeF/iP8Aiemb1PC/xH+ARcSvhKIi70WqDjP+H/ADNUyhoOM/4f8zVMoJxVVApTTCeUUxOYxZzkJ67cLqU4nXmUSmuqt40ZQ/euuB1XuqaILb8RrZGOY+sqXMdbM0yuINhYX16tFjFXVcT2uiqp2Ob9EtkII48O87tPWqyIJJZpJsu9ke/K3K3M4mw6h8FGiICIiAiIgIiICIiAiIgIiICzZwk/Df8AwlYLNnCT8N/8JQaxXKX6j5j4BU1cpfqPmPgEEisS1tVKyNstTO9sTSxgdISGNIsQOoW0sq6ILDa2qbEyJtTOImG7GCQ2brfQdGuqkdimIPN3V1W42cNZnHQ6kcemwv8AYqaKCY1M5NzPLfXXOem9/wCI9p617UVdTU35TUTTXdmO8eXXNgL69NgB+SgRUEREBERAREQEREBERAREQEREEdV6v848CqauVXq/zjwKpoLL77mC4AGQ2t0jMVgvTl3cWVxJym4PQbnTwXioIiICIiAiIgxf9FWcF/zWm++qz/oqzgxDcTpyTYB1yVnPjI+0+mb1PC/xH+ARR+mKeKSlwpscrHkue8BrgeaQLH7EXEr4aiIu9Fqg4z/h/wAzVMoaDjP+H/M1TKApNzJ7t/dKXLGC2hdrf4KNBJuZfdv7pTcy+7f3So0QSbmX3b+6U3Mvu390qNEEm5l92/ulNzL7t/dKjRBJuZfdv7pTcy+7f3So0QSbmX3b+6U3Mvu390qNEEm5l92/ulNzL7t/dKjRBJuZfdv7pTcy+7f3So0QSbmX3b+6Vi5jmfSaW/aLLFZNcWnTh0joKDFZs4Sfhv8A4SvHgBxA4cQvWcJPw3/wlBrFcpfqPmPgFTVyl+o+Y+AQSL0AuNmgk9QXizc6wDW6C2vxKD3cy+7f3Sm5l92/ulRogk3Mvu390puZfdv7pUaIJNzL7t/dKbmX3b+6VGiCTcy+7f3Sm5l92/ulRogk3Mvu390puZfdv7pUaIJNzL7t/dKbmX3b+6VGiCTcy+7f3Sm5l92/ulRogk3Mvu390puZfdv7pUaIPXNLTZwIPUV4pIrucI+IcbC/QVGgjqvV/nHgVTVyq9X+ceBVNBZfm3MGYC2Q5bdWY8fzusF6cu7iykk5Tmv0G5/2svFQREQEREBERBi/6Klw71yP8/AqJ/0VLh3rkf5+BWc+MjdIiLiVziIi70WqDjP+H/M1TKGg4z/h/wAzVMoLVJSy11XRUlOA6eoc2KME2u5zrDX7SttBgFLVVDaaixyjnq3nLHEIpm53dDQSwAX6zYLXYTW/4bi2GV2TeclmZPkvbNlfmtf8ltsNqcCwvFIcQp6rE55IH72OF9HGwOI1ALxKbC/Tl/JSUljsfsnVbUvnbR1EERgfEJN6SA1jyQZDYfRbYX+0K9ivo7x7Di4PhheYmudMN8xm7s5wI5xGazQHm18rXNLrLnsJxivwgVgw6odAKynfSz2aDnidbM3UacBqNV0X/He17aqpqXV73TySRTSufTROIeGtaxwu3mnK1o0tewvdSb7Cah9GeO1NLNPI/D4BHmAa+sjO8tBvw5rgS0sLbc4Gw6bWNqQ9H20+8MbsNDHh72uD6mJpaGh5Ljd2jP0clnnmnKQCV7iO221ErKqOuq7Coa6KRrqWJum7MTg3mc3mktOW3aF5Ube7T1uSObEd67ntb/00Waz2ua5oOW9iJHacLm411T7CphOx2O4vBvsNoRURmXctLZo7ucHNaS0F13NBewF45ozC5C3EPoyx+agjqITQTSStvHBBWRyOcd8IrXBy/SPG9vje4Wrpce2gwXCmYc1wZQmYyMiqKSOVufmE2L2n/sJA07VsKjbnbGkkL6itfG9z3OzvpYrkmTORcs4Zxe3Aa/FNxUk2B2ijnpIX0tK11U7JATX0+V7iGuADs9ruDmlovzgdLq3VejbHqekimtRyPkEbixlVH+ja+N8l5HEhrABGblxA+JWODbZ7X0UEbsNqniENbE13JYnttFGwAXLSOayNh+W/WVhPtjtXADDUTloY3nskoouc0B8dpAWc5vPc2zrjW3QLPsMR6OtqSWNGF3c9+QN5RFf6Tm5iM1wy7Xc883pvYhcvVQPpamWCUsMkTixxje17bg20c0kEfEEgron7d7RSSF8teyUkZSJaaJ7bbwyAWLSNHuJHVoBoAFocRrajEsQqa2tkMtVUyOllkIAzOcbk2GnEqxfdVZEXtuKo8REQEREGcn0h9g8EZwk/Df8AwlJPpD7B4IzhJ+G/+EoNYrlL9R8x8AqauUv1HzHwCCRX8Iw52JVT499HBHHG6aSWQEhjWi5NgCT+QVBbTAK2noqmoFZvRBUU8lO50TQ5zMw4gEgHW2lwpKSlqMGp+RVNRQ4rTVhpmCSWNkcjHBhc1l+c0A85zR+au4ZsdXYns/FiVBIyofLOadtPE1znMdcfWOtljBBJBcQCGnqVblGE0OHYjFQVFdUz1kLYP09MyFrAJWSE3EjiT+jAtYcUwTanGMEgEeETxUwzXMkdLFvHc4Oyuky5nNuBzSSNOCm/YhliWyGOYbRT1dZRBkENi5wnjcS05bPaA4l0fPYM7btu4C+qtwbAbSzZMlBGA5mcl9XCwM1YMryXjI79LHzXWdzhoq2J7XY7imHzUNbVNlpZX7xzBTRtsdPokNBaOaDYWHHrKlk222iki3bq7mFoDrU8YL7OjcHOIbznXhj5xueba9ibtxnjGwuOYXSR1U1O11Oac1Ejw9rdzly5mPuRZwL2i3STYXWNJsJtJV00U9Nh28ZKGODWzx5wHkZMzM2ZubMCLgXF3cASM8S25xfEsCrsPrZd6+tkidUT2DS5keYtYGtAAGZ2YnibN6lDT7b7Q07KdsGIbswMyNc2GMOI3ZjGZ2W7yGOLQXElt9LJubpKzYLaSjoqiqqcOEcUAeZAaiLOAwAu5mbMbAgmw4a8NVAzY7G3UVLWGnp46apDHMklrIIwA8OLS7M8ZAcrgC6wJFuOizrNt9oq01BqsRdIZxI2QmKPnB8TYnf6dLsa0adV+JJVxnpCxympqCDDJYaOOlpmUxywRvMwaHtu8uaS4WkdzTcC9wLp9hc/5WbRiiMpbQ8p4CkFXHvc29fEWnnWDszCLX1Ogu4EDnptl8XirYaSSlYKqWlNa2ITxlwiDDJdwDuacgvldZ1raahX3+kDaV8jZHYi0yNqOVB/Joc283rpb3yajO5zrcNTpZUhtZjLaqgnbUxtfQQup6draeIMbG4EOaWBuVwOZ17g3vqkWNvS+jTaWWppo6mkipo5nNbvH1Ebsoc4NDi1ri61yBe2hI6wqjdgdpHUfKv8OaIAwOLnVMQykhpDCC64eQ9pDDzjmGmqzf6QtqH1Lah2JjetYGAiniADQ9rwLZbfSa0/lbgsP+Pto8jQ6thcWwmnD30cDn7stDS0uLMxuAAbm56U+xuhpdjcZqNoJ8H3VOyrp7GoJqojHCC4N5zw7Le7gMoN76WvorVT6Ptooah7G0kb42yOZvOURsDQ0POd4c4GNhEbyHPyggaFU2bZY6zFpsSFZGaqaJkD81NEWFjC0sAjLcgyljSLDQhX6P0h46yqZJXVDauA5t7E6GJu+Ba9uV5yHM0CR9muuBewAT7Dm8Xw2rwfEZqDEYhFVQkB7A9r7XAI1aSDoRwKprZ7S4xNj+O1mKVEccUlS/MY4xzWgAAAfYAFrFVS03rMX3x4qJS03rMX3x4qJUR1Xq/zjwKpq5Ver/OPAqmgsuzGngccpaAWi32k2Px18FgsIpDG64DXfBwuFlvuYRu473vm1uPhxVHqL3fjPm3EVrWy86328brHfcy27Ze982t/s4oPUXu/GfNuIrWtl51vt43WO+5gG7ZcG+bW5+HFB6i934zl25ita2XnW8brETc1o3cdwbk63Pw4oPH/AEVLh3rkf5+BUUkgfe0bGg9V9O0qXDvXI/z8Cs5cZG6REXErnERF3otUHGf8P+ZqmUNBxn/D/maplBnJ9GP7v+5WCzk+jH93/crBBYgMwpajdxsMRytkc6NpLddLOIu3geFrrZzvkmbibI6ecutE1/N0jLSGm/zWAWvgqWsw+qp3B15XxuBHRlzf1fsV5mNuhqqx8ELDHUTPkcHk3IIcADY9GYn7fsURck2hxCjq5W1ELopDG1jmXLTYhxdc8ecZHONiDzrAgLx+1lWZHuEYyvaGua6RxBaN5Zv3QZBYdGRvUtdiWKNxCaeeeki38uUB4c4ZbNDdBe3R0rWJRTqW7YTsjmYyliAlZLG43uXNka1pB6D9BttAdBrxv5HtfUR1M0sdNGN7G+JwzfSD3XcDpYjo4cLdIuuXRKgqG7w3aGWgp2Qx08Lmsjc0Z7kZiHjOWnQ6SOFiLWtfglNtHVw1fKHc97otzIC4gSjebwhwHEE6EcCLhaREoqG7dtDOauoqC17pJ4mxPe6Ul7wLXD3f6gbWIPEWHQrbdsa+OTPEZA7MC57pnOe+xBGZ3Ta1h8LDoXMolQVDqf8Ai2WGm5PBEXRmjFKTI6+hja1zQOAbmbmA43JN9SF5PtlXTy7yfO94MmQmV14g52YZPZLeg6kWHQABy6JUFQ3mJ7RTYjRClqIWmJpzM57jldmkJd8XHeanpyi61FRO+dzXPEYLWhoyRtYLDrDQLn48SokQoREVVnJ9IfYPBGcJPw3/AMJST6Q+weCM4Sfhv/hKDWK5S/UfMfAKmrlL9R8x8AgkXpXi9cCDr9qDxdrs16Q8R2fwenoaOnhJgc4seXOAIdIyQ5mA5XG8YAcdQDbqtxABBH7V18+IYJJEIaOnpqUGlDJJXwFz3SAH6ObOACctyMp46ngszukt4fS3iwdDuaOmgbE5paInObo2aN4bcHhkhjj+6FU2g9J2J4zhclDJSUsEb6Q0hMLctml0JJFtdRA0EEkan4LkcclhnxKR9MYXRkNGaKPdtcQACcoADbkXsB09PFa9NMAiItKIiICIiAiIgIiICIiCWm9Zi++PFRKSnIFRETwDgf2qNBHVer/OPAqmrlV6v848CqaAiIqCIiAiIgIiICs4d65H+fgVWVnDvXI/z8Cs58ZG6REXErnERF3otUHGf8P+ZqmUNBxn/D/maplBm/6Ef2W/aVEQbk9N9CpGuAFnC7V5p8VB02D12BRYfRQYhStdMybeyzNgLnG17NN3gFv0bgDgD06qpj9Ths1FSR4eyMSRudctjynLZv0jbUlwc7ibZrA2AWk06ymnWUpKeIvdOspp1lVXiL3TrKadZQeIvdOspp1lB4i906ymnWUHiL3TrKadZQeIvdOspp1lB4i906yvWkN1tc9F+CD2T6X2AD9iM4Sfhv8A4SsTqdVkzhJ+G/8AhKDWK5S/UfMfAKmrlL9R8x8AgkWeYFoDhw4ELBSEhoAba9tSgw06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1A06z2Jp1nsTM7rPamZ3We1B7mAHNBudCSsVIw5yGEXJ0B6bqNBHVer/OPAqmrlV6v848CqaAiIqCIiAiIgIiICs4d65H+fgVWVnDvXI/z8Cs58ZG6REXErnERF3otUHGf8P8AmaplDQcZ/wAP+ZqmUGY5jQbAuPC/QF5nd7R7VKyKSeSnhhY6SWSzGMaLlxLiAAtn/wAM4iXOaw0Esgv+iixCnfIbcQGNeXE/AC6iW0+d3tO7Uzu9p3atts9s3im0L5W4RTsmMTmMdmnji5zzZoGdwuSdAAq8WC4rMIzDhlbIJGbxmWB5zN9oaaj4paqOd3tO7Uzu9p3arsOD4nMyF8OHVsjZr7ssgcQ+3HLprb4KXEtn8XwxrnYhhtXAxrI5HPfEcoa8AtJdwF79unFBrc7vad2pnd7Tu1X48DxaVjXR4XXPa5rXgtp3kFrvonhwNjbrUtHs5jNZUGCnwyrdKDI0tdGW85jDI5utucGtJy8TbQJY1ed3tO7Uzu9p3avZopIJnxTxvjlYS1zHghzSOIIPArBUZZ3e07tTO72ndqxRBlnd7Tu1M7vad2rFEGWd3tO7Uzu9p3asUQZZ3e07tXoef9XOHTfzWCIMnjK4jivWcJPw3/wlJPpD7B4IzhJ+G/8AhKDWK5S/UfMfAKmrlL9R8x8AgkVrD6GoxCp3FIxrn5S8lz2sa1oFyS5xAA+JKqrc7MTwRVVZFVTsp21NJLA2WQOLWuI0vlBNtLaAqJKKrwKtpqWSocaSWGK2c09ZDOWAmwJDHEgXIF+GoVnDNk8bxSjoaqgoHTU9bVGigeHtAdMBfKbnm6a3NhoddCpWQUmF4Viw/wAVoquWqp2wRx04kJvvo3knMxoAsw9PEhXdndv8XwDB4sNoY6M08b5JWmSNxcHPyguvmGuVpaLdD3dYIm/YaKfAsVhqXQPw6qMoe5lmxFwJacrrEaGx0uFr5GOje5kjS17SQ5rhYg9RX0qh9KtQcPxCjr8MoGxTwylnJY5GOfM/pe7eA5bE3sb8OhcDjuJz41jNbidWIxUVcrpniMWaCTewHUrF91UURFQREQEREBERAREQEREEtN6zF98eKiUtN6zF98eKiQR1Xq/zjwKpq5Ver/OPAqmgIiKgiIgIiICIiArOHeuR/n4FVlZw71yP8/ArOfGRukRFxK5xERd6LVBxn/D/AJmqZQ0HGf8AD/maplBs8CrI8Px3CK2cOMVNURzPDRc5WyXNuxbjBqXD8KxmmxGTHsOmippN8Y4mT7x9tbAGMC5+JA+K5d/0I/u/7lREnXje/BSUmHR7JbXYjssKoYYICKox70StcQ5rCTk0I5puQfhwsdV1lN6WKw0FTHV4dRb1scIpmwMeyMvY+E3ktICebC0aHqB00HK0FDhDcJpKitqWSVM0rgYInlz2Ns4AubZoHODT9MXBWuxWKngigZFuHSkvLpIHuc0tDi0aE6Hmk/Y5qlRI6ir9JuM1VLXwvp6Brq6EQVErWyZngRujBAz5WkNcfogXPG6pYpt1X4lgUuF1FHQiKVkLHSASF4MbI2Nc3M8ta4tiaDYC/ZbkkVqB2cvpCxCWolmlw/DXmaohqZmPbK5kr4mva27TJYD9ISQLC4FrWViu9J2L1m8L6LDGOdnyuZHJeLNTugIZd5yjK69h/qaCuERNMDYY9is+N4xVYlVtjbPUvzvEYIbf4XJP7Vr0RVRERAREQEREBERBnJ9IfYPBGcJPw3/wlJPpfkPBGcJPw3/wlBrFcpfqPmPgFTVyl+o+Y+AQSL0rxelB4thglRFT4tQSTFsTIp2PfLziQA4akC/D4C6163uEYpRUNEWvhL5nAse0wse14JBuXE3GgtltbpupKSuS4jhX+GMijBIFTTOmhyEGbIJc8nUL5mi1wfgtfUV2HyNoiyljDmuJnaYbDiNQQ8ZtOghtuF+lXzi+Ct3LqaidA+ItcHCAOdpa7SS/XMRfNYFvDUHTV4rPh1VPUz07aiJz7GOLI3K031BN7nTptcnjZRIbJ2IYEDLu6eoLXc0B0EWb61pL73sDkzNDbEA2NzqVPJiOzjSx7aN0ua4LdwGFhygbwgP1sQTu72N9SLLkkVpadFRYlhsUdQJoS6F1UJBA1haHsztI0zGwDWvFi4/TGp1IzZiGCyUUrpaQMqA1rQ1kI5/NN9b83na5tSLiw6uaRKKdQ7F8GjnJpaNzGva9rnmnYS0ObIAA0uI5uZmt7nLc2JKrxYxSHCYaaopzJLDE2NhLAWtO8kc42uL814H2g/aufRKKdU7G6RlRG3DppqSK+TM6BrbAvac5yHqLxazrC1iSbjTU9XAMainEbYYBVCW+pLGZr206h8LrXIlFNriM8T8MihbUtmkbVzyGwd9FwjAdqBxyn46agLVIiqiIiCWm9Zi++PFRKWm9Zi++PFRII6r1f5x4FU1cqvV/nHgVTQERFQREQEREBERAVnDvXI/z8Cqys4d65H+fgVnPjI3SIi4lc4iIu9Fqg4z/AIf8zVMoaDjP+H/M1TKDIEZcrr9YPUssjfes7D5LKKDPE6Qva0A2A6T+Sl5PBvLb6XJbjuxe/wBmb/dQQZG+9Z2HyTI33rOw+Sl3Ee7B3j899RkFu2/+yy5PBntvpcluO7F7/ZmREGRvvWdh8kyN96zsPkpdxFkad4/PfUZBYD7brLk8GcjfSZLaHdi9/szIqDI33rOw+SZG+9Z2HyUu4iyNO8fnvqMgsB8DfVZbiDORvpMttDuxe/2ZkRBkb71nYfJMjfes7D5KXcRZW/pX5r84ZBYD4G+qy3EOZ36aTLbQ7sXJ+zMggyN96zsPkmRvvWdh8lLuIsrf0r8xPOGQWA+Guv7F7uIczv0smW3NO7Fz9vO0RUORvvWdh8kyN96zsPkptxFlZ+lfcnnDINPs11/Ym4hu/wDSyWH0Tuxr9vO0/aghyN96zsPkmRvvWdh8lNuIrM/Svufpfoxp9muv7E3EN3/pZLD6P6Ma/brp+1EQ5G+9Z2HyXlmNNy4P+Aup9xFzP0smv0v0Y0+zXX9icni59pXafRuzj9uuiCs4lxJPErJnCT8N/wDCV49rmPLXgtcDYg9C9Zwk/Df/AAlVWsVyl+o+Y+AVNXKX6j5j4BBIvSvFncPtmNiNL9CCJt7jU68fgurr6HAYIt3SVbJ53UokL94XMbIA4ubqGamwt9LjqOlczkb7xnYfJMjfeM7D5KUi1i8dNHXFtEbwFkbhz89iWNJF/gSQqSzyN94zsPkmRvvGdh8lVYIs8jfeM7D5Jkb7xnYfJBgizyN94zsPkmRvvGdh8kGCLPI33jOw+SZG+8Z2HyQYIs8jfeM7D5Jkb7xnYfJBgizyN94zsPkmRvvGdh8kGCLPI33jOw+SZG+8Z2HyQZU3rMX3x4qJZ3a29jmPX0BYII6r1f5x4FU1cqvV/nHgVTQERFQREQEREBERAVnDvXI/z8Cqys4d65H+fgVnPjI3SIi4lc4iIu9Fqg4z/h/zNUyhoOM/4f8AM1TKC423JouZY6872tVJvcpIY1mXou0E/tWDb8lh54dx5vs6qWglENdTyksAZI113szN0PSOkfBRGO/f1R/q2+Sb9/VH+rb5Loq2vwutbM6rmqp5nF788ksj7OLIwMubiLtcBmsctrnQLJ9Ts2ytbLT0jmQxyse1rnvkLm7wkhwIA+iQLXPDi65UtLc3v39Uf6tvkm/f1R/q2+S2chwhlPQhrXSTNmBqXNLgHs0uADa3TbW546cBsKapwCODk9Qx9Q3KHEhz42mQOdqTYkDKQNB5pZbnN+/qj/Vt8k37+qP9W3yW+Y7Z0te6SN4duiBG0vNn5SAc3Tzrc21unN/pUtJWYDDWRTxwGF8NWJGE53NMTSSBbNfP9H4aH81luc37+qP9W3yTfv6o/wBW3yW6e7BZcSw1tNBuqbMOUGWZxuLN0OgtwdwJ48QpGybPCnjY6nc6cOYJJN48NI/R5i1tjfhJxI+lcDgAstod+/qj/Vt8k37+qP8AVt8l08+I4KcOmooWyNjLbxZszmtflGpOhIzX/YbEc01MVq8KqXVgpXTx71zn53Oe4vO8kIzXdqcpYLn4nrSy2j37+qP9W3yTfv6o/wBW3ySqZFHM5tPMZoxweWZb/kolVS79/VH+rb5LB5BsQLaarFD0INthODOraOWpkc+KEOMcbgy4e8MLrcRoANfvBauWN8Ur45WlkjCWuaRYgjiFscLxqsw2GSKnkcGOuWtubNcbXNuBBAALTcGwuDYLWvc573Pe4uc43JJuSetREVdflUl3h5v9IdKjZwk/Df8AwlSVvrUlmZNfo9SjZwk/Df8AwlaaaxXKX6j5j4BU1cpfqPmPgEEizNmgAi7iL/YsFNTU81XUMgpYZJpnmzY42lznH4AalBFceyEuPZCv1+C4ph8IlxDDa2liJyh88D2AnquQo48Mr5Io5I6KqdHJG+VjmxOIcxl87gbahtjc9FtVBUuPZCXHsheKWanmgbE6aKSNsrN5GXtID23IzC/EXBF/gVRHceyEuPZCmpaWoq5RHSQSzyE2DY2FxJsTwHwBP5FQIPbj2Qlx7IXrGue4NY0ucTYAC5JWUEMtRPHBTxvlmkcGMjY0uc5xNgABqT8EGFx7IS49kK/XYJiuH1kNJX4ZXUtVPbdQzU72PkubDK0i5udNFhimF4hhM7YcVoauimc3MI6mF0biOuzgNFBTuPZCXHsheIqPbj2Qlx7IXiIPbj2Qlx7IXiIMxZ2lrO6LdKwUtN6zF98eKiQR1Xq/zjwKpq5Ver/OPAqmgIiKgiIgIiICIiArOHeuR/n4FVlZw71yP8/ArOfGRukRFxK5xERd6LVBxn/D/maplBQuAfI3peyw7Qf9lOoLrOdSRkMsGktLus8UcWuN7EX4gKox7mAhriAeIB4qflk+8z5m5rW+g3h9llEZ6dZ7E06z2KHlMu7DMwyg3HNF+1Zcsmz58zc1rfQb4WQSadZ7E06z2KLlMuRrMwytNxzR42XvLJs5dmbci30G+SCTTrPYmnWexRcplyNbmFmm45o8l7yybOXZm3IseY3yQSadZ7E06z2KLlUuVrcws03HNHkveVzZnOzNu4WPMb5IJNOs9iadZ7FFyqXKwZm2abjmjy1XvK5szjmbdwseY3yQSadZ7E06z2KLlUtmDM2zDcc0eWq95XNd5zNu8WPMHlogk06z2L1xBtYWAFlDyqazBmbzOHMHlqnK5rvOZvP0PMHlogkRR8qm5nObzOHMHlqhqpjn59s/0rAC6BWm9VJzxJrbMOlRs4Sfhv8A4SsF7mDGSOPDI4dot/uqrXK5S/UfMfAKmrlL9R8x8AgkW+2R59ZXQtc0TT0U0UQc4NzPI0aCek6rQr0qJLpoMMrcJwXG3YjGIGT0zIow6Rpzyb+J1gAeOVrz29av7Ibaw4Jg3+H1uHGsaJy5jxIBlieYzLHYgjnblg+wv61w4JJHDVdTLspu5aeA4lSuqZ4WzMjbztNc9yNBltfXj0a6KTXc/P10dTt7gMtcJ4tmIKeIOeTFE2EtdmhZGHHPG43a5peBexJ1vqTX/wCOMHFBHSnZ6GTmPjmlcyEPlDmTgG4j5pDpY3ae7HwtxOKUYopmMbIXtezOMzcrhqRYi5tw6+FlTTTA+p1PpHwKRu5g2YZBS3jeYWuYWyOYJwC8FuptMNR0sFrDQVDt/hDADT7M0jX3BBfFC4RtzwExtG71blikF3Xd+kOvG/zdE0wU72q23w4bRbN4phuCRUQwqcSyMiyt37Q5pA0bobNIv8b2vcmhtTtNhuLYNDRUOENpZWPicZyI81mRljtWsaTnJD3XJ1Gi5FFahX0yn9I2GMq2VU2z7JZ2FlnExkuyxQsaS4sLgWmIublIHO16b4xekHCmOET8EknphNJUtdO+KWRr5JmSPa3NGWhhDA21r6k31svmqKaYSk9dMypraieKFkEcsjntiZ9GME3DR8BwUCItKIiICIiCWm9Zi++PFRKWm9Zi++PFRII6r1f5x4FU1cqvV/nHgVTQERFQREQEREBERAVnDvXI/wA/AqsrOHeuR/n4FZz4yN0iIuJXOIiLvR6CQQQbEdKnbVPA5zI3nrIP+xCrogs8rPuYv3vNOVn3MX73mqyILPKz7mL97zTlZ9zF+95qsiCzys+5i/e805WfcxfvearIgs8rPuYv3vNOVn3MX73mqyILPKz7mL97zTlZ9zF+95qsiCzys+5i/e805WfcxfvearIgs8rPuYv3vNOVn3MX73mqyILPKz7mL97zTlZ9zF+95qsiCzys+5i/e805WfcxfvearIgs8rPuYv3vNRSyvk0cQG8QBwUaICuUv1HzHwCpq5S/UfMfAKCRZ2D7WIDuFjosFmA1oBffXoGmiBuj1s7481JG+eOOSOObIySwe1soAdbhcX1WF4vYf3x5JeL2H98eSDOYzTyuknl3kjuLnyAk/mSo92etnfHmvbxew/vjyS8XsP748kHm7PWzvjzTdnrZ3x5r28XsP748kvF7D++PJB5uz1s74803Z62d8ea9vF7D++PJLxew/vjyQebs9bO+PNN2etnfHmvbxew/vjyS8XsP748kHm7PWzvjzTdnrZ3x5r28XsP748kvF7D++PJB5uz1s74803Z62d8ea9vF7D++PJLxew/vjyQebs9bO+PNN2etnfHmvbxew/vjyS8XsP748kBo3ZzEjMOFjfVRrOzXXyXBGtibrBBHVer/ADjwKpq5Ver/ADjwKpoCIioIiICIiAiIgKzh3rkf5+BVZWcO9cj/AD8Cs58ZG6REXErnERF3oIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiArlL9R8x8AqauUv1HzHwCgkXpNzqvFvtkSWVldMwAzwUU0sRLQcrw36QB6QLlRJaFF08GJ12L4LjgxKZ1THBTMljL2jmSb+JtwbaEtc8fZfqXV7D7T7M4dsxhVNjLA+uoa+WujO4LrOsxrGk21bznP/AP8AIDpCkyW+WovqmK13o6ngrKtlNv66Vs0jQ51Q1zpSXkZgLNykluWxFgOcOrY4lQejbDRHyllFI+XfOjFPVzvAjDmZRIWueRLbNYgZOJtbKmr0W+NIvomy1fsfJs1QUe0Qa6pp6mWQiRs2UROdFmAMdiZC1rst+aDe9rhT4ePR657X1T4mUvJWgRuZVGo3pYA4vc12S4dq3KMpHHXQrHzRF9cqsU2ArbtkjpI2ul3scW6qWQRgspw4Oawg5ubMAW6XsTpqqlPN6NZJoWmlEUIMd31D6rOWlkufMGEglp3Vg3KCb621DV6Hy5Fk/KHuyElt9CRYkfYsVpRERAREQEREElML1EQPDMPFRqWm9Zi++PFRII6r1f5x4FU1cqvV/nHgVTQERFQREQEREBERAVnDvXI/z8Cqys4d65H+fgVnPjI3SIi4lc4iIu9BERAREQEREBERAREQEREBERAREQEREBERAREQFcpfqPmPgFTVyl+o+Y+AUEilp6ialnZPTTSQzMN2yRuLXNPWCNQolmW5hdguLajqQW67G8UxGJsWIYjXVUQOZrZ6h0gB67Eq/PsviEDGPlNMGPp+Uhwna4ZegGxNibG1+OU9RWiDLdBW0pcdxekzcmxGsjDmbtwbK6xbrYEfmfsuon8QYxh0uFYhJSVDmOkZa5ZcDUX4OAPaFSVmuqp66fe1BaXWygMjaxoHUGtAA/IdKr2PUUV4i9seopY9RVHiL2x6ilj1FB4i9seopY9RQeIvbHqKWPUUHiL2x6ilj1FB4i9seopY9RQSU3rMX3x4qJSRgxua86W1F+kqNBHVer/OPAqmrlV6v848CqaAiIqCIiAiIgIiICs4d65H+fgVWVnDvXI/z8Cs58ZG6REXErnERF3oIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiArlL9R8x8AqauUv1HzHwCgkWYZoC42B4dZWC9cbnXqsg9yx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogyyx+07ujzTLH7Tu6PNYogzLBYlhuB+RWCkpxeeMHgXAH7FGgjqvV/nHgVTVyq9X+ceBVNAREVBERAREQEREBWcO9cj/PwKrKzh3rkf5+BWc+MjdIiLiVziIi70EREBERAREQEREBERAREQEREBERAREQEREBERAVyl+o+Y+AVNXKX6j5j4BQSLc7MwU8tVVy1UDKhlNSyziJ5cGucBpfKQba30IWmVrD66ow6p39I9rX5Swh7Gva5pFiC1wII+BCiS3DJqPFMKxYjCaKjlpads8clM6W5O+jYQc73C1pD0cQF0my+E7K12x1EcQqaKDGJa7dzulqt26OlzxB0jQTbOATlBFiM5sS0W42qx2tqaWWncKSKKWwkFPRwwl4BBAJY0Ei4Btw0C7fZD0fUO0OyVPXGqnp6yV8jc+jo2hskTQctrnR7ukdCk7C1Q7KbGtpOS1mIsfWl1O+Sojxema2MOE+drb80gFkeYguIztIGhDtPj2zWz2Gww1NFi9PVtdVU0W7FbFIS1wk3xIaA4BpawBxAFnfEKbaD0f0+G7Hy4xT18tQ6GYAjdAF8b4aeSNxZfmACYhzruFywAa3VbZXY+j2to55sOkrKHkroYJd4wVDTI9kjjI5wy7qMbvUnNbN0qe7G/rNi9j5sYxXk+P0cVA276Z7MTguTd7srY3cWizWAl4N+dqHC0MuyWxtLVsnONRT0cc0YfD/icLnOBmpxa7Wgn9HJMSWiwLOOhJkg9DtU6ejZPXzwio3bCwUYklje95bdzWyECIWuX5ukCwutf/y5joto9mKHEK500OLSBrzCwMsMrXXY67g5vPtcgG4OlrEy48jd02wuzE9NiVRTV1G+RrajdwjFGTthZZ5ZI4saCzLlbqS4HMPsXO1mzOB0u0VVSYfVxYlEMIlqo2R1TZw2cNcC3eMDQ7KAXgWHAAg9O/pfRtT0sEUdRi9fFDJWNpKpsUdm1V5YmMygkWbeQkPOa4s4N6DXp/RXA2Wplq62vNKYXPpBTUoe+V/J3zBoJcA7KWFpA1JFubfRfsS4l6P9lKXFa+kfj0dKaYzxFlRicG8a9jnhj7BlnZsovHdrm31OoCrnY3YiWpqTBtJkgifNCGS1sAe/JJlErXWsWltiGaF3EOA4XT6I5ZYJpMRr64YhO+Ih8lOHbtz3Sh5ls93Muxp3mbQEkjoXC7P4XhuP4tyWkp6yEMw+omcHVDXF80cT3gg5AA0kNFjfp16kf0dBsps/sli+zWHyYjXsocQbJOKkuxGKIyAOjyANeDl5rnEHpLCL6jLM7ZTYt1M6ODH38sDAGyS1kDYnP5O2W9rEhuYujtckO6SRY0MS9HhwzaNmG19fNBEcOmxF8j6YGRjYt5maWNkIJ/Rm1n8COC21T6I3RtrXw422WKl3jHnkpBEjC4G4z/V80XcLkZhzelW48ik7BNlcI2pmilrqWuw4YVJUj/q21AZUDMAwOYYw880EN5pOYD4rDbaj2Xi2Lw2owUUTcTkdA6TdT5nkOicZAWbxxbZwbfMBa4AJ1Vn0g7B4Zs7s/PXUUlW6aOpZDaWRrhYyVDeho6IW/t/L5kkb7giItqlpvWYvvjxUSlpvWYvvjxUSCOq9X+ceBVNXKr1f5x4FU0BERUEREBERAREQFZw71yP8/AqsrOHeuR/n4FZz4yN0iIuJXOIiLvQREQEREBERAREQEREBERAREQEREBERAREQEREBXKX6j5j4BU1cpfqPmPgFBIvSvF6UHi3mE7KYzi2GuxDD6QS0jZBC6TfRts8kAAguB1JHatGuowbaDajD8NpqXCq2pZSue4Qwx5XFxvdwDbEkX4jhr8VJ9DYUvoy2hfLV09VTx01bHC2SCmdUQl87nTMiAAz3DbvPP+jzbdK8pdhdspMFMdPQE4bVujqdKiHK8ta/I++b2XPI6wSVC3azbN8tODX1wfUPDYXPYG5y17SA0kcA5rTYaAqKnxnayhhgjp56nJSBrI3MjbIYudZozAEgg6C5uDoLLO6LLMIx/ZHC6uvbMKKsaYS6NoikcIZQ/JKx4Jym4I0secDfq4tdTiuI7TVmCClxGGofSvmYwExFpzMuWssOGspNrak31I00QwqvdbJR1EjS5zWujYXtcW3vYjQ2seHUtR7GOF4hVYVXw1tBLuqqE5o5ModlPWAQRdVnuc97nvcXOcbkk6kq3DhVdPSiogpZZYSQ3MwZtS7KNBrqdB1lRvoatjo2vpZ2ukeY2AxkFzgbFo01IOlkVWVzD8Sq8PbUto5jEKmJ0EpABLmO0LbkXFxobdBIWT8JxBjQXUVRY9UZJac5ZY9RzNIsddE/wnEOHIqgOzBgYYyHEnNoG8T9B3DqRFFFtGYBiry3LQzZXMZIHkWaWuy2Obh/qb9l9bWK1hFjY8UV4iIqCIiCWm9Zi++PFRKWm9Zi++PFRII6r1f5x4FU1cqvV/nHgVTQERFQREQEREBERAVnDvXI/wA/AqsrOHeuR/n4FZz4yN0iIuJXOIiLvQREQEREBERAREQEREBERAREQEREBERAREQEREBXKX6j5j4BU1cpfqPmPgFBIvSvF64WP5XQeLaYZjdVhsIjpQxvOLi67gTdrm20Ito52osfitS1tiNBpxXW1O0WGytAjw10bhScnDxu73sdSAwXvzdb9BtxKkpLUzY7Vy1ENQcgnjkbLvOcXPc3RpcSTew0+PTc6qxTbT11O5zomU4e4tcXZCCSCTfQ9JJJ6Lqjjda3EMQfUgyFz2tzl5OrrC9rk2Hwv2cBQSim6g2hqo6eSJzWuzRujaRpa4YDfr+g0jpBAN+IM+H7UVFBR08dPBFv4nscJnEk8zNlAAta2Y8OI0NwTfnkSiobejx2opIoWwNYHxgtz3P0S4utpax5zxe/B3QQCvanaGuqZaV87hIaeTesEj3vBN76hziDx48T0krTolFOibtdiTX52iDPzRmym9g8vFzfXU9N1BTbTYjTNa2NzA0ADS4NhHu7XBBHN6iFpESoKhvBtJVvmDqprJ2XaXNcTc23dtb3/wDxN1+3rWle4ve5zjdzjcn4rFEKERFVEREEtN6zF98eKiUlOcs8bjwDgT9gUaCOq9X+ceBVNXKr1f5x4FU0BERUEREBERAREQFZw71yP8/AqsrOHeuR/n4FZz4yN0iIuJXOIiLvQREQEREBERAREQEREBERAREQEREBERAREQEREBXKX6j5j4BU1cpfqPmPgFBIsg7QBwuBw+CxWZdYZWGwtqetB5zfZd2/2Tm+y7t/ssUQZc32Xdv9k5vsu7f7LFEGXN9l3b/ZOb7Lu3+yxRBlzfZd2/2Tm+y7t/ssUQZc32Xdv9k5vsu7f7LFEGXN9l3b/ZOb7Lu3+yxRBlzfZd2/2Tm+y7t/ssUQZc32Xdv9k5vsu7f7LFEGRdpZot4rFSRkvc2M63NhfoKjQR1Xq/zjwKpq5Ver/OPAqmgIiKgiIgIiICIiArOHeuR/n4FVlZw71yP8/ArOfGRukRFxK5xERd6CIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgK5S/UfMfAKmrlL9R8x8AoJFdwrD5MSqXxRyRQtZG6WSWUnKxjRck2BPYCVSW22drKekqqltY6RkFTTSU5kYzMWZhobXF9R1qJL2fBmtoqippMToa0U7Q+VkAla5rS4Nzc+NoIzOaNOtX8G2afiOymJYqyOV0lO8Mia2QDec5gdZuUk5d42+o+m3jqoc+FYfhuJR0dfNVz1kLYA0027DAJY5C4nMfd2tbpWWB7ZY1g1LDRUda9mHMLy+laGhkue2bOLc42AAcbltha1lNx6diNpg97TglbmZYEbvpJcLfbdjhbjcL2HY3FKh2KNpRHNJh0UU0rGh4c5sgBBaHNHAG5JsLAnULdVXpPxeRuIbiOCF01a2spSIonCls6ZxAGSxcTN9PQ8346VsOxHa8R4jiNIM0VZTRx1T3wxOZJEGODWkOFvoxv0AucpKbjUw7H7QzRMliwmqfE8Ate1t2m99AeF9Dpx0RmyONOoZqs0ZZHE5jCHuDXOL3PYLA8RmjeCeixW2Z6S9rpNzFHiQJa3cxsZSxaNOmUAN4cLDrAtqAvKzbLa2gqmy1UrKeZ9gGuooW5THJKb5cnNcHyS62BufgE3Gtn2NxyERg0Ezp3Me90AjcHsDSb8QAdASMpOikrdi8XoqLFayeNrKTDjZ8rmvYJTvREcgc0E2c7pA4HpFlvpvSdtNX1NHHhUkjMQliFPM/dxyyVT3E8BkAaDmsGgdVySAVqNpto9pw2rwvHZGtdUNDpWup4g9zHSb8WeG3yl5zWBtqm4zj9HmOS4nh9FCyCV9WyCQyRuc5kAmy5d4QL6Z23IBAuNVpqjZrGaekmqp8Nqo4IQDI9zLZAQ069Wj2X6swvxW6wLb3a2kMVFg9a4vkMMbIo6WN7nmNsbIwBlJJAiYB9h6zfPFdpNsX7Nyx19TKMIr3gyERsa2Z7mtNyQLlxDASTqTcnUm7ccWisVdFU0bad1TC6NtREJoi7/WwkgOHwu0j8kho6iakqKqKFzqenLRLIODMxs2/22K0quiycxzQ0uaQHC7SRxF7XHYVigIiIJab1mL748VEpab1mL748VEgjqvV/nHgVTVyq9X+ceBVNAREVBERAREQEREBWcO9cj/PwKrKzh3rkf5+BWc+MjdIiLiVziIi70EREBERAREQEREBERAREQEREBERAREQEREBERAVyl+o+Y+AVNXKX6j5j4BQSL0rxelB4vpuxm2uH4TsY/Dp6auqKqNznCmppHRRTNMsUhdIW6h4EZAkBuBpbpXzJd7sptPs/hWzRpa6gfLiBFQ3eR0UWokiewZpXOL3WJbYANA1PONrZyRt6n0v1BzChoKmma5j2uPLy573FkDGvc7IMzm7g6nXnnhbWKX0sTObLHHhjmUz3PPJ+Vkx85tUCC3LYj/qWn47odYyzP2x2JqHvfUYAY3tqHys3OHU4a6MOn3cZAcAObLHc6kmMXvYEajZPafZzDsNoKXFMJjmkjbMZp+QQTuzl7DGeeQXgNEjSCRbPcXIFs1HgbV3pKfGMTmjwbE+UVTRLmmxJ74oG3BZljyACNrspZ0i9sxuLe1Ppb3s0jxhNQCXPeM9fmMhdJM/dyndjPD+msY9L5G6qebb3ZWppIon4bWwXo6ejmENNC7O1klM8kOe4mwELwGOBabi9rlINsNgYpZJH4JUTlz4HGN+F0jWEs3Wd4sbtzBkt2AlvPGg1SvQ0GMekN2KY3guIVOGiQYZWOqWwyzl4cwiK0Y5osAYiekXedON5q7b4Yhtdh+M0ODSsrYKaWnfadrpKhzonMEjnNjbzgHXsBbmgANWs2q2hwfFsJoYqPCoKethdG6V8dJFA2T9CwSA7uxIMgc4dQOluCmodrMNh21wrGG4RHQUtJAyKSKjzOL3CHITz3np+N7cbm5Nr0OhHpdcJaepGDyCth3Ld6K3R7WSxSvzDJcue6N1zf8A16g21hl9KcM1E+inwepmpnxCF75MQzTPAAsS/d2LrtBJtrrwvcex7YbGiRn/ANDyf6mv/wANp5Nw28R3GUutMLMkG+fZ/PvZYybZ7IyU7IG7NxQwGMRuayigdI0GCRptIecTvTE4OOtmk9JBlR4E9f6WosQjdFU4HI2B4na9sVdlLhK9zjcmMglpIym2nP8Aa01e1fpHGP4FX4f/AIZLTcrmMulXmiZ+nkluI8g553mVzr65RoOC3s21Wwn+HTTQ4WJZGlsZhmwumZLUC0/Sw5YhzoQXs512Dm9Kos2w2NFUHHA7NzF7ZP8ADKY7qPOw8n3ZdleLNeN+45+dwSo8DisbxutxfCsLhnpaaOnw+LkzJYaVkZccznc5zWgk87hfoJ4kk6Nd5tbtVgmI7Lw4Zg2HyUdqqGpMG4jZHHlhLHN3jXZ5SXHNmcAdbdAvzu0+L0mL1FLJRYTS4a2Knjic2B0hzlrQCTmc7pBt09ZJ1W4VpURFRLTesxffHiolLTesxffHiokEdV6v848CqauVXq/zjwKpoCIioIiICIiAiIgKzh3rkf5+BVZWcO9cj/PwKznxkbpERcSucREXegiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICuUv1HzHwCpq5S/UfMfAKCReleL0oPF9A2Nptia3Aadm09W+iq455y90Ic6SRtot2LWy5frekEEDrXz9dzsjsxguI0eHVWIYzBBPLNz6aawjDGzQsIcQ9rhdsrnaW0jdr0jMo3G1VXsW/Z1tPg0tMKmKjexrhSNbJK/wD6QNzuLOPNnNwQb5tecb502zWwtNDhgx3FJqOealpKmRoe55c2SIOk5ojs2xLbc46X4kAGtFsFgNS94p9pY3SMyAwt3QMjnMhdaMuk1A3rgb6/oz0rVQ7G0LqzHqebGYoX4XWTU9pCxhkYyOZweAXC93xMbYX+mPhebeRfdhewJ/xENxaoDYqPNTO5xdNPkkNjzQA3MIx08T0G7dlhlH6N6fGaapbXOkigrm3hq3vMb4Gyuu8gQnMS0M5hsCHHVafaPYjC8G2jw7C344LVFTLSzPe2O8GXKGSOAebNcXdNiA0myvUOw2zbKulNXtJFNTiojin3ckTQf+oZE9oJffg50gdltkbf7G3kYQ4R6PnRyvmxqUOkbmiAL+Yd3EbPG79szDS9gGmx4HnqWHCYcHwOlxGRjP8AEKwVFZURtDpaama7dho4kE/pHEdNmaFbLH9jMKoKbB3Ue0dDPU188cUsLngClD+Je8XADToSL9aubY7M4D/xfgkGEVlFRYRiL2xPMdTvnU3OAc6TM4hps61sxByl2gICWNg+i9HNGa5+G4k+oc6mqImcua6zHmFwjcxoY65zm9yQW2BUsWF+jKkxGCSHHZ5GsdE8ukjzs+tIeMjozfm5SLhwOtwOC12FbBbPYlLTBm1UNNG9sT5TU7tmTeMY6ws8kluctOnFuthciar2G2dqJ6UUuP0kDXUEcj8srCwTiOLMxxc+4c4ue7hlGguLHLNvIrOwr0exYTQyPxmpmrnsiFS2MODYyXwh7m3bc2a6Y9GrRp1z4hhfozY4spMVxF4dvBvHabvKwlpDQ05szgBxHE8OjQbY7LUmzj6KejxOjxancAZ2xzNux+d4yWDrkEMvcaC/EggnqqnZXY+YvpqXEqODlDRXMqTKZHQQyytEcAG8AzsY1xdcOdZ3C4Cv+iOtovR9VQUFO3EoqcUriHvjzl0sZknN3O3QLn23FrjQEjo04jbOmwOmxGmbs1UyVFI6na6QyXJZLmcC29hfQNNwOnoNwO4q/R/s9K7CYqbaKgiJEsVZKKmNzWlkkuWQ88nnNDAA1trNubXXzTGKSOgxeuo4J21MVPO+JkzbWka1xAcLE6G1+KYimiItqlpvWYvvjxUSlpvWYvvjxUSCOq9X+ceBVNXKr1f5x4FU0BERUEREBERAREQFZw71yP8APwKrKzh3rkf5+BWc+MjdIiLiVziIi70EREBERAREQEREBERAREQEREBERAREQEREBERAVyl+o+Y+AVNXKX6j5j4BQSL0rxelB4uswTYXEcZwaLEKOopCJTJkp7Sumc1j2Ne4Nawg2MjTa9z0AnRcmu8wKi25rtmKKLAuVMwmKUzMdTVLYgXukABfZw1DmAi/0eOgN1JF7DPR7tNhtWyTCcbpaSsmBbEaeeeF8seWF7nA5BZoE0ZIdY6HQkBafH9iKzCsIkxCorIKx8lVFDG6nzuEheZ2u+k0OuHwOHDW+l1u44fSOWUtM+eokbFU8pcZsQYWvmBhAjmcZLF4LYgInnML6DVajaDDtq5KatrserqgTsZFXOppqrPJu82Vry0OJZlMzQA6xtIbaXWYmfKNyPRrX1jK+qxXEpKivdHv4y2OV7piY53WcJGtkzZ4C0jLfXS+i5x2wuIt2jp8HNRT7yaBtQ2cRTmNrCbXc0R7xvO0OZgseOmq1km1G0Ekplkx3FXykAF7quQmwzW1v/3v7x6yoztFjZxDl5xjEjXbvdco5U/eZPZzXvb4K1I6Ws9GmK0cE8lRXYY18EYfJFvJLtcWOe1hOTKHEMdYk5bgC9yL36P0T1/+N09LX4rh0dG+rbRyVEJldaUyuiMbWlgJddrtSA3T6S4l2P4w41Jdi2IE1Me6nJqX/pWWIyu15wsTodNVLDtPj8EzpYMcxSOVxcS9lXIHEudmdqD0u1PWdUqR0EHo2xWUX5bhrCQCxpfIXyExRShrWtYXOOWZugB4O6BdXY/RZiXJqwS1tJyuB7WuYwvIisJDKH83NdojvzA4OvzS5clHtPj8dPHBHjmKNgjj3LI21cga1lgMoF7BtgNOGgWJ2lx0uiccaxPNEGiM8rkuzLfLbXS1zbquU3HQbP7COxDGqvDa3EoKd0NXT0TZommVjnzF2V2ljbKx2hANyAcutvG+jvEHRSzMxLC3QU8bZ6mQOltTxPjdJHI4bu5DmNJAaHOGgcGnRc5BjuKQTVU0dfUb+qc180rn5nuc1wc1+Y6hwIuHA3466lSu2mx50kEjsbxQvgc58TjVyXjc6+YtN9Cbm5HG5TcdjD6KMS3dZFUVtI3EI42TQwMLnB0TpTHvXOy2DbNeQBd/N1aLhcNjeGyYRik1DNLDM+PKd5CSWODmhwIuARoRoQCDoQCFO3aXHWx7tuNYmI95vsoqpLZ82bNa/HMAb8b6qhW1dTXVUlTW1E1TUSG75Znl73HhqTqUi+4gREWlS03rMX3x4qJS03rMX3x4qJBHVer/ADjwKpq5Ver/ADjwKpoCIioIiICIiAiIgKzh3rkf5+BVZWsNBNbEBxN/ArOfGRuUW0xrAMSwVsRxOm3AlJDP0jXXta/0SesIuJXEIiLvQREQEREBERAREQEREBERAREQEREBERAREQEREBXKX6j5j4BEUEi9KIg8W9wna3HMIwmXDMNxCSnoZTI58TWt1L2Bjjci/ADp04ixRFBcG320glz8vjJvmLTSwlrn3a7eObks6S7GneEF2g1WLtuMafh/JJn0ksYaGNL6WM2ZnD3NLbZXZnNY5xcCSWDXjciVCOYREVUREQEREBERAREQEREEtN6zF98eKiREEdV6v848CqaIgIiKgiIgIiICIiArOHeuR/n4FEWc+MjpK6vqq7ccrmdLuYxFHm/0tHAIiLiV/9k="
          }
        ]
      }
    },
    "final-screenshot": {
      "id": "final-screenshot",
      "title": "Final Screenshot",
      "description": "The last screenshot captured of the pageload.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "screenshot",
        "timing": 4793,
        "timestamp": 60264246358,
        "data": "data:image/jpeg;base64,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eGei3b7S4yz/AIXp8Doa+asw+Ocztkkvd8lstwTqWgXDfvONzcBseweOUWGsqqTEJNyyolZK2V8ZfG0timYMwHOGsoIcA4gtBym1lyTnF1rnQCw+A6l4vTD44wx0pnlqm2/20xamxfE4n0LXCngjMTSWBgcDI99wwE5Rz7WueC1WHn6/8P8Amaqq9Y9zHBzTYhejLqcLrqeDBp4pDCZ2TtmZFPGXslGRzSNOkXB1sFFtNjBxzEhVmlhprRMiyx8XZRbM49Lj1/YtDyl3sM/b5pyl3sM/b5qUJ5fV5fsHiFFhf+YU/wB8KKWZ0gANg3jYKXC/8wp/vhTPjI+v+mb1PC/xH+ARPTN6nhf4j/AIuJp8U30XW/ujzTfRdb+6PNVEXei3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmm+i6390eaqIgt76Lrf3R5pvout/dHmqiILe+i6390eab6Lrf3R5qoiC3vout/dHmrWFSRuxGnDS++ccR/dapXcF/zWm++s58ZH2n0zep4X+I/wAAiemb1PC/xH+ARcSvhKIi70WIqOqmjD4qad7Dwc2MkdqgILSQQQRoQV+o/R1WVtB6DtkKih2kw7Z6NmJyGpnrnNDZYRJKXRtDgQXGwNtOB1WG02w2yu3+IVm2UMlfNQ1lUykjbh81PSh2QZZJ3GfQ6g6DU5b6308+pvulvy8i+81noo2MwLBd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EREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAV3Bf81pvvqkruC/5rTffWc+Mj7T6ZvU8L/Ef4BE9M3qeF/iP8Ai4lfCURF3oIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgK7gv+a0331SV3Bf8ANab76znxkfafTN6nhf4j/AInpm9Twv8AEf4BFxK+EoiLvRJDHvHht7DiT1BWt1F7sfmSo6DjP+H/ADNUygx3UXux2nzTdRe7HafNdTs5sfU4/QNqaPEMPY91UykEEu9D948Oc3URloFmONy6wA1srUWwdRJh/wDiLcawgYYcoZWEziNzi8sy23WYEEa3aBYg3UscZuovdjtPmm6i92O0+a6/FNg8UwuKrbWz0TK+lhdUzUAkcZmxNfkL7huS19bZr21suSS7GO6i92O0+abqL3Y7T5rJFRjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayRBjuovdjtPmm6i92O0+ayV+PCa2TD31jKaYwNIGYRusQQ45gbWsMup+IQa7dRe7HafNN1F7sdp81kiDHdRe7HafNRzQtyF0YykcRxuFMs2cJPw3/AMJQaxT08Qfdz75R1dJUCuUv1HzHwCoy3UXux2nzTdRe7HafNZLppdhsfEcMtNQyVkMsEdRvKdpc1ofG2QAkgahrgT0DrWbHL7qL3Y7T5puovdjtPmugGx+0RaCMGriDIYtIibODnMIPVZzHD7QVnS7G49UVBh5BJC8CQ3mIYDkiErgCePMLTp0OHWlwOc3UXux2nzTdRe7HafNZIqMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWSIMd1F7sdp803UXux2nzWS9AubDigw3UXux2nzTdRe7HafNbCtwqtooIZqmmmjjlbmu6Nwy84ixuOPNv9hVFBjuovdjtPmm6i92O0+ayRBWqIgwB7L5SbEdRUCuVXq/zjwKpqidkbWx5pWk5xzLHTpFyvczOZ+hZzeOrud9uvghtuorOLuabg/6e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"
      }
    },
    "total-blocking-time": {
      "id": "total-blocking-time",
      "title": "Total Blocking Time",
      "description": "Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [Learn more about the Total Blocking Time metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/).",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "numericValue": 20,
      "numericUnit": "millisecond",
      "displayValue": "20 ms",
      "scoringOptions": {
        "p10": 150,
        "median": 350
      }
    },
    "max-potential-fid": {
      "id": "max-potential-fid",
      "title": "Max Potential First Input Delay",
      "description": "The maximum potential First Input Delay that your users could experience is the duration of the longest task. [Learn more about the Maximum Potential First Input Delay metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid/).",
      "score": 0.98,
      "scoreDisplayMode": "numeric",
      "numericValue": 90,
      "numericUnit": "millisecond",
      "displayValue": "90 ms"
    },
    "cumulative-layout-shift": {
      "id": "cumulative-layout-shift",
      "title": "Cumulative Layout Shift",
      "description": "Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/articles/cls).",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "numericValue": 0.0032676689411467695,
      "numericUnit": "unitless",
      "displayValue": "0.003",
      "scoringOptions": {
        "p10": 0.1,
        "median": 0.25
      },
      "details": {
        "type": "debugdata",
        "items": [
          {
            "cumulativeLayoutShiftMainFrame": 0.0032676689411467695,
            "newEngineResult": {
              "cumulativeLayoutShift": 0.0032676689411467695,
              "cumulativeLayoutShiftMainFrame": 0.0032676689411467695
            },
            "newEngineResultDiffered": false
          }
        ]
      }
    },
    "server-response-time": {
      "id": "server-response-time",
      "title": "Initial server response time was short",
      "description": "Keep the server response time for the main document short because all other requests depend on it. [Learn more about the Time to First Byte metric](https://developer.chrome.com/docs/lighthouse/performance/time-to-first-byte/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 17.429000000000002,
      "numericUnit": "millisecond",
      "displayValue": "Root document took 20 ms",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "responseTime",
            "valueType": "timespanMs",
            "label": "Time Spent"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/et/kaspar/perroz",
            "responseTime": 17.429000000000002
          }
        ],
        "overallSavingsMs": 0
      },
      "guidanceLevel": 1
    },
    "interactive": {
      "id": "interactive",
      "title": "Time to Interactive",
      "description": "Time to Interactive is the amount of time it takes for the page to become fully interactive. [Learn more about the Time to Interactive metric](https://developer.chrome.com/docs/lighthouse/performance/interactive/).",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "numericValue": 1234.4782,
      "numericUnit": "millisecond",
      "displayValue": "1.2 s"
    },
    "user-timings": {
      "id": "user-timings",
      "title": "User Timing marks and measures",
      "description": "Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. [Learn more about User Timing marks](https://developer.chrome.com/docs/lighthouse/performance/user-timings/).",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "name",
            "valueType": "text",
            "label": "Name"
          },
          {
            "key": "timingType",
            "valueType": "text",
            "label": "Type"
          },
          {
            "key": "startTime",
            "valueType": "ms",
            "granularity": 0.01,
            "label": "Start Time"
          },
          {
            "key": "duration",
            "valueType": "ms",
            "granularity": 0.01,
            "label": "Duration"
          }
        ],
        "items": []
      },
      "guidanceLevel": 2
    },
    "critical-request-chains": {
      "id": "critical-request-chains",
      "title": "Avoid chaining critical requests",
      "description": "The Critical Request Chains below show you what resources are loaded with a high priority. Consider reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. [Learn how to avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/).",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "displayValue": "",
      "details": {
        "type": "criticalrequestchain",
        "chains": {
          "219BAB58B6E1F843C12DB4F41B53B394": {
            "request": {
              "url": "https://www.todzz.eu/et/kaspar/perroz",
              "startTime": 60259.455994,
              "endTime": 60259.637932,
              "responseReceivedTime": 60259.636044,
              "transferSize": 8190
            }
          }
        },
        "longestChain": {
          "duration": 181.9379999935627,
          "length": 1,
          "transferSize": 8190
        }
      },
      "guidanceLevel": 1
    },
    "redirects": {
      "id": "redirects",
      "title": "Avoid multiple page redirects",
      "description": "Redirects introduce additional delays before the page can be loaded. [Learn how to avoid page redirects](https://developer.chrome.com/docs/lighthouse/performance/redirects/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "LCP": 0,
        "FCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0
      },
      "guidanceLevel": 2
    },
    "mainthread-work-breakdown": {
      "id": "mainthread-work-breakdown",
      "title": "Minimizes main-thread work",
      "description": "Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to minimize main-thread work](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown/)",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 719.469999999997,
      "numericUnit": "millisecond",
      "displayValue": "0.7 s",
      "metricSavings": {
        "TBT": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "groupLabel",
            "valueType": "text",
            "label": "Category"
          },
          {
            "key": "duration",
            "valueType": "ms",
            "granularity": 1,
            "label": "Time Spent"
          }
        ],
        "items": [
          {
            "group": "scriptEvaluation",
            "groupLabel": "Script Evaluation",
            "duration": 318.64000000000055
          },
          {
            "group": "other",
            "groupLabel": "Other",
            "duration": 300.6699999999963
          },
          {
            "group": "styleLayout",
            "groupLabel": "Style & Layout",
            "duration": 33.528
          },
          {
            "group": "parseHTML",
            "groupLabel": "Parse HTML & CSS",
            "duration": 29.384999999999998
          },
          {
            "group": "scriptParseCompile",
            "groupLabel": "Script Parsing & Compilation",
            "duration": 22.653
          },
          {
            "group": "paintCompositeRender",
            "groupLabel": "Rendering",
            "duration": 14.594000000000007
          }
        ],
        "sortedBy": [
          "duration"
        ]
      },
      "guidanceLevel": 1
    },
    "bootup-time": {
      "id": "bootup-time",
      "title": "JavaScript execution time",
      "description": "Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to reduce Javascript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 288.0770000000011,
      "numericUnit": "millisecond",
      "displayValue": "0.3 s",
      "metricSavings": {
        "TBT": 50
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "total",
            "granularity": 1,
            "valueType": "ms",
            "label": "Total CPU Time"
          },
          {
            "key": "scripting",
            "granularity": 1,
            "valueType": "ms",
            "label": "Script Evaluation"
          },
          {
            "key": "scriptParseCompile",
            "granularity": 1,
            "valueType": "ms",
            "label": "Script Parse"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "total": 274.479000000001,
            "scripting": 220.36000000000104,
            "scriptParseCompile": 0.096
          },
          {
            "url": "Unattributable",
            "total": 204.12499999999937,
            "scripting": 22.057999999999968,
            "scriptParseCompile": 0
          },
          {
            "url": "https://www.todzz.eu/et/kaspar/perroz",
            "total": 155.52900000000008,
            "scripting": 44.94100000000008,
            "scriptParseCompile": 0.622
          }
        ],
        "summary": {
          "wastedMs": 288.0770000000011
        },
        "sortedBy": [
          "total"
        ]
      },
      "guidanceLevel": 1
    },
    "uses-rel-preconnect": {
      "id": "uses-rel-preconnect",
      "title": "Preconnect to required origins",
      "description": "Consider adding `preconnect` or `dns-prefetch` resource hints to establish early connections to important third-party origins. [Learn how to preconnect to required origins](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/).",
      "score": 0,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 161.0064,
      "numericUnit": "millisecond",
      "displayValue": "Est savings of 160 ms",
      "warnings": [],
      "metricSavings": {
        "LCP": 150,
        "FCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "wastedMs",
            "valueType": "timespanMs",
            "label": "Est Savings"
          }
        ],
        "items": [
          {
            "url": "https://i.imgur.com",
            "wastedMs": 161.0064
          }
        ],
        "overallSavingsMs": 161.0064,
        "sortedBy": [
          "wastedMs"
        ]
      },
      "guidanceLevel": 3
    },
    "font-display": {
      "id": "font-display",
      "title": "All text remains visible during webfont loads",
      "description": "Leverage the `font-display` CSS feature to ensure text is user-visible while webfonts are loading. [Learn more about `font-display`](https://developer.chrome.com/docs/lighthouse/performance/font-display/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "warnings": [],
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "wastedMs",
            "valueType": "ms",
            "label": "Est Savings"
          }
        ],
        "items": []
      },
      "guidanceLevel": 3
    },
    "diagnostics": {
      "id": "diagnostics",
      "title": "Diagnostics",
      "description": "Collection of useful page vitals.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "debugdata",
        "items": [
          {
            "numRequests": 140,
            "numScripts": 59,
            "numStylesheets": 2,
            "numFonts": 0,
            "numTasks": 2260,
            "numTasksOver10ms": 8,
            "numTasksOver25ms": 6,
            "numTasksOver50ms": 2,
            "numTasksOver100ms": 1,
            "numTasksOver500ms": 0,
            "rtt": 0.10779999999999999,
            "throughput": 30037832.07367996,
            "maxRtt": 40.611000000000004,
            "maxServerLatency": 162.47820000000002,
            "totalByteWeight": 688974,
            "totalTaskTime": 719.4699999999954,
            "mainDocumentTransferSize": 8190
          }
        ]
      }
    },
    "network-requests": {
      "id": "network-requests",
      "title": "Network Requests",
      "description": "Lists the network requests that were made during page load.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "protocol",
            "valueType": "text",
            "label": "Protocol"
          },
          {
            "key": "networkRequestTime",
            "valueType": "ms",
            "granularity": 1,
            "label": "Network Request Time"
          },
          {
            "key": "networkEndTime",
            "valueType": "ms",
            "granularity": 1,
            "label": "Network End Time"
          },
          {
            "key": "transferSize",
            "valueType": "bytes",
            "displayUnit": "kb",
            "granularity": 1,
            "label": "Transfer Size"
          },
          {
            "key": "resourceSize",
            "valueType": "bytes",
            "displayUnit": "kb",
            "granularity": 1,
            "label": "Resource Size"
          },
          {
            "key": "statusCode",
            "valueType": "text",
            "label": "Status Code"
          },
          {
            "key": "mimeType",
            "valueType": "text",
            "label": "MIME Type"
          },
          {
            "key": "resourceType",
            "valueType": "text",
            "label": "Resource Type"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/et/kaspar/perroz",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 0,
            "networkRequestTime": 1.385000005364418,
            "networkEndTime": 183.32299999892712,
            "finished": true,
            "transferSize": 8190,
            "resourceSize": 18758,
            "statusCode": 200,
            "mimeType": "text/html",
            "resourceType": "Document",
            "priority": "VeryHigh",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/assets/0.Ci5NMpTh.css",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 235.45800000429153,
            "networkRequestTime": 250.8530000001192,
            "networkEndTime": 413.0700000077486,
            "finished": true,
            "transferSize": 14923,
            "resourceSize": 86517,
            "statusCode": 200,
            "mimeType": "text/css",
            "resourceType": "Stylesheet",
            "priority": "VeryHigh",
            "isLinkPreload": true,
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/assets/5.DgnLijrR.css",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 235.8150000050664,
            "networkRequestTime": 254.50000000745058,
            "networkEndTime": 415.28700000047684,
            "finished": true,
            "transferSize": 944,
            "resourceSize": 2643,
            "statusCode": 200,
            "mimeType": "text/css",
            "resourceType": "Stylesheet",
            "priority": "VeryHigh",
            "isLinkPreload": true,
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/entry/start.BBQRHtko.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.1330000013113,
            "networkRequestTime": 254.67899999767542,
            "networkEndTime": 279.3370000049472,
            "finished": true,
            "transferSize": 249,
            "resourceSize": 118,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Bc2t17NI.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.29399999976158,
            "networkRequestTime": 254.7740000039339,
            "networkEndTime": 291.40900000184774,
            "finished": true,
            "transferSize": 10883,
            "resourceSize": 25937,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DDU36747.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.35100000351667,
            "networkRequestTime": 254.86200000345707,
            "networkEndTime": 443.8020000010729,
            "finished": true,
            "transferSize": 899,
            "resourceSize": 1267,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.40600000321865,
            "networkRequestTime": 255.5569999963045,
            "networkEndTime": 441.8090000003576,
            "finished": true,
            "transferSize": 12837,
            "resourceSize": 30676,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DPpvDsKI.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.45400000363588,
            "networkRequestTime": 255.68699999898672,
            "networkEndTime": 427.9780000001192,
            "finished": true,
            "transferSize": 543,
            "resourceSize": 416,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CJS_5WkZ.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.57400000095367,
            "networkRequestTime": 255.77600000053644,
            "networkEndTime": 278.3589999973774,
            "finished": true,
            "transferSize": 3247,
            "resourceSize": 6320,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/entry/app.DD8hBrVA.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.64500000327826,
            "networkRequestTime": 256.28300000727177,
            "networkEndTime": 281.902000002563,
            "finished": true,
            "transferSize": 3335,
            "resourceSize": 8022,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/PPVm8Dsz.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.69900000095367,
            "networkRequestTime": 256.4240000024438,
            "networkEndTime": 420.4530000016093,
            "finished": true,
            "transferSize": 856,
            "resourceSize": 1232,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DsnmJJEf.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.74600000679493,
            "networkRequestTime": 256.52000000327826,
            "networkEndTime": 424.83799999952316,
            "finished": true,
            "transferSize": 191,
            "resourceSize": 66,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CYtBgnGG.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.79700000584126,
            "networkRequestTime": 256.60999999940395,
            "networkEndTime": 420.15600000321865,
            "finished": true,
            "transferSize": 933,
            "resourceSize": 792,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CbtWwMml.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.8449999988079,
            "networkRequestTime": 257.67300000041723,
            "networkEndTime": 420.3290000036359,
            "finished": true,
            "transferSize": 775,
            "resourceSize": 549,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BGmsFsoN.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.89200000464916,
            "networkRequestTime": 258.0590000003576,
            "networkEndTime": 430.30500000715256,
            "finished": true,
            "transferSize": 434,
            "resourceSize": 302,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DHU-rktX.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 243.95700000226498,
            "networkRequestTime": 258.4970000088215,
            "networkEndTime": 766.3400000035763,
            "finished": true,
            "transferSize": 1613,
            "resourceSize": 3460,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/0.DZSSM0NM.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.01500000059605,
            "networkRequestTime": 260.5320000052452,
            "networkEndTime": 285.0930000022054,
            "finished": true,
            "transferSize": 10025,
            "resourceSize": 26833,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BLVKJNdn.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.06900000572205,
            "networkRequestTime": 260.92700000852346,
            "networkEndTime": 285.9560000002384,
            "finished": true,
            "transferSize": 1616,
            "resourceSize": 2845,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CQF_21zV.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.12300000339746,
            "networkRequestTime": 261.41700000315905,
            "networkEndTime": 426.3260000050068,
            "finished": true,
            "transferSize": 164,
            "resourceSize": 39,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DfV_oJU6.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.17199999839067,
            "networkRequestTime": 263.9409999996424,
            "networkEndTime": 444.6440000087023,
            "finished": true,
            "transferSize": 6781,
            "resourceSize": 13244,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BnHrUGYK.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.22200000286102,
            "networkRequestTime": 264.39000000059605,
            "networkEndTime": 427.5730000063777,
            "finished": true,
            "transferSize": 1240,
            "resourceSize": 2033,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BkoSttyr.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.2719999998808,
            "networkRequestTime": 264.67000000178814,
            "networkEndTime": 442.86800000071526,
            "finished": true,
            "transferSize": 844,
            "resourceSize": 619,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/d2bRpw1x.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.32000000029802,
            "networkRequestTime": 267.2170000001788,
            "networkEndTime": 435.9590000063181,
            "finished": true,
            "transferSize": 25979,
            "resourceSize": 119919,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DHcTXZZ1.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.36800000071526,
            "networkRequestTime": 268.1490000039339,
            "networkEndTime": 292.8910000026226,
            "finished": true,
            "transferSize": 359,
            "resourceSize": 227,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Bq5jhTTe.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.4160000011325,
            "networkRequestTime": 268.37099999934435,
            "networkEndTime": 439.6980000063777,
            "finished": true,
            "transferSize": 5325,
            "resourceSize": 14639,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CdVPB6xn.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.49599999934435,
            "networkRequestTime": 269.35400000214577,
            "networkEndTime": 439.40900000184774,
            "finished": true,
            "transferSize": 1367,
            "resourceSize": 2184,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DFsmf67A.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.5680000036955,
            "networkRequestTime": 269.62300000339746,
            "networkEndTime": 439.20799999684095,
            "finished": true,
            "transferSize": 2581,
            "resourceSize": 5575,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/ChxxQyAj.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.6169999986887,
            "networkRequestTime": 270.03900000452995,
            "networkEndTime": 472.18299999833107,
            "finished": true,
            "transferSize": 11817,
            "resourceSize": 33904,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BaJ2CNeu.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.6660000011325,
            "networkRequestTime": 271.6880000010133,
            "networkEndTime": 436.6089999973774,
            "finished": true,
            "transferSize": 324,
            "resourceSize": 197,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Dogyu7fo.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.71400000154972,
            "networkRequestTime": 272.1979999989271,
            "networkEndTime": 468.1980000063777,
            "finished": true,
            "transferSize": 1545,
            "resourceSize": 2667,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/D_IBngDt.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.75900000333786,
            "networkRequestTime": 272.56100000441074,
            "networkEndTime": 474.26299999654293,
            "finished": true,
            "transferSize": 1542,
            "resourceSize": 2710,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BA4OeLkb.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.8070000037551,
            "networkRequestTime": 273.99300000816584,
            "networkEndTime": 448.59400000423193,
            "finished": true,
            "transferSize": 1574,
            "resourceSize": 2768,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/2.DLN4rKka.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.8640000000596,
            "networkRequestTime": 275.874000005424,
            "networkEndTime": 310.5070000067353,
            "finished": true,
            "transferSize": 7568,
            "resourceSize": 18086,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/SxdmL3tr.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.91699999570847,
            "networkRequestTime": 276.20200000703335,
            "networkEndTime": 452.609000004828,
            "finished": true,
            "transferSize": 1657,
            "resourceSize": 3904,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/GcZayWhp.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 244.9860000014305,
            "networkRequestTime": 279.9490000009537,
            "networkEndTime": 477.3430000022054,
            "finished": true,
            "transferSize": 3269,
            "resourceSize": 8368,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/D29clV72.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.0350000038743,
            "networkRequestTime": 282.22999999672174,
            "networkEndTime": 465.609000004828,
            "finished": true,
            "transferSize": 33103,
            "resourceSize": 108034,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/B_md0ljV.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.08900000154972,
            "networkRequestTime": 282.429000005126,
            "networkEndTime": 474.5729999989271,
            "finished": true,
            "transferSize": 2665,
            "resourceSize": 6418,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DLOUjN0J.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.1359999999404,
            "networkRequestTime": 282.6050000041723,
            "networkEndTime": 453.9620000049472,
            "finished": true,
            "transferSize": 2319,
            "resourceSize": 4231,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BUVuFJdU.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.18400000035763,
            "networkRequestTime": 284.62099999934435,
            "networkEndTime": 494.65800000727177,
            "finished": true,
            "transferSize": 935,
            "resourceSize": 1612,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/COG008Jk.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.23000000417233,
            "networkRequestTime": 284.7939999997616,
            "networkEndTime": 446.82500000298023,
            "finished": true,
            "transferSize": 1580,
            "resourceSize": 5068,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Dah2kLvO.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.277000002563,
            "networkRequestTime": 286.63499999791384,
            "networkEndTime": 467.01400000602007,
            "finished": true,
            "transferSize": 1601,
            "resourceSize": 2754,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/5.BlB5QYy-.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.3259999975562,
            "networkRequestTime": 287.45199999958277,
            "networkEndTime": 349.3670000061393,
            "finished": true,
            "transferSize": 211121,
            "resourceSize": 789722,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DnIIAdjd.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.3720000013709,
            "networkRequestTime": 287.597000002861,
            "networkEndTime": 447.02500000596046,
            "finished": true,
            "transferSize": 2038,
            "resourceSize": 4492,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CzzPEZpf.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.42000000178814,
            "networkRequestTime": 288.18900000303984,
            "networkEndTime": 468.7199999988079,
            "finished": true,
            "transferSize": 9494,
            "resourceSize": 32674,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Cr7efl_Y.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.4670000001788,
            "networkRequestTime": 288.34900000691414,
            "networkEndTime": 470.4219999983907,
            "finished": true,
            "transferSize": 1681,
            "resourceSize": 2862,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CleO1URB.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.51700000464916,
            "networkRequestTime": 288.4510000050068,
            "networkEndTime": 454.87699999660254,
            "finished": true,
            "transferSize": 4513,
            "resourceSize": 12177,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/MgusgrlE.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.57000000029802,
            "networkRequestTime": 289.19700000435114,
            "networkEndTime": 473.8260000050068,
            "finished": true,
            "transferSize": 1569,
            "resourceSize": 2725,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BUYLxQXO.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.61800000071526,
            "networkRequestTime": 289.36599999666214,
            "networkEndTime": 784.5400000065565,
            "finished": true,
            "transferSize": 1652,
            "resourceSize": 2704,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/36NkwCj5.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.66700000315905,
            "networkRequestTime": 289.472999997437,
            "networkEndTime": 783.1169999986887,
            "finished": true,
            "transferSize": 15922,
            "resourceSize": 53696,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Dvxa2FQc.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.71400000154972,
            "networkRequestTime": 290.63199999928474,
            "networkEndTime": 525.387000001967,
            "finished": true,
            "transferSize": 1578,
            "resourceSize": 5056,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BomsXeif.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.7609999999404,
            "networkRequestTime": 292.56100000441074,
            "networkEndTime": 469.6980000063777,
            "finished": true,
            "transferSize": 1819,
            "resourceSize": 7710,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Bbwy2ZER.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.80900000035763,
            "networkRequestTime": 292.7520000040531,
            "networkEndTime": 780.0590000003576,
            "finished": true,
            "transferSize": 1565,
            "resourceSize": 2806,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BZTRLxfo.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 245.85600000619888,
            "networkRequestTime": 293.7200000062585,
            "networkEndTime": 470.99599999934435,
            "finished": true,
            "transferSize": 1713,
            "resourceSize": 2881,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/token-signing-page-script.js",
            "sessionTargetType": "page",
            "protocol": "chrome-extension",
            "rendererStartTime": 433.87100000679493,
            "networkRequestTime": 433.87100000679493,
            "networkEndTime": 436.027999997139,
            "finished": true,
            "transferSize": 5846,
            "resourceSize": 5846,
            "statusCode": 200,
            "mimeType": "text/javascript",
            "resourceType": "Script",
            "priority": "Low",
            "experimentalFromMainFrame": true,
            "entity": "Web eID"
          },
          {
            "url": "https://www.todzz.eu/manifest.webmanifest",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 499.2639999985695,
            "networkRequestTime": 503.00600000470877,
            "networkEndTime": 702.0770000070333,
            "finished": true,
            "transferSize": 681,
            "resourceSize": 393,
            "statusCode": 200,
            "mimeType": "application/manifest+json",
            "resourceType": "Manifest",
            "priority": "Medium",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/pwa-192x192.png",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 704.8320000097156,
            "networkRequestTime": 705.4359999969602,
            "networkEndTime": 923.7660000026226,
            "finished": true,
            "transferSize": 4483,
            "resourceSize": 4306,
            "statusCode": 200,
            "mimeType": "image/png",
            "resourceType": "Other",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/1.fhCP6_Hn.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 770.5430000051856,
            "networkRequestTime": 771.1159999966621,
            "networkEndTime": 797.2010000050068,
            "finished": true,
            "transferSize": 3105,
            "resourceSize": 5587,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/DH5ytb2W.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 773.2470000013709,
            "networkRequestTime": 778.3300000056624,
            "networkEndTime": 1291.222000002861,
            "finished": true,
            "transferSize": 885,
            "resourceSize": 712,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_vercel/insights/script.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 787.1960000023246,
            "networkRequestTime": 787.8840000033379,
            "networkEndTime": 830.9060000032187,
            "finished": true,
            "transferSize": 1362,
            "resourceSize": 2383,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "Low",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_vercel/speed-insights/script.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 787.9650000035763,
            "networkRequestTime": 788.7409999966621,
            "networkEndTime": 813.1930000036955,
            "finished": true,
            "transferSize": 4937,
            "resourceSize": 12459,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "Low",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1379.1700000017881,
            "networkRequestTime": 1379.9830000028014,
            "networkEndTime": 1538.137999996543,
            "finished": true,
            "transferSize": 1654,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BvIGJKPt.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1381.1480000019073,
            "networkRequestTime": 1381.8680000007153,
            "networkEndTime": 1546.7520000040531,
            "finished": true,
            "transferSize": 1076,
            "resourceSize": 883,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/BoMrEAts.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1383.862000003457,
            "networkRequestTime": 1384.5190000012517,
            "networkEndTime": 1559.0960000008345,
            "finished": true,
            "transferSize": 8018,
            "resourceSize": 22489,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CH0_tLfd.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1384.152000002563,
            "networkRequestTime": 1384.7480000033975,
            "networkEndTime": 1598.057000003755,
            "finished": true,
            "transferSize": 8545,
            "resourceSize": 23181,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/_vercel/insights/view",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1385.3929999992251,
            "networkRequestTime": 1386.4790000021458,
            "networkEndTime": 1454.0460000038147,
            "finished": true,
            "transferSize": 152,
            "resourceSize": 2,
            "statusCode": 200,
            "mimeType": "text/plain",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/manifest.webmanifest",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1396.6150000020862,
            "networkRequestTime": 1397.5810000002384,
            "networkEndTime": 1420.695000000298,
            "finished": true,
            "transferSize": 67,
            "resourceSize": 393,
            "statusCode": 200,
            "mimeType": "application/manifest+json",
            "resourceType": "Manifest",
            "priority": "Medium",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1402.2960000038147,
            "networkRequestTime": 1403.085000000894,
            "networkEndTime": 1706.5070000067353,
            "finished": true,
            "transferSize": 1658,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1402.9350000023842,
            "networkRequestTime": 1403.8050000071526,
            "networkEndTime": 1874.746000006795,
            "finished": true,
            "transferSize": 1657,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1403.5810000002384,
            "networkRequestTime": 1404.444000005722,
            "networkEndTime": 2039.7680000066757,
            "finished": true,
            "transferSize": 1661,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/pwa-192x192.png",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1422.2040000036359,
            "networkRequestTime": 1422.7590000033379,
            "networkEndTime": 1443.4230000004172,
            "finished": true,
            "transferSize": 53,
            "resourceSize": 4306,
            "statusCode": 200,
            "mimeType": "image/png",
            "resourceType": "Other",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1542.3020000010729,
            "networkRequestTime": 1556.9130000025034,
            "networkEndTime": 1575.140000000596,
            "finished": true,
            "transferSize": 1414,
            "resourceSize": 1872,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1543.9680000022054,
            "networkRequestTime": 1543.2360000014305,
            "networkEndTime": 1556.7739999964833,
            "finished": true,
            "transferSize": 0,
            "resourceSize": 0,
            "statusCode": 204,
            "mimeType": "",
            "resourceType": "Preflight",
            "priority": "High",
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwtvwXb3.js",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1548.5950000062585,
            "networkRequestTime": 1549.2089999988675,
            "networkEndTime": 1742.1440000012517,
            "finished": true,
            "transferSize": 2618,
            "resourceSize": 5760,
            "statusCode": 200,
            "mimeType": "application/javascript",
            "resourceType": "Script",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1582.987000003457,
            "networkRequestTime": 1583.9809999987483,
            "networkEndTime": 2209.414999999106,
            "finished": true,
            "transferSize": 1657,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://i.imgur.com/b9hxDbH.png",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1584.1870000064373,
            "networkRequestTime": 1584.9390000030398,
            "networkEndTime": 1766.1140000000596,
            "finished": true,
            "transferSize": 56196,
            "resourceSize": 55713,
            "statusCode": 200,
            "mimeType": "image/png",
            "resourceType": "Image",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "Imgur"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1584.792000003159,
            "networkRequestTime": 1585.5680000036955,
            "networkEndTime": 2375.7750000059605,
            "finished": true,
            "transferSize": 1655,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1709.2040000036359,
            "networkRequestTime": 1710.1180000081658,
            "networkEndTime": 1732.542999997735,
            "finished": true,
            "transferSize": 3478,
            "resourceSize": 14039,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1738.2829999998212,
            "networkRequestTime": 1738.847000002861,
            "networkEndTime": 2575.9460000023246,
            "finished": true,
            "transferSize": 1634,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1739.2660000026226,
            "networkRequestTime": 1739.91400000453,
            "networkEndTime": 2728.6990000009537,
            "finished": true,
            "transferSize": 1640,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1739.8299999982119,
            "networkRequestTime": 1740.5749999955297,
            "networkEndTime": 2884.2690000012517,
            "finished": true,
            "transferSize": 1690,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1740.6410000026226,
            "networkRequestTime": 1741.8659999966621,
            "networkEndTime": 3041.7180000022054,
            "finished": true,
            "transferSize": 1664,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 1877.9280000030994,
            "networkRequestTime": 1878.5730000063777,
            "networkEndTime": 1899.484000004828,
            "finished": true,
            "transferSize": 2968,
            "resourceSize": 13892,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2044.594999998808,
            "networkRequestTime": 2045.3669999986887,
            "networkEndTime": 2069.471000008285,
            "finished": true,
            "transferSize": 3477,
            "resourceSize": 14039,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2072.4830000028014,
            "networkRequestTime": 2073.195000000298,
            "networkEndTime": 3203.9030000045896,
            "finished": true,
            "transferSize": 1646,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2072.9550000056624,
            "networkRequestTime": 2073.596000008285,
            "networkEndTime": 3370.7419999986887,
            "finished": true,
            "transferSize": 1672,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2073.5340000092983,
            "networkRequestTime": 2074.420000001788,
            "networkEndTime": 3531.8219999969006,
            "finished": true,
            "transferSize": 1642,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2212.846000008285,
            "networkRequestTime": 2213.4670000076294,
            "networkEndTime": 2235.106000006199,
            "finished": true,
            "transferSize": 338,
            "resourceSize": 33,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2378.7050000056624,
            "networkRequestTime": 2379.2889999970794,
            "networkEndTime": 2400.9800000041723,
            "finished": true,
            "transferSize": 3477,
            "resourceSize": 14039,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2403.819000005722,
            "networkRequestTime": 2404.4090000018477,
            "networkEndTime": 3688.567000001669,
            "finished": true,
            "transferSize": 1658,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2404.282000005245,
            "networkRequestTime": 2404.9050000086427,
            "networkEndTime": 3843.8110000044107,
            "finished": true,
            "transferSize": 1680,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2578.6759999990463,
            "networkRequestTime": 2579.4039999991655,
            "networkEndTime": 2600.1930000036955,
            "finished": true,
            "transferSize": 1446,
            "resourceSize": 1916,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2603.1870000064373,
            "networkRequestTime": 2603.9100000038743,
            "networkEndTime": 4000.4039999991655,
            "finished": true,
            "transferSize": 1641,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2731.3730000033975,
            "networkRequestTime": 2731.9860000014305,
            "networkEndTime": 2765.0920000076294,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "data:image/svg+xml,%3csvg%20role='img'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/…",
            "sessionTargetType": "page",
            "protocol": "data",
            "rendererStartTime": 2863.524000003934,
            "networkRequestTime": 2863.524000003934,
            "networkEndTime": 2863.6290000006557,
            "finished": true,
            "transferSize": 0,
            "resourceSize": 823,
            "statusCode": 200,
            "mimeType": "image/svg+xml",
            "resourceType": "Image",
            "priority": "Low",
            "experimentalFromMainFrame": true
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2901.7000000029802,
            "networkRequestTime": 2902.6440000012517,
            "networkEndTime": 4158.7480000033975,
            "finished": true,
            "transferSize": 1672,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2904.1860000044107,
            "networkRequestTime": 2907.951000005007,
            "networkEndTime": 2942.8660000041127,
            "finished": true,
            "transferSize": 7076,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 2968.3850000053644,
            "networkRequestTime": 2972.244000002742,
            "networkEndTime": 4316.47500000149,
            "finished": true,
            "transferSize": 1639,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3045.2700000032783,
            "networkRequestTime": 3045.9090000018477,
            "networkEndTime": 3077.320000000298,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3060.0750000029802,
            "networkRequestTime": 3060.8119999989867,
            "networkEndTime": 4472.7630000039935,
            "finished": true,
            "transferSize": 1649,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3187.6590000092983,
            "networkRequestTime": 3188.5580000057817,
            "networkEndTime": 4626.006999999285,
            "finished": true,
            "transferSize": 1686,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3206.3460000008345,
            "networkRequestTime": 3207.012000001967,
            "networkEndTime": 3245.484999999404,
            "finished": true,
            "transferSize": 7084,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3354.3159999996424,
            "networkRequestTime": 3355.0260000005364,
            "networkEndTime": 4781.539999999106,
            "finished": true,
            "transferSize": 1643,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3373.1500000059605,
            "networkRequestTime": 3373.8270000070333,
            "networkEndTime": 3408.017000004649,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3516.210000000894,
            "networkRequestTime": 3517.017999999225,
            "networkEndTime": 4948.670000001788,
            "finished": true,
            "transferSize": 1648,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3533.9450000077486,
            "networkRequestTime": 3534.5769999995828,
            "networkEndTime": 3569.454999998212,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3686.807000003755,
            "networkRequestTime": 3688.4030000045896,
            "networkEndTime": 5108.891000002623,
            "finished": true,
            "transferSize": 1665,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3690.935000002384,
            "networkRequestTime": 3691.6840000003576,
            "networkEndTime": 3726.02499999851,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3839.1110000014305,
            "networkRequestTime": 3839.7400000095367,
            "networkEndTime": 5266.182000003755,
            "finished": true,
            "transferSize": 1626,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3846.0070000067353,
            "networkRequestTime": 3846.6530000045896,
            "networkEndTime": 3880.2410000041127,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 3996.371000006795,
            "networkRequestTime": 3997.2630000039935,
            "networkEndTime": 5423.64999999851,
            "finished": true,
            "transferSize": 1693,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4002.7859999984503,
            "networkRequestTime": 4003.527000002563,
            "networkEndTime": 4042.7910000011325,
            "finished": true,
            "transferSize": 7075,
            "resourceSize": 38686,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4149.867000006139,
            "networkRequestTime": 4150.656999997795,
            "networkEndTime": 5581.145999997854,
            "finished": true,
            "transferSize": 1664,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4161.957000002265,
            "networkRequestTime": 4162.765000000596,
            "networkEndTime": 4187.884000003338,
            "finished": true,
            "transferSize": 3477,
            "resourceSize": 14039,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4318.865000002086,
            "networkRequestTime": 4319.530000001192,
            "networkEndTime": 4353.896000005305,
            "finished": true,
            "transferSize": 325,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4356.137000001967,
            "networkRequestTime": 4356.756000004709,
            "networkEndTime": 5735.286000005901,
            "finished": true,
            "transferSize": 1632,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4475.282999999821,
            "networkRequestTime": 4476.074000000954,
            "networkEndTime": 4511.742000006139,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4514.065000005066,
            "networkRequestTime": 4514.774000003934,
            "networkEndTime": 5893.644999995828,
            "finished": true,
            "transferSize": 1688,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4628.285000003874,
            "networkRequestTime": 4628.945000000298,
            "networkEndTime": 4662.5250000059605,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4665.01099999994,
            "networkRequestTime": 4665.694000005722,
            "networkEndTime": 6055.846000008285,
            "finished": true,
            "transferSize": 1664,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4783.804999999702,
            "networkRequestTime": 4784.434000000358,
            "networkEndTime": 4816.935000002384,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4819.012000001967,
            "networkRequestTime": 4819.635000005364,
            "networkEndTime": 6208.229000002146,
            "finished": true,
            "transferSize": 1625,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4951.354999996722,
            "networkRequestTime": 4952.587999999523,
            "networkEndTime": 4986.157999999821,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 4988.445000007749,
            "networkRequestTime": 4989.626000002027,
            "networkEndTime": 6365.428999997675,
            "finished": true,
            "transferSize": 1686,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5111.651000000536,
            "networkRequestTime": 5112.81400000304,
            "networkEndTime": 5144.445000000298,
            "finished": true,
            "transferSize": 327,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5146.459000006318,
            "networkRequestTime": 5147.483000002801,
            "networkEndTime": 6520.359000004828,
            "finished": true,
            "transferSize": 1661,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5268.497000001371,
            "networkRequestTime": 5269.5410000011325,
            "networkEndTime": 5302.428000003099,
            "finished": true,
            "transferSize": 327,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5304.747000001371,
            "networkRequestTime": 5305.8450000062585,
            "networkEndTime": 6689.056000009179,
            "finished": true,
            "transferSize": 1625,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5426.949000000954,
            "networkRequestTime": 5428.021000005305,
            "networkEndTime": 5459.533000007272,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5461.501000002027,
            "networkRequestTime": 5462.550999999046,
            "networkEndTime": 6851.949000000954,
            "finished": true,
            "transferSize": 1690,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5583.3060000017285,
            "networkRequestTime": 5584.412000000477,
            "networkEndTime": 5616.854000002146,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://www.todzz.eu/api/auth/token",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5619.469999998808,
            "networkRequestTime": 5620.491000004113,
            "networkEndTime": 7029.282000005245,
            "finished": true,
            "transferSize": 1661,
            "resourceSize": 508,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "todzz.eu"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5737.631999999285,
            "networkRequestTime": 5738.68900000304,
            "networkEndTime": 5772.196000002325,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 5896.168999999762,
            "networkRequestTime": 5897.186000004411,
            "networkEndTime": 5927.370999999344,
            "finished": true,
            "transferSize": 325,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6058.353000000119,
            "networkRequestTime": 6059.766000002623,
            "networkEndTime": 6092.038000002503,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6210.8720000088215,
            "networkRequestTime": 6211.9710000008345,
            "networkEndTime": 6246.668999999762,
            "finished": true,
            "transferSize": 325,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6367.637999996543,
            "networkRequestTime": 6368.684000000358,
            "networkEndTime": 6400.799000002444,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6522.964999996126,
            "networkRequestTime": 6524.130000002682,
            "networkEndTime": 6558.961000002921,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6691.782000005245,
            "networkRequestTime": 6693.076000005007,
            "networkEndTime": 6726.953000001609,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 6854.509000003338,
            "networkRequestTime": 6855.6269999966025,
            "networkEndTime": 6888.298000000417,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          },
          {
            "url": "https://todzz.admin.servicehost.io/v1/graphql",
            "sessionTargetType": "page",
            "protocol": "h2",
            "rendererStartTime": 7031.0830000042915,
            "networkRequestTime": 7032.069000005722,
            "networkEndTime": 7065.468000002205,
            "finished": true,
            "transferSize": 326,
            "resourceSize": 21,
            "statusCode": 200,
            "mimeType": "application/json",
            "resourceType": "Fetch",
            "priority": "High",
            "experimentalFromMainFrame": true,
            "entity": "servicehost.io"
          }
        ],
        "debugData": {
          "type": "debugdata",
          "networkStartTimeTs": 60259454609,
          "initiators": [
            {
              "type": "preflight",
              "url": "https://todzz.admin.servicehost.io/v1/graphql"
            }
          ]
        }
      }
    },
    "network-rtt": {
      "id": "network-rtt",
      "title": "Network Round Trip Times",
      "description": "Network round trip times (RTT) have a large impact on performance. If the RTT to an origin is high, it's an indication that servers closer to the user could improve performance. [Learn more about the Round Trip Time](https://hpbn.co/primer-on-latency-and-bandwidth/).",
      "score": 1,
      "scoreDisplayMode": "informative",
      "numericValue": 40.611000000000004,
      "numericUnit": "millisecond",
      "displayValue": "40 ms",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "origin",
            "valueType": "text",
            "label": "URL"
          },
          {
            "key": "rtt",
            "valueType": "ms",
            "granularity": 1,
            "label": "Time Spent"
          }
        ],
        "items": [
          {
            "origin": "https://i.imgur.com",
            "rtt": 40.611000000000004
          },
          {
            "origin": "https://todzz.admin.servicehost.io",
            "rtt": 0.8999999999999999
          },
          {
            "origin": "https://www.todzz.eu",
            "rtt": 0.10779999999999999
          }
        ],
        "sortedBy": [
          "rtt"
        ]
      }
    },
    "network-server-latency": {
      "id": "network-server-latency",
      "title": "Server Backend Latencies",
      "description": "Server latencies can impact web performance. If the server latency of an origin is high, it's an indication the server is overloaded or has poor backend performance. [Learn more about server response time](https://hpbn.co/primer-on-web-performance/#analyzing-the-resource-waterfall).",
      "score": 1,
      "scoreDisplayMode": "informative",
      "numericValue": 162.47820000000002,
      "numericUnit": "millisecond",
      "displayValue": "160 ms",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "origin",
            "valueType": "text",
            "label": "URL"
          },
          {
            "key": "serverResponseTime",
            "valueType": "ms",
            "granularity": 1,
            "label": "Time Spent"
          }
        ],
        "items": [
          {
            "origin": "https://www.todzz.eu",
            "serverResponseTime": 162.47820000000002
          },
          {
            "origin": "https://todzz.admin.servicehost.io",
            "serverResponseTime": 31.0475
          },
          {
            "origin": "https://i.imgur.com",
            "serverResponseTime": 0.8859999999999957
          }
        ],
        "sortedBy": [
          "serverResponseTime"
        ]
      }
    },
    "main-thread-tasks": {
      "id": "main-thread-tasks",
      "title": "Tasks",
      "description": "Lists the toplevel main thread tasks that executed during page load.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "startTime",
            "valueType": "ms",
            "granularity": 1,
            "label": "Start Time"
          },
          {
            "key": "duration",
            "valueType": "ms",
            "granularity": 1,
            "label": "End Time"
          }
        ],
        "items": [
          {
            "duration": 9.885,
            "startTime": 184.894
          },
          {
            "duration": 36.397,
            "startTime": 195.218
          },
          {
            "duration": 39.981,
            "startTime": 231.65
          },
          {
            "duration": 7.396,
            "startTime": 419.228
          },
          {
            "duration": 5.239,
            "startTime": 430.473
          },
          {
            "duration": 29.502,
            "startTime": 435.719
          },
          {
            "duration": 7.475,
            "startTime": 768.679
          },
          {
            "duration": 13.419,
            "startTime": 778.469
          },
          {
            "duration": 89.727,
            "startTime": 1298.181
          },
          {
            "duration": 6.383,
            "startTime": 1579.195
          },
          {
            "duration": 10.207,
            "startTime": 1600.29
          },
          {
            "duration": 5.572,
            "startTime": 1742.284
          },
          {
            "duration": 100.003,
            "startTime": 2767.656
          },
          {
            "duration": 32.62,
            "startTime": 2867.784
          }
        ]
      }
    },
    "metrics": {
      "id": "metrics",
      "title": "Metrics",
      "description": "Collects all available metrics.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "numericValue": 1234,
      "numericUnit": "millisecond",
      "details": {
        "type": "debugdata",
        "items": [
          {
            "firstContentfulPaint": 642,
            "largestContentfulPaint": 1212,
            "interactive": 1234,
            "speedIndex": 1439,
            "totalBlockingTime": 20,
            "maxPotentialFID": 90,
            "cumulativeLayoutShift": 0.0032676689411467695,
            "cumulativeLayoutShiftMainFrame": 0.0032676689411467695,
            "timeToFirstByte": 322,
            "observedTimeOrigin": 0,
            "observedTimeOriginTs": 60259453613,
            "observedNavigationStart": 0,
            "observedNavigationStartTs": 60259453613,
            "observedFirstPaint": 441,
            "observedFirstPaintTs": 60259894826,
            "observedFirstContentfulPaint": 441,
            "observedFirstContentfulPaintTs": 60259894826,
            "observedFirstContentfulPaintAllFrames": 441,
            "observedFirstContentfulPaintAllFramesTs": 60259894826,
            "observedLargestContentfulPaint": 2941,
            "observedLargestContentfulPaintTs": 60262394952,
            "observedLargestContentfulPaintAllFrames": 2941,
            "observedLargestContentfulPaintAllFramesTs": 60262394952,
            "observedTraceEnd": 9417,
            "observedTraceEndTs": 60268870281,
            "observedLoad": 499,
            "observedLoadTs": 60259952804,
            "observedDomContentLoaded": 1,
            "observedDomContentLoadedTs": 60259454156,
            "observedCumulativeLayoutShift": 0.0032676689411467695,
            "observedCumulativeLayoutShiftMainFrame": 0.0032676689411467695,
            "observedFirstVisualChange": 445,
            "observedFirstVisualChangeTs": 60259898613,
            "observedLastVisualChange": 2953,
            "observedLastVisualChangeTs": 60262406613,
            "observedSpeedIndex": 1767,
            "observedSpeedIndexTs": 60261221102
          },
          {
            "lcpInvalidated": false
          }
        ]
      }
    },
    "resource-summary": {
      "id": "resource-summary",
      "title": "Resources Summary",
      "description": "Aggregates all network requests and groups them by type",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "label",
            "valueType": "text",
            "label": "Resource Type"
          },
          {
            "key": "requestCount",
            "valueType": "numeric",
            "label": "Requests"
          },
          {
            "key": "transferSize",
            "valueType": "bytes",
            "label": "Transfer Size"
          }
        ],
        "items": [
          {
            "resourceType": "total",
            "label": "Total",
            "requestCount": 138,
            "transferSize": 683128
          },
          {
            "resourceType": "script",
            "label": "Script",
            "requestCount": 58,
            "transferSize": 449786
          },
          {
            "resourceType": "other",
            "label": "Other",
            "requestCount": 76,
            "transferSize": 153089
          },
          {
            "resourceType": "image",
            "label": "Image",
            "requestCount": 1,
            "transferSize": 56196
          },
          {
            "resourceType": "stylesheet",
            "label": "Stylesheet",
            "requestCount": 2,
            "transferSize": 15867
          },
          {
            "resourceType": "document",
            "label": "Document",
            "requestCount": 1,
            "transferSize": 8190
          },
          {
            "resourceType": "media",
            "label": "Media",
            "requestCount": 0,
            "transferSize": 0
          },
          {
            "resourceType": "font",
            "label": "Font",
            "requestCount": 0,
            "transferSize": 0
          },
          {
            "resourceType": "third-party",
            "label": "Third-party",
            "requestCount": 37,
            "transferSize": 145823
          }
        ]
      }
    },
    "third-party-summary": {
      "id": "third-party-summary",
      "title": "Minimize third-party usage",
      "description": "Third-party code can significantly impact load performance. Limit the number of redundant third-party providers and try to load third-party code after your page has primarily finished loading. [Learn how to minimize third-party impact](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/loading-third-party-javascript/).",
      "score": 1,
      "scoreDisplayMode": "informative",
      "displayValue": "Third-party code blocked the main thread for 0 ms",
      "metricSavings": {
        "TBT": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "entity",
            "valueType": "text",
            "label": "Third-Party",
            "subItemsHeading": {
              "key": "url",
              "valueType": "url"
            }
          },
          {
            "key": "transferSize",
            "granularity": 1,
            "valueType": "bytes",
            "label": "Transfer Size",
            "subItemsHeading": {
              "key": "transferSize"
            }
          },
          {
            "key": "blockingTime",
            "granularity": 1,
            "valueType": "ms",
            "label": "Main-Thread Blocking Time",
            "subItemsHeading": {
              "key": "blockingTime"
            }
          }
        ],
        "items": [
          {
            "mainThreadTime": 0,
            "blockingTime": 0,
            "transferSize": 89627,
            "tbtImpact": 0,
            "entity": "servicehost.io",
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "https://todzz.admin.servicehost.io/v1/graphql",
                  "mainThreadTime": 0,
                  "blockingTime": 0,
                  "transferSize": 89627,
                  "tbtImpact": 0
                }
              ]
            }
          },
          {
            "mainThreadTime": 0,
            "blockingTime": 0,
            "transferSize": 56196,
            "tbtImpact": 0,
            "entity": "Imgur",
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "https://i.imgur.com/b9hxDbH.png",
                  "mainThreadTime": 0,
                  "blockingTime": 0,
                  "transferSize": 56196,
                  "tbtImpact": 0
                }
              ]
            }
          },
          {
            "mainThreadTime": 0.43400000000000005,
            "blockingTime": 0,
            "transferSize": 5846,
            "tbtImpact": 0,
            "entity": "Web eID",
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/token-signing-page-script.js",
                  "mainThreadTime": 0.43400000000000005,
                  "blockingTime": 0,
                  "transferSize": 5846,
                  "tbtImpact": 0
                }
              ]
            }
          }
        ],
        "summary": {
          "wastedBytes": 151669,
          "wastedMs": 0
        },
        "isEntityGrouped": true
      },
      "guidanceLevel": 1
    },
    "third-party-facades": {
      "id": "third-party-facades",
      "title": "Lazy load third-party resources with facades",
      "description": "Some third-party embeds can be lazy loaded. Consider replacing them with a facade until they are required. [Learn how to defer third-parties with a facade](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades/).",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "metricSavings": {
        "TBT": 0
      },
      "guidanceLevel": 3
    },
    "largest-contentful-paint-element": {
      "id": "largest-contentful-paint-element",
      "title": "Largest Contentful Paint element",
      "description": "This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)",
      "score": 0.5,
      "scoreDisplayMode": "metricSavings",
      "displayValue": "1,210 ms",
      "metricSavings": {
        "LCP": 0
      },
      "details": {
        "type": "list",
        "items": [
          {
            "type": "table",
            "headings": [
              {
                "key": "node",
                "valueType": "node",
                "label": "Element"
              }
            ],
            "items": [
              {
                "node": {
                  "type": "node",
                  "lhId": "page-0-H3",
                  "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,1,DIV,0,DIV,0,DIV,3,DIV,0,DIV,67,DIV,1,DIV,0,A,0,DIV,4,DIV,0,DIV,1,DIV,0,H3",
                  "selector": "div.p-2 > div.flex > div.min-w-0 > h3.text-sm",
                  "boundingRect": {
                    "top": 821,
                    "bottom": 944,
                    "left": 442,
                    "right": 638,
                    "width": 196,
                    "height": 123
                  },
                  "snippet": "<h3 class=\"text-sm leading-tight font-medium \">",
                  "nodeLabel": "Äppi kasutajaid fake gamification & nutilukud + sinu reklaam + loomapood + tell…"
                }
              }
            ]
          },
          {
            "type": "table",
            "headings": [
              {
                "key": "phase",
                "valueType": "text",
                "label": "Phase"
              },
              {
                "key": "percent",
                "valueType": "text",
                "label": "% of LCP"
              },
              {
                "key": "timing",
                "valueType": "ms",
                "label": "Timing"
              }
            ],
            "items": [
              {
                "phase": "TTFB",
                "timing": 322.4782,
                "percent": "27%"
              },
              {
                "phase": "Load Delay",
                "timing": 0,
                "percent": "0%"
              },
              {
                "phase": "Load Time",
                "timing": 0,
                "percent": "0%"
              },
              {
                "phase": "Render Delay",
                "timing": 890,
                "percent": "73%"
              }
            ]
          }
        ]
      },
      "guidanceLevel": 1
    },
    "lcp-lazy-loaded": {
      "id": "lcp-lazy-loaded",
      "title": "Largest Contentful Paint image was not lazily loaded",
      "description": "Above-the-fold images that are lazily loaded render later in the page lifecycle, which can delay the largest contentful paint. [Learn more about optimal lazy loading](https://web.dev/articles/lcp-lazy-loading).",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "metricSavings": {
        "LCP": 0
      },
      "guidanceLevel": 3
    },
    "layout-shifts": {
      "id": "layout-shifts",
      "title": "Avoid large layout shifts",
      "description": "These are the largest layout shifts observed on the page. Each table item represents a single layout shift, and shows the element that shifted the most. Below each item are possible root causes that led to the layout shift. Some of these layout shifts may not be included in the CLS metric value due to [windowing](https://web.dev/articles/cls#what_is_cls). [Learn how to improve CLS](https://web.dev/articles/optimize-cls)",
      "score": 1,
      "scoreDisplayMode": "informative",
      "displayValue": "3 layout shifts found",
      "metricSavings": {
        "CLS": 0.003
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "subItemsHeading": {
              "key": "extra"
            },
            "label": "Element"
          },
          {
            "key": "score",
            "valueType": "numeric",
            "subItemsHeading": {
              "key": "cause",
              "valueType": "text"
            },
            "granularity": 0.001,
            "label": "Layout shift score"
          }
        ],
        "items": [
          {
            "node": {
              "type": "node",
              "lhId": "page-1-DIV",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
              "selector": "header.sticky > div.w-full > nav.flex > div.flex",
              "boundingRect": {
                "top": 16,
                "bottom": 52,
                "left": 560,
                "right": 856,
                "width": 296,
                "height": 36
              },
              "snippet": "<div class=\"flex items-center gap-2\">",
              "nodeLabel": "Perroz"
            },
            "score": 0.002602856843738938
          },
          {
            "node": {
              "type": "node",
              "lhId": "page-1-DIV",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
              "selector": "header.sticky > div.w-full > nav.flex > div.flex",
              "boundingRect": {
                "top": 16,
                "bottom": 52,
                "left": 560,
                "right": 856,
                "width": 296,
                "height": 36
              },
              "snippet": "<div class=\"flex items-center gap-2\">",
              "nodeLabel": "Perroz"
            },
            "score": 0.0006648120974078319
          },
          {
            "node": {
              "type": "node",
              "lhId": "page-1-DIV",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
              "selector": "header.sticky > div.w-full > nav.flex > div.flex",
              "boundingRect": {
                "top": 16,
                "bottom": 52,
                "left": 560,
                "right": 856,
                "width": 296,
                "height": 36
              },
              "snippet": "<div class=\"flex items-center gap-2\">",
              "nodeLabel": "Perroz"
            },
            "score": 0.00022885951653669066
          }
        ]
      },
      "guidanceLevel": 2
    },
    "long-tasks": {
      "id": "long-tasks",
      "title": "Avoid long main-thread tasks",
      "description": "Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay. [Learn how to avoid long main-thread tasks](https://web.dev/articles/optimize-long-tasks)",
      "score": 1,
      "scoreDisplayMode": "informative",
      "displayValue": "2 long tasks found",
      "metricSavings": {
        "TBT": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "startTime",
            "valueType": "ms",
            "granularity": 1,
            "label": "Start Time"
          },
          {
            "key": "duration",
            "valueType": "ms",
            "granularity": 1,
            "label": "Duration"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "duration": 90,
            "startTime": 1162.4782
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "duration": 50,
            "startTime": 1042.4782
          }
        ],
        "sortedBy": [
          "duration"
        ],
        "skipSumming": [
          "startTime"
        ],
        "debugData": {
          "type": "debugdata",
          "urls": [
            "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js"
          ],
          "tasks": [
            {
              "urlIndex": 0,
              "startTime": 1162.5,
              "duration": 90,
              "other": 90,
              "scriptEvaluation": 0
            },
            {
              "urlIndex": 0,
              "startTime": 1042.5,
              "duration": 50,
              "other": 50,
              "scriptEvaluation": 0
            }
          ]
        }
      },
      "guidanceLevel": 1
    },
    "non-composited-animations": {
      "id": "non-composited-animations",
      "title": "Avoid non-composited animations",
      "description": "Animations which are not composited can be janky and increase CLS. [Learn how to avoid non-composited animations](https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations/)",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "metricSavings": {
        "CLS": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "subItemsHeading": {
              "key": "failureReason",
              "valueType": "text"
            },
            "label": "Element"
          }
        ],
        "items": []
      },
      "guidanceLevel": 2
    },
    "unsized-images": {
      "id": "unsized-images",
      "title": "Image elements have explicit `width` and `height`",
      "description": "Set an explicit width and height on image elements to reduce layout shifts and improve CLS. [Learn how to set image dimensions](https://web.dev/articles/optimize-cls#images_without_dimensions)",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "CLS": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "label": ""
          },
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          }
        ],
        "items": []
      },
      "guidanceLevel": 4
    },
    "prioritize-lcp-image": {
      "id": "prioritize-lcp-image",
      "title": "Preload Largest Contentful Paint image",
      "description": "If the LCP element is dynamically added to the page, you should preload the image in order to improve LCP. [Learn more about preloading LCP elements](https://web.dev/articles/optimize-lcp#optimize_when_the_resource_is_discovered).",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "metricSavings": {
        "LCP": 0
      },
      "guidanceLevel": 4
    },
    "script-treemap-data": {
      "id": "script-treemap-data",
      "title": "Script Treemap Data",
      "description": "Used for treemap app",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "treemap-data",
        "nodes": [
          {
            "name": "https://www.todzz.eu/et/kaspar/perroz",
            "resourceBytes": 3673,
            "encodedBytes": 770,
            "children": [
              {
                "name": "(inline) (function setIn…",
                "resourceBytes": 1644,
                "unusedBytes": 0
              },
              {
                "name": "(inline) {\n\t\t\t\t\t__svelte…",
                "resourceBytes": 2029,
                "unusedBytes": 0
              }
            ]
          },
          {
            "name": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/content.js",
            "resourceBytes": 51782,
            "encodedBytes": 51782,
            "unusedBytes": 15981
          },
          {
            "name": "chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/content_script.js",
            "resourceBytes": 429847,
            "encodedBytes": 429847,
            "unusedBytes": 133104
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/entry/start.BBQRHtko.js",
            "resourceBytes": 118,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Bc2t17NI.js",
            "resourceBytes": 25937,
            "encodedBytes": 7399,
            "unusedBytes": 17564
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DDU36747.js",
            "resourceBytes": 1267,
            "encodedBytes": 0,
            "unusedBytes": 551
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "resourceBytes": 30676,
            "encodedBytes": 0,
            "unusedBytes": 7847
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DPpvDsKI.js",
            "resourceBytes": 416,
            "encodedBytes": 0,
            "unusedBytes": 171
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CJS_5WkZ.js",
            "resourceBytes": 6320,
            "encodedBytes": 0,
            "unusedBytes": 3403
          },
          {
            "name": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/token-signing-page-script.js",
            "resourceBytes": 5846,
            "encodedBytes": 5847,
            "unusedBytes": 3925
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/entry/app.DD8hBrVA.js",
            "resourceBytes": 8022,
            "encodedBytes": 0,
            "unusedBytes": 2567
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/PPVm8Dsz.js",
            "resourceBytes": 1232,
            "encodedBytes": 0,
            "unusedBytes": 285
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DsnmJJEf.js",
            "resourceBytes": 66,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CYtBgnGG.js",
            "resourceBytes": 792,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CbtWwMml.js",
            "resourceBytes": 549,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BGmsFsoN.js",
            "resourceBytes": 302,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DHU-rktX.js",
            "resourceBytes": 3460,
            "encodedBytes": 0,
            "unusedBytes": 410
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/nodes/0.DZSSM0NM.js",
            "resourceBytes": 26833,
            "encodedBytes": 0,
            "unusedBytes": 11118
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BLVKJNdn.js",
            "resourceBytes": 2845,
            "encodedBytes": 0,
            "unusedBytes": 2437
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CQF_21zV.js",
            "resourceBytes": 39,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DfV_oJU6.js",
            "resourceBytes": 13244,
            "encodedBytes": 0,
            "unusedBytes": 2321
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BnHrUGYK.js",
            "resourceBytes": 2032,
            "encodedBytes": 0,
            "unusedBytes": 186
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BkoSttyr.js",
            "resourceBytes": 619,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/d2bRpw1x.js",
            "resourceBytes": 119919,
            "encodedBytes": 22495,
            "unusedBytes": 26227
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DHcTXZZ1.js",
            "resourceBytes": 227,
            "encodedBytes": 0,
            "unusedBytes": 56
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Bq5jhTTe.js",
            "resourceBytes": 14639,
            "encodedBytes": 0,
            "unusedBytes": 4284
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CdVPB6xn.js",
            "resourceBytes": 2184,
            "encodedBytes": 0,
            "unusedBytes": 1531
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DFsmf67A.js",
            "resourceBytes": 5575,
            "encodedBytes": 0,
            "unusedBytes": 2982
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/ChxxQyAj.js",
            "resourceBytes": 33904,
            "encodedBytes": 8332,
            "unusedBytes": 3875
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BaJ2CNeu.js",
            "resourceBytes": 197,
            "encodedBytes": 0,
            "unusedBytes": 108
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Dogyu7fo.js",
            "resourceBytes": 2667,
            "encodedBytes": 0,
            "unusedBytes": 2477
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/D_IBngDt.js",
            "resourceBytes": 2710,
            "encodedBytes": 0,
            "unusedBytes": 2520
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BA4OeLkb.js",
            "resourceBytes": 2768,
            "encodedBytes": 0,
            "unusedBytes": 2578
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/nodes/1.fhCP6_Hn.js",
            "resourceBytes": 5587,
            "encodedBytes": 0,
            "unusedBytes": 4316
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Cr7efl_Y.js",
            "resourceBytes": 2862,
            "encodedBytes": 0,
            "unusedBytes": 15
          },
          {
            "name": "https://www.todzz.eu/_vercel/speed-insights/script.js",
            "resourceBytes": 12459,
            "encodedBytes": 0,
            "unusedBytes": 6498
          },
          {
            "name": "https://www.todzz.eu/_vercel/insights/script.js",
            "resourceBytes": 2383,
            "encodedBytes": 0,
            "unusedBytes": 508
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/nodes/2.DLN4rKka.js",
            "resourceBytes": 18066,
            "encodedBytes": 4086,
            "unusedBytes": 8419
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/SxdmL3tr.js",
            "resourceBytes": 3904,
            "encodedBytes": 0,
            "unusedBytes": 1023
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/GcZayWhp.js",
            "resourceBytes": 8368,
            "encodedBytes": 0,
            "unusedBytes": 5636
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/D29clV72.js",
            "resourceBytes": 108034,
            "encodedBytes": 32990,
            "unusedBytes": 80450
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/B_md0ljV.js",
            "resourceBytes": 6418,
            "encodedBytes": 0,
            "unusedBytes": 1977
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DLOUjN0J.js",
            "resourceBytes": 4231,
            "encodedBytes": 2209,
            "unusedBytes": 345
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BUVuFJdU.js",
            "resourceBytes": 1612,
            "encodedBytes": 0,
            "unusedBytes": 387
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DH5ytb2W.js",
            "resourceBytes": 712,
            "encodedBytes": 0,
            "unusedBytes": 498
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/COG008Jk.js",
            "resourceBytes": 5068,
            "encodedBytes": 0,
            "unusedBytes": 2452
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Dah2kLvO.js",
            "resourceBytes": 2754,
            "encodedBytes": 0,
            "unusedBytes": 2564
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/nodes/5.BlB5QYy-.js",
            "resourceBytes": 788301,
            "encodedBytes": 207640,
            "unusedBytes": 657697
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/DnIIAdjd.js",
            "resourceBytes": 4492,
            "encodedBytes": 0,
            "unusedBytes": 3442
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CzzPEZpf.js",
            "resourceBytes": 32672,
            "encodedBytes": 0,
            "unusedBytes": 21908
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CleO1URB.js",
            "resourceBytes": 12177,
            "encodedBytes": 0,
            "unusedBytes": 7493
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/MgusgrlE.js",
            "resourceBytes": 2725,
            "encodedBytes": 0,
            "unusedBytes": 2535
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BUYLxQXO.js",
            "resourceBytes": 2704,
            "encodedBytes": 0,
            "unusedBytes": 2514
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/36NkwCj5.js",
            "resourceBytes": 53696,
            "encodedBytes": 12424,
            "unusedBytes": 40189
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Dvxa2FQc.js",
            "resourceBytes": 5056,
            "encodedBytes": 0,
            "unusedBytes": 4864
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BomsXeif.js",
            "resourceBytes": 7710,
            "encodedBytes": 0,
            "unusedBytes": 4959
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/Bbwy2ZER.js",
            "resourceBytes": 2806,
            "encodedBytes": 0,
            "unusedBytes": 2616
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BZTRLxfo.js",
            "resourceBytes": 2881,
            "encodedBytes": 0,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BvIGJKPt.js",
            "resourceBytes": 883,
            "encodedBytes": 0,
            "unusedBytes": 172
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/BoMrEAts.js",
            "resourceBytes": 22477,
            "encodedBytes": 4530,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CH0_tLfd.js",
            "resourceBytes": 22767,
            "encodedBytes": 8435,
            "unusedBytes": 0
          },
          {
            "name": "https://www.todzz.eu/_app/immutable/chunks/CwtvwXb3.js",
            "resourceBytes": 5760,
            "encodedBytes": 0,
            "unusedBytes": 1699
          }
        ]
      }
    },
    "uses-long-cache-ttl": {
      "id": "uses-long-cache-ttl",
      "title": "Serve static assets with an efficient cache policy",
      "description": "A long cache lifetime can speed up repeat visits to your page. [Learn more about efficient cache policies](https://developer.chrome.com/docs/lighthouse/performance/uses-long-cache-ttl/).",
      "score": 0.5,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 587.6720670391061,
      "numericUnit": "byte",
      "displayValue": "2 resources found",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "cacheLifetimeMs",
            "valueType": "ms",
            "label": "Cache TTL",
            "displayUnit": "duration"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Transfer Size",
            "displayUnit": "kb",
            "granularity": 1
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_vercel/speed-insights/script.js",
            "debugData": {
              "type": "debugdata",
              "public": true,
              "max-age": 2678400
            },
            "cacheLifetimeMs": 2678400000,
            "cacheHitProbability": 0.9067039106145252,
            "totalBytes": 4937,
            "wastedBytes": 460.6027932960893
          },
          {
            "url": "https://www.todzz.eu/_vercel/insights/script.js",
            "debugData": {
              "type": "debugdata",
              "public": true,
              "max-age": 2678400
            },
            "cacheLifetimeMs": 2678400000,
            "cacheHitProbability": 0.9067039106145252,
            "totalBytes": 1362,
            "wastedBytes": 127.06927374301674
          }
        ],
        "summary": {
          "wastedBytes": 587.6720670391061
        },
        "sortedBy": [
          "totalBytes"
        ],
        "skipSumming": [
          "cacheLifetimeMs"
        ]
      },
      "guidanceLevel": 3
    },
    "total-byte-weight": {
      "id": "total-byte-weight",
      "title": "Avoids enormous network payloads",
      "description": "Large network payloads cost users real money and are highly correlated with long load times. [Learn how to reduce payload sizes](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 683128,
      "numericUnit": "byte",
      "displayValue": "Total size was 667 KiB",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Transfer Size"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/5.BlB5QYy-.js",
            "totalBytes": 211121
          },
          {
            "url": "https://i.imgur.com/b9hxDbH.png",
            "totalBytes": 56196
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/D29clV72.js",
            "totalBytes": 33103
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/d2bRpw1x.js",
            "totalBytes": 25979
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/36NkwCj5.js",
            "totalBytes": 15922
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/assets/0.Ci5NMpTh.css",
            "totalBytes": 14923
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/CwVpJkPu.js",
            "totalBytes": 12837
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/ChxxQyAj.js",
            "totalBytes": 11817
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/Bc2t17NI.js",
            "totalBytes": 10883
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/0.DZSSM0NM.js",
            "totalBytes": 10025
          }
        ],
        "sortedBy": [
          "totalBytes"
        ]
      },
      "guidanceLevel": 1
    },
    "offscreen-images": {
      "id": "offscreen-images",
      "title": "Defer offscreen images",
      "description": "Consider lazy-loading offscreen and hidden images after all critical resources have finished loading to lower time to interactive. [Learn how to defer offscreen images](https://developer.chrome.com/docs/lighthouse/performance/offscreen-images/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "warnings": [],
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 2
    },
    "render-blocking-resources": {
      "id": "render-blocking-resources",
      "title": "Eliminate render-blocking resources",
      "description": "Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles. [Learn how to eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0
      },
      "guidanceLevel": 2
    },
    "unminified-css": {
      "id": "unminified-css",
      "title": "Minify CSS",
      "description": "Minifying CSS files can reduce network payload sizes. [Learn how to minify CSS](https://developer.chrome.com/docs/lighthouse/performance/unminified-css/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 3
    },
    "unminified-javascript": {
      "id": "unminified-javascript",
      "title": "Minify JavaScript",
      "description": "Minifying JavaScript files can reduce payload sizes and script parse time. [Learn how to minify JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unminified-javascript/).",
      "score": 0,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "Est savings of 39 KiB",
      "warnings": [],
      "metricSavings": {
        "FCP": 50,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Transfer Size"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "label": "Est Savings"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/5.BlB5QYy-.js",
            "totalBytes": 207640,
            "wastedBytes": 26871,
            "wastedPercent": 12.941376453917986
          },
          {
            "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/content.js",
            "totalBytes": 17088,
            "wastedBytes": 10086,
            "wastedPercent": 59.0243714031903
          },
          {
            "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/token-signing-page-script.js",
            "totalBytes": 5846,
            "wastedBytes": 3330,
            "wastedPercent": 56.96202531645569
          }
        ],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 40287,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 40,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 3
    },
    "unused-css-rules": {
      "id": "unused-css-rules",
      "title": "Reduce unused CSS",
      "description": "Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to reduce unused CSS](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 1
    },
    "unused-javascript": {
      "id": "unused-javascript",
      "title": "Reduce unused JavaScript",
      "description": "Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/).",
      "score": 0,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 160,
      "numericUnit": "millisecond",
      "displayValue": "Est savings of 236 KiB",
      "metricSavings": {
        "FCP": 150,
        "LCP": 150
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "subItemsHeading": {
              "key": "source",
              "valueType": "code"
            },
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "subItemsHeading": {
              "key": "sourceBytes"
            },
            "label": "Transfer Size"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "subItemsHeading": {
              "key": "sourceWastedBytes"
            },
            "label": "Est Savings"
          }
        ],
        "items": [
          {
            "url": "https://www.todzz.eu/_app/immutable/nodes/5.BlB5QYy-.js",
            "totalBytes": 207266,
            "wastedBytes": 172927,
            "wastedPercent": 83.43221688162264
          },
          {
            "url": "chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/content_script.js",
            "totalBytes": 141850,
            "wastedBytes": 43924,
            "wastedPercent": 30.965436539047612
          },
          {
            "url": "https://www.todzz.eu/_app/immutable/chunks/D29clV72.js",
            "totalBytes": 32990,
            "wastedBytes": 24567,
            "wastedPercent": 74.46729733232131
          }
        ],
        "overallSavingsMs": 160,
        "overallSavingsBytes": 241418,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 160,
            "LCP": 160
          }
        }
      },
      "guidanceLevel": 1
    },
    "modern-image-formats": {
      "id": "modern-image-formats",
      "title": "Serve images in next-gen formats",
      "description": "Image formats like WebP and AVIF often provide better compression than PNG or JPEG, which means faster downloads and less data consumption. [Learn more about modern image formats](https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/).",
      "score": 0,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 80,
      "numericUnit": "millisecond",
      "displayValue": "Est savings of 49 KiB",
      "warnings": [],
      "metricSavings": {
        "FCP": 0,
        "LCP": 100
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "label": ""
          },
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Resource Size"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "label": "Est Savings"
          }
        ],
        "items": [
          {
            "node": {
              "type": "node",
              "lhId": "1-2-IMG",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV,14,DIV,2,BUTTON,0,DIV,0,IMG",
              "selector": "div.flex > button.ml-2 > div.relative > img.h-full",
              "boundingRect": {
                "top": 18,
                "bottom": 50,
                "left": 734,
                "right": 766,
                "width": 32,
                "height": 32
              },
              "snippet": "<img class=\"h-full w-full object-cover\" src=\"https://i.imgur.com/b9hxDbH.png\" alt=\"Kaspar Palgi\">",
              "nodeLabel": "Kaspar Palgi"
            },
            "url": "https://i.imgur.com/b9hxDbH.png",
            "fromProtocol": true,
            "isCrossOrigin": true,
            "totalBytes": 55713,
            "wastedBytes": 49859.6,
            "wastedWebpBytes": 48567
          }
        ],
        "overallSavingsMs": 80,
        "overallSavingsBytes": 49859.6,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 80
          }
        }
      },
      "guidanceLevel": 3
    },
    "uses-optimized-images": {
      "id": "uses-optimized-images",
      "title": "Efficiently encode images",
      "description": "Optimized images load faster and consume less cellular data. [Learn how to efficiently encode images](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "warnings": [],
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 2
    },
    "uses-text-compression": {
      "id": "uses-text-compression",
      "title": "Enable text compression",
      "description": "Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes. [Learn more about text compression](https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 3
    },
    "uses-responsive-images": {
      "id": "uses-responsive-images",
      "title": "Properly size images",
      "description": "Serve images that are appropriately-sized to save cellular data and improve load time. [Learn how to size images](https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images/).",
      "score": 0,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 80,
      "numericUnit": "millisecond",
      "displayValue": "Est savings of 53 KiB",
      "metricSavings": {
        "FCP": 0,
        "LCP": 100
      },
      "details": {
        "type": "opportunity",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "label": ""
          },
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Resource Size"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "label": "Est Savings"
          }
        ],
        "items": [
          {
            "node": {
              "type": "node",
              "lhId": "1-2-IMG",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV,14,DIV,2,BUTTON,0,DIV,0,IMG",
              "selector": "div.flex > button.ml-2 > div.relative > img.h-full",
              "boundingRect": {
                "top": 18,
                "bottom": 50,
                "left": 734,
                "right": 766,
                "width": 32,
                "height": 32
              },
              "snippet": "<img class=\"h-full w-full object-cover\" src=\"https://i.imgur.com/b9hxDbH.png\" alt=\"Kaspar Palgi\">",
              "nodeLabel": "Kaspar Palgi"
            },
            "url": "https://i.imgur.com/b9hxDbH.png",
            "totalBytes": 55713,
            "wastedBytes": 54081,
            "wastedPercent": 97.0703516150259
          }
        ],
        "overallSavingsMs": 80,
        "overallSavingsBytes": 54081,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 80
          }
        }
      },
      "guidanceLevel": 2
    },
    "efficient-animated-content": {
      "id": "efficient-animated-content",
      "title": "Use video formats for animated content",
      "description": "Large GIFs are inefficient for delivering animated content. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes. [Learn more about efficient video formats](https://developer.chrome.com/docs/lighthouse/performance/efficient-animated-content/)",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 3
    },
    "duplicated-javascript": {
      "id": "duplicated-javascript",
      "title": "Remove duplicate modules in JavaScript bundles",
      "description": "Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity. ",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 2
    },
    "legacy-javascript": {
      "id": "legacy-javascript",
      "title": "Avoid serving legacy JavaScript to modern browsers",
      "description": "Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile [Baseline](https://web.dev/baseline) features, unless you know you must support legacy browsers. [Learn why most sites can deploy ES6+ code without transpiling](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "displayValue": "",
      "warnings": [],
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0,
        "overallSavingsBytes": 0,
        "sortedBy": [
          "wastedBytes"
        ],
        "debugData": {
          "type": "debugdata",
          "metricSavings": {
            "FCP": 0,
            "LCP": 0
          }
        }
      },
      "guidanceLevel": 2
    },
    "dom-size": {
      "id": "dom-size",
      "title": "Avoid an excessive DOM size",
      "description": "A large DOM will increase memory usage, cause longer [style calculations](https://developers.google.com/web/fundamentals/performance/rendering/reduce-the-scope-and-complexity-of-style-calculations), and produce costly [layout reflows](https://developers.google.com/speed/articles/reflow). [Learn how to avoid an excessive DOM size](https://developer.chrome.com/docs/lighthouse/performance/dom-size/).",
      "score": 0.5,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 942,
      "numericUnit": "element",
      "displayValue": "942 elements",
      "metricSavings": {
        "TBT": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "statistic",
            "valueType": "text",
            "label": "Statistic"
          },
          {
            "key": "node",
            "valueType": "node",
            "label": "Element"
          },
          {
            "key": "value",
            "valueType": "numeric",
            "label": "Value"
          }
        ],
        "items": [
          {
            "statistic": "Total DOM Elements",
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 942
            }
          },
          {
            "node": {
              "type": "node",
              "lhId": "1-0-path",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,0,DIV,0,DIV,0,DIV,3,DIV,0,DIV,2,DIV,1,DIV,0,A,0,DIV,4,DIV,0,DIV,2,DIV,1,BUTTON,1,svg,1,path",
              "selector": "div.absolute > button.cursor-pointer > svg.lucide-icon > path",
              "boundingRect": {
                "top": 327,
                "bottom": 339,
                "left": 284,
                "right": 296,
                "width": 12,
                "height": 12
              },
              "snippet": "<path d=\"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\">",
              "nodeLabel": "div.absolute > button.cursor-pointer > svg.lucide-icon > path"
            },
            "statistic": "Maximum DOM Depth",
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 24
            }
          },
          {
            "node": {
              "type": "node",
              "lhId": "1-1-DIV",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,1,DIV,0,DIV,0,DIV,3,DIV,0,DIV",
              "selector": "div.h-full > div.flex > div.px-6 > div.min-h-[180px]",
              "boundingRect": {
                "top": 316,
                "bottom": 2913,
                "left": 409,
                "right": 679,
                "width": 270,
                "height": 2597
              },
              "snippet": "<div class=\"min-h-[180px]\">",
              "nodeLabel": "Kustuta\nSee only own paths unless dog owner\nMuuda\n#52\nKustuta\nMap\n\n- [x] re-scr…"
            },
            "statistic": "Maximum Child Elements",
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 26
            }
          }
        ]
      },
      "guidanceLevel": 1
    },
    "no-document-write": {
      "id": "no-document-write",
      "title": "Avoids `document.write()`",
      "description": "For users on slow connections, external scripts dynamically injected via `document.write()` can delay page load by tens of seconds. [Learn how to avoid document.write()](https://developer.chrome.com/docs/lighthouse/best-practices/no-document-write/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "source",
            "valueType": "source-location",
            "label": "Source"
          }
        ],
        "items": []
      },
      "guidanceLevel": 2
    },
    "uses-http2": {
      "id": "uses-http2",
      "title": "Use HTTP/2",
      "description": "HTTP/2 offers many benefits over HTTP/1.1, including binary headers and multiplexing. [Learn more about HTTP/2](https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "numericValue": 0,
      "numericUnit": "millisecond",
      "metricSavings": {
        "LCP": 0,
        "FCP": 0
      },
      "details": {
        "type": "opportunity",
        "headings": [],
        "items": [],
        "overallSavingsMs": 0
      },
      "guidanceLevel": 3
    },
    "uses-passive-event-listeners": {
      "id": "uses-passive-event-listeners",
      "title": "Uses passive listeners to improve scrolling performance",
      "description": "Consider marking your touch and wheel event listeners as `passive` to improve your page's scroll performance. [Learn more about adopting passive event listeners](https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "source",
            "valueType": "source-location",
            "label": "Source"
          }
        ],
        "items": []
      },
      "guidanceLevel": 3
    },
    "bf-cache": {
      "id": "bf-cache",
      "title": "Page prevented back/forward cache restoration",
      "description": "Many navigations are performed by going back to a previous page, or forwards again. The back/forward cache (bfcache) can speed up these return navigations. [Learn more about the bfcache](https://developer.chrome.com/docs/lighthouse/performance/bf-cache/)",
      "score": 0,
      "scoreDisplayMode": "binary",
      "displayValue": "1 failure reason",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "reason",
            "valueType": "text",
            "subItemsHeading": {
              "key": "frameUrl",
              "valueType": "url"
            },
            "label": "Failure reason"
          },
          {
            "key": "failureType",
            "valueType": "text",
            "label": "Failure type"
          }
        ],
        "items": [
          {
            "reason": "Pages with cache-control:no-store header cannot enter back/forward cache.",
            "failureType": "Actionable",
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "frameUrl": "https://www.todzz.eu/et/kaspar/perroz"
                }
              ]
            },
            "protocolReason": "CacheControlNoStoreHTTPOnlyCookieModified"
          }
        ]
      },
      "guidanceLevel": 4
    },
    "cache-insight": {
      "id": "cache-insight",
      "title": "Use efficient cache lifetimes",
      "description": "A long cache lifetime can speed up repeat visits to your page. [Learn more](https://web.dev/uses-long-cache-ttl/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "Request"
          },
          {
            "key": "cacheLifetimeMs",
            "valueType": "ms",
            "label": "Cache TTL",
            "displayUnit": "duration"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Transfer Size",
            "displayUnit": "kb",
            "granularity": 1
          }
        ],
        "items": [],
        "debugData": {
          "type": "debugdata",
          "wastedBytes": 0
        }
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "uses-long-cache-ttl"
      ]
    },
    "cls-culprits-insight": {
      "id": "cls-culprits-insight",
      "title": "Layout shift culprits",
      "description": "Layout shifts occur when elements move absent any user interaction. [Investigate the causes of layout shifts](https://web.dev/articles/optimize-cls), such as elements being added, removed, or their fonts changing as the page loads.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "metricSavings": {
        "CLS": 0
      },
      "details": {
        "type": "list",
        "items": [
          {
            "type": "table",
            "headings": [
              {
                "key": "node",
                "valueType": "node",
                "subItemsHeading": {
                  "key": "extra"
                },
                "label": "Element"
              },
              {
                "key": "score",
                "valueType": "numeric",
                "subItemsHeading": {
                  "key": "cause",
                  "valueType": "text"
                },
                "granularity": 0.001,
                "label": "Layout shift score"
              }
            ],
            "items": [
              {
                "node": {
                  "type": "text",
                  "value": "Total"
                },
                "score": 0.0032676689411467695
              },
              {
                "node": {
                  "type": "node",
                  "lhId": "page-1-DIV",
                  "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
                  "selector": "header.sticky > div.w-full > nav.flex > div.flex",
                  "boundingRect": {
                    "top": 16,
                    "bottom": 52,
                    "left": 560,
                    "right": 856,
                    "width": 296,
                    "height": 36
                  },
                  "snippet": "<div class=\"flex items-center gap-2\">",
                  "nodeLabel": "Perroz"
                },
                "score": 0.002602856843738938
              },
              {
                "node": {
                  "type": "node",
                  "lhId": "page-1-DIV",
                  "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
                  "selector": "header.sticky > div.w-full > nav.flex > div.flex",
                  "boundingRect": {
                    "top": 16,
                    "bottom": 52,
                    "left": 560,
                    "right": 856,
                    "width": 296,
                    "height": 36
                  },
                  "snippet": "<div class=\"flex items-center gap-2\">",
                  "nodeLabel": "Perroz"
                },
                "score": 0.0006648120974078319
              }
            ]
          },
          {
            "type": "table",
            "headings": [
              {
                "key": "node",
                "valueType": "node",
                "subItemsHeading": {
                  "key": "extra"
                },
                "label": "Element"
              },
              {
                "key": "score",
                "valueType": "numeric",
                "subItemsHeading": {
                  "key": "cause",
                  "valueType": "text"
                },
                "granularity": 0.001,
                "label": "Layout shift score"
              }
            ],
            "items": [
              {
                "node": {
                  "type": "text",
                  "value": "Total"
                },
                "score": 0.00022885951653669066
              },
              {
                "node": {
                  "type": "node",
                  "lhId": "page-1-DIV",
                  "path": "1,HTML,1,BODY,0,DIV,7,DIV,2,HEADER,0,DIV,0,NAV,1,DIV",
                  "selector": "header.sticky > div.w-full > nav.flex > div.flex",
                  "boundingRect": {
                    "top": 16,
                    "bottom": 52,
                    "left": 560,
                    "right": 856,
                    "width": 296,
                    "height": 36
                  },
                  "snippet": "<div class=\"flex items-center gap-2\">",
                  "nodeLabel": "Perroz"
                },
                "score": 0.00022885951653669066
              }
            ]
          }
        ]
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "layout-shifts",
        "non-composited-animations",
        "unsized-images"
      ]
    },
    "document-latency-insight": {
      "id": "document-latency-insight",
      "title": "Document request latency",
      "description": "Your first network request is the most important.  Reduce its latency by avoiding redirects, ensuring a fast server response, and enabling text compression.",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "checklist",
        "items": {
          "noRedirects": {
            "label": "Avoids redirects",
            "value": true
          },
          "serverResponseIsFast": {
            "label": "Server responds quickly (observed 179 ms)",
            "value": true
          },
          "usesCompression": {
            "label": "Applies text compression",
            "value": true
          }
        },
        "debugData": {
          "type": "debugdata",
          "redirectDuration": 0,
          "serverResponseTime": 179,
          "uncompressedResponseBytes": 0,
          "wastedBytes": 0
        }
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "redirects",
        "server-response-time",
        "uses-text-compression"
      ]
    },
    "dom-size-insight": {
      "id": "dom-size-insight",
      "title": "Optimize DOM size",
      "description": "A large DOM can increase the duration of style calculations and layout reflows, impacting page responsiveness. A large DOM will also increase memory usage. [Learn how to avoid an excessive DOM size](https://developer.chrome.com/docs/lighthouse/performance/dom-size/).",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "metricSavings": {
        "INP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "statistic",
            "valueType": "text",
            "label": "Statistic"
          },
          {
            "key": "node",
            "valueType": "node",
            "label": "Element"
          },
          {
            "key": "value",
            "valueType": "numeric",
            "label": "Value"
          }
        ],
        "items": [
          {
            "statistic": "Total elements",
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 944
            }
          },
          {
            "statistic": "Most children",
            "node": {
              "type": "node",
              "lhId": "page-3-DIV",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,1,DIV,0,DIV,0,DIV,3,DIV,0,DIV",
              "selector": "div.h-full > div.flex > div.px-6 > div.min-h-[180px]",
              "boundingRect": {
                "top": 316,
                "bottom": 2913,
                "left": 409,
                "right": 679,
                "width": 270,
                "height": 2597
              },
              "snippet": "<div class=\"min-h-[180px]\">",
              "nodeLabel": "Kustuta\nSee only own paths unless dog owner\nMuuda\n#52\nKustuta\nMap\n\n- [x] re-scr…"
            },
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 26
            }
          },
          {
            "statistic": "DOM depth",
            "node": {
              "type": "node",
              "lhId": "page-4-path",
              "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,0,DIV,0,DIV,0,DIV,3,DIV,0,DIV,2,DIV,1,DIV,0,A,0,DIV,4,DIV,0,DIV,2,DIV,1,BUTTON,1,svg,1,path",
              "selector": "div.absolute > button.cursor-pointer > svg.lucide-icon > path",
              "boundingRect": {
                "top": 327,
                "bottom": 339,
                "left": 284,
                "right": 296,
                "width": 12,
                "height": 12
              },
              "snippet": "<path d=\"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\">",
              "nodeLabel": "div.absolute > button.cursor-pointer > svg.lucide-icon > path"
            },
            "value": {
              "type": "numeric",
              "granularity": 1,
              "value": 24
            }
          }
        ],
        "debugData": {
          "type": "debugdata",
          "totalElements": 944,
          "maxChildren": 26,
          "maxDepth": 24
        }
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "dom-size"
      ]
    },
    "duplicated-javascript-insight": {
      "id": "duplicated-javascript-insight",
      "title": "Duplicated JavaScript",
      "description": "Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity.",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "source",
            "valueType": "code",
            "subItemsHeading": {
              "key": "url",
              "valueType": "url"
            },
            "label": "Source"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "subItemsHeading": {
              "key": "sourceTransferBytes"
            },
            "granularity": 10,
            "label": "Duplicated bytes"
          }
        ],
        "items": [],
        "debugData": {
          "type": "debugdata",
          "wastedBytes": 0
        }
      },
      "guidanceLevel": 2,
      "replacesAudits": [
        "duplicated-javascript"
      ]
    },
    "font-display-insight": {
      "id": "font-display-insight",
      "title": "Font display",
      "description": "Consider setting [`font-display`](https://developer.chrome.com/blog/font-display) to `swap` or `optional` to ensure text is consistently visible. `swap` can be further optimized to mitigate layout shifts with [font metric overrides](https://developer.chrome.com/blog/font-fallbacks).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "INP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "wastedMs",
            "valueType": "ms",
            "label": "Est Savings"
          }
        ],
        "items": []
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "font-display"
      ]
    },
    "forced-reflow-insight": {
      "id": "forced-reflow-insight",
      "title": "Forced reflow",
      "description": "A forced reflow occurs when JavaScript queries geometric properties (such as `offsetWidth`) after styles have been invalidated by a change to the DOM state. This can result in poor performance. Learn more about [forced reflows](https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts) and possible mitigations.",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "details": {
        "type": "list",
        "items": [
          {
            "type": "table",
            "headings": [
              {
                "key": "source",
                "valueType": "source-location",
                "label": "Source"
              },
              {
                "key": "reflowTime",
                "valueType": "ms",
                "granularity": 1,
                "label": "Total reflow time"
              }
            ],
            "items": []
          }
        ]
      },
      "guidanceLevel": 3
    },
    "image-delivery-insight": {
      "id": "image-delivery-insight",
      "title": "Improve image delivery",
      "description": "Reducing the download time of images can improve the perceived load time of the page and LCP. [Learn more about optimizing image size](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/)",
      "score": 0.5,
      "scoreDisplayMode": "metricSavings",
      "displayValue": "Est savings of 54 KiB",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL",
            "subItemsHeading": {
              "key": "reason",
              "valueType": "text"
            }
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Resource Size"
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "label": "Est Savings",
            "subItemsHeading": {
              "key": "wastedBytes",
              "valueType": "bytes"
            }
          }
        ],
        "items": [
          {
            "url": "https://i.imgur.com/b9hxDbH.png",
            "totalBytes": 55713,
            "wastedBytes": 55535,
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "reason": "Using a modern image format (WebP, AVIF) or increasing the image compression could improve this image's download size.",
                  "wastedBytes": 50230
                },
                {
                  "reason": "This image file is larger than it needs to be (180x183) for its displayed dimensions (33x32). Use responsive images to reduce the image download size.",
                  "wastedBytes": 53903
                }
              ]
            }
          }
        ],
        "debugData": {
          "type": "debugdata",
          "wastedBytes": 55535
        }
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "modern-image-formats",
        "uses-optimized-images",
        "efficient-animated-content",
        "uses-responsive-images"
      ]
    },
    "inp-breakdown-insight": {
      "id": "inp-breakdown-insight",
      "title": "INP breakdown",
      "description": "Start investigating with the longest subpart. [Delays can be minimized](https://web.dev/articles/optimize-inp#optimize_interactions). To reduce processing duration, [optimize the main-thread costs](https://web.dev/articles/optimize-long-tasks), often JS.",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "guidanceLevel": 3,
      "replacesAudits": [
        "work-during-interaction"
      ]
    },
    "lcp-breakdown-insight": {
      "id": "lcp-breakdown-insight",
      "title": "LCP breakdown",
      "description": "Each [subpart has specific improvement strategies](https://web.dev/articles/optimize-lcp#lcp-breakdown). Ideally, most of the LCP time should be spent on loading the resources, not within delays.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "metricSavings": {
        "LCP": 0
      },
      "details": {
        "type": "list",
        "items": [
          {
            "type": "table",
            "headings": [
              {
                "key": "label",
                "valueType": "text",
                "label": "Subpart"
              },
              {
                "key": "duration",
                "valueType": "ms",
                "label": "Duration"
              }
            ],
            "items": [
              {
                "subpart": "timeToFirstByte",
                "label": "Time to first byte",
                "duration": 21.112
              },
              {
                "subpart": "elementRenderDelay",
                "label": "Element render delay",
                "duration": 2920.227
              }
            ]
          },
          {
            "type": "node",
            "lhId": "page-0-H3",
            "path": "1,HTML,1,BODY,0,DIV,7,DIV,3,MAIN,4,DIV,1,DIV,3,DIV,1,DIV,0,DIV,1,DIV,0,DIV,0,DIV,3,DIV,0,DIV,67,DIV,1,DIV,0,A,0,DIV,4,DIV,0,DIV,1,DIV,0,H3",
            "selector": "div.p-2 > div.flex > div.min-w-0 > h3.text-sm",
            "boundingRect": {
              "top": 821,
              "bottom": 944,
              "left": 442,
              "right": 638,
              "width": 196,
              "height": 123
            },
            "snippet": "<h3 class=\"text-sm leading-tight font-medium \">",
            "nodeLabel": "Äppi kasutajaid fake gamification & nutilukud + sinu reklaam + loomapood + tell…"
          }
        ]
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "largest-contentful-paint-element"
      ]
    },
    "lcp-discovery-insight": {
      "id": "lcp-discovery-insight",
      "title": "LCP request discovery",
      "description": "Optimize LCP by making the LCP image [discoverable](https://web.dev/articles/optimize-lcp#1_eliminate_resource_load_delay) from the HTML immediately, and [avoiding lazy-loading](https://web.dev/articles/lcp-lazy-loading)",
      "score": null,
      "scoreDisplayMode": "notApplicable",
      "guidanceLevel": 3,
      "replacesAudits": [
        "prioritize-lcp-image",
        "lcp-lazy-loaded"
      ]
    },
    "legacy-javascript-insight": {
      "id": "legacy-javascript-insight",
      "title": "Legacy JavaScript",
      "description": "Polyfills and transforms enable older browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile [Baseline](https://web.dev/articles/baseline-and-polyfills) features, unless you know you must support older browsers. [Learn why most sites can deploy ES6+ code without transpiling](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "subItemsHeading": {
              "key": "location",
              "valueType": "source-location"
            },
            "label": "URL"
          },
          {
            "key": null,
            "valueType": "code",
            "subItemsHeading": {
              "key": "signal"
            },
            "label": ""
          },
          {
            "key": "wastedBytes",
            "valueType": "bytes",
            "label": "Wasted bytes"
          }
        ],
        "items": [],
        "debugData": {
          "type": "debugdata",
          "wastedBytes": 0
        }
      },
      "guidanceLevel": 2
    },
    "modern-http-insight": {
      "id": "modern-http-insight",
      "title": "Modern HTTP",
      "description": "HTTP/2 and HTTP/3 offer many benefits over HTTP/1.1, such as multiplexing. [Learn more about using modern HTTP](https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2/).",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "protocol",
            "valueType": "text",
            "label": "Protocol"
          }
        ],
        "items": []
      },
      "guidanceLevel": 3
    },
    "network-dependency-tree-insight": {
      "id": "network-dependency-tree-insight",
      "title": "Network dependency tree",
      "description": "[Avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains) by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "metricSavings": {
        "LCP": 0
      },
      "details": {
        "type": "list",
        "items": [
          {
            "type": "list-section",
            "value": {
              "type": "network-tree",
              "chains": {
                "219BAB58B6E1F843C12DB4F41B53B394": {
                  "url": "https://www.todzz.eu/et/kaspar/perroz",
                  "navStartToEndTime": 275,
                  "transferSize": 8190,
                  "isLongest": true,
                  "children": {}
                }
              },
              "longestChain": {
                "duration": 275
              }
            }
          },
          {
            "type": "list-section",
            "title": "Preconnected origins",
            "description": "[preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints help the browser establish a connection earlier in the page load, saving time when the first request for that origin is made. The following are the origins that the page preconnected to.",
            "value": {
              "type": "text",
              "value": "no origins were preconnected"
            }
          },
          {
            "type": "list-section",
            "title": "Preconnect candidates",
            "description": "Add [preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints to your most important origins, but try to use no more than 4.",
            "value": {
              "type": "table",
              "headings": [
                {
                  "key": "origin",
                  "valueType": "text",
                  "label": "Origin"
                },
                {
                  "key": "wastedMs",
                  "valueType": "ms",
                  "label": "Est LCP savings"
                }
              ],
              "items": [
                {
                  "origin": "https://i.imgur.com",
                  "wastedMs": 161.1712
                }
              ]
            }
          }
        ]
      },
      "guidanceLevel": 1,
      "replacesAudits": [
        "critical-request-chains",
        "uses-rel-preconnect"
      ]
    },
    "render-blocking-insight": {
      "id": "render-blocking-insight",
      "title": "Render blocking requests",
      "description": "Requests are blocking the page's initial render, which may delay LCP. [Deferring or inlining](https://web.dev/learn/performance/understanding-the-critical-path#render-blocking_resources) can move these network requests out of the critical path.",
      "score": 1,
      "scoreDisplayMode": "metricSavings",
      "metricSavings": {
        "FCP": 0,
        "LCP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "url",
            "valueType": "url",
            "label": "URL"
          },
          {
            "key": "totalBytes",
            "valueType": "bytes",
            "label": "Transfer Size"
          },
          {
            "key": "wastedMs",
            "valueType": "timespanMs",
            "label": "Duration"
          }
        ],
        "items": []
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "render-blocking-resources"
      ]
    },
    "third-parties-insight": {
      "id": "third-parties-insight",
      "title": "3rd parties",
      "description": "3rd party code can significantly impact load performance. [Reduce and defer loading of 3rd party code](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript/) to prioritize your page's content.",
      "score": 1,
      "scoreDisplayMode": "informative",
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "entity",
            "valueType": "text",
            "label": "3rd party",
            "subItemsHeading": {
              "key": "url",
              "valueType": "url"
            }
          },
          {
            "key": "transferSize",
            "granularity": 1,
            "valueType": "bytes",
            "label": "Transfer size",
            "subItemsHeading": {
              "key": "transferSize"
            }
          },
          {
            "key": "mainThreadTime",
            "granularity": 1,
            "valueType": "ms",
            "label": "Main thread time",
            "subItemsHeading": {
              "key": "mainThreadTime"
            }
          }
        ],
        "items": [
          {
            "entity": "pejdijmoenmkgeppbflobdenhhabjlaj",
            "mainThreadTime": 30.78499998897314,
            "transferSize": 0,
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/content_script.js",
                  "mainThreadTime": 30.78499998897314,
                  "transferSize": 0
                }
              ]
            }
          },
          {
            "entity": "ncibgoaomkmdpilpocfeponihegamlic",
            "mainThreadTime": 5.004999987781048,
            "transferSize": 0,
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/content.js",
                  "mainThreadTime": 4.671999990940094,
                  "transferSize": 0
                },
                {
                  "url": "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic/token-signing-page-script.js",
                  "mainThreadTime": 0.3329999968409538,
                  "transferSize": 0
                }
              ]
            }
          },
          {
            "entity": "servicehost.io",
            "mainThreadTime": 0,
            "transferSize": 89627,
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "https://todzz.admin.servicehost.io/v1/graphql",
                  "mainThreadTime": 0,
                  "transferSize": 89627
                }
              ]
            }
          },
          {
            "entity": "Imgur",
            "mainThreadTime": 0,
            "transferSize": 56196,
            "subItems": {
              "type": "subitems",
              "items": [
                {
                  "url": "https://i.imgur.com/b9hxDbH.png",
                  "mainThreadTime": 0,
                  "transferSize": 56196
                }
              ]
            }
          }
        ],
        "isEntityGrouped": true
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "third-party-summary"
      ]
    },
    "viewport-insight": {
      "id": "viewport-insight",
      "title": "Optimize viewport for mobile",
      "description": "Tap interactions may be [delayed by up to 300 ms](https://developer.chrome.com/blog/300ms-tap-delay-gone-away/) if the viewport is not optimized for mobile.",
      "score": 1,
      "scoreDisplayMode": "numeric",
      "metricSavings": {
        "INP": 0
      },
      "details": {
        "type": "table",
        "headings": [
          {
            "key": "node",
            "valueType": "node",
            "label": ""
          }
        ],
        "items": [
          {
            "node": {
              "type": "node",
              "lhId": "page-2-META",
              "path": "1,HTML,0,HEAD,1,META",
              "selector": "head > meta",
              "boundingRect": {
                "top": 0,
                "bottom": 0,
                "left": 0,
                "right": 0,
                "width": 0,
                "height": 0
              },
              "snippet": "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
              "nodeLabel": "head > meta"
            }
          }
        ]
      },
      "guidanceLevel": 3,
      "replacesAudits": [
        "viewport"
      ]
    }
  },
  "configSettings": {
    "output": "json",
    "maxWaitForFcp": 30000,
    "maxWaitForLoad": 45000,
    "pauseAfterFcpMs": 1000,
    "pauseAfterLoadMs": 1000,
    "networkQuietThresholdMs": 1000,
    "cpuQuietThresholdMs": 1000,
    "formFactor": "desktop",
    "throttling": {
      "rttMs": 40,
      "throughputKbps": 10240,
      "requestLatencyMs": 0,
      "downloadThroughputKbps": 0,
      "uploadThroughputKbps": 0,
      "cpuSlowdownMultiplier": 1
    },
    "throttlingMethod": "simulate",
    "screenEmulation": {
      "mobile": true,
      "width": 412,
      "height": 823,
      "deviceScaleFactor": 1.75,
      "disabled": true
    },
    "emulatedUserAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "auditMode": false,
    "gatherMode": false,
    "clearStorageTypes": [
      "file_systems",
      "shader_cache",
      "service_workers",
      "cache_storage"
    ],
    "disableStorageReset": false,
    "debugNavigation": false,
    "channel": "devtools",
    "usePassiveGathering": false,
    "disableFullPageScreenshot": false,
    "skipAboutBlank": false,
    "blankPage": "about:blank",
    "ignoreStatusCode": true,
    "locale": "en-US",
    "blockedUrlPatterns": null,
    "additionalTraceCategories": "",
    "extraHeaders": null,
    "precomputedLanternData": null,
    "onlyAudits": null,
    "onlyCategories": [
      "performance"
    ],
    "skipAudits": null
  },
  "categories": {
    "performance": {
      "title": "Performance",
      "supportedModes": [
        "navigation",
        "timespan",
        "snapshot"
      ],
      "auditRefs": [
        {
          "id": "first-contentful-paint",
          "weight": 10,
          "group": "metrics",
          "acronym": "FCP"
        },
        {
          "id": "largest-contentful-paint",
          "weight": 25,
          "group": "metrics",
          "acronym": "LCP"
        },
        {
          "id": "total-blocking-time",
          "weight": 30,
          "group": "metrics",
          "acronym": "TBT"
        },
        {
          "id": "cumulative-layout-shift",
          "weight": 25,
          "group": "metrics",
          "acronym": "CLS"
        },
        {
          "id": "speed-index",
          "weight": 10,
          "group": "metrics",
          "acronym": "SI"
        },
        {
          "id": "cache-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "cls-culprits-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "document-latency-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "dom-size-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "duplicated-javascript-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "font-display-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "forced-reflow-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "image-delivery-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "inp-breakdown-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "lcp-breakdown-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "lcp-discovery-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "legacy-javascript-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "modern-http-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "network-dependency-tree-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "render-blocking-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "third-parties-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "viewport-insight",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "interactive",
          "weight": 0,
          "group": "hidden",
          "acronym": "TTI"
        },
        {
          "id": "max-potential-fid",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "first-meaningful-paint",
          "weight": 0,
          "acronym": "FMP",
          "group": "hidden"
        },
        {
          "id": "render-blocking-resources",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-responsive-images",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "offscreen-images",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "unminified-css",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "unminified-javascript",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "unused-css-rules",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "unused-javascript",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-optimized-images",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "modern-image-formats",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-text-compression",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-rel-preconnect",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "server-response-time",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "redirects",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-http2",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "efficient-animated-content",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "duplicated-javascript",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "legacy-javascript",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "prioritize-lcp-image",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "total-byte-weight",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-long-cache-ttl",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "dom-size",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "critical-request-chains",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "user-timings",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "bootup-time",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "mainthread-work-breakdown",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "font-display",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "third-party-summary",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "third-party-facades",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "largest-contentful-paint-element",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "lcp-lazy-loaded",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "layout-shifts",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "uses-passive-event-listeners",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "no-document-write",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "long-tasks",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "non-composited-animations",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "unsized-images",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "viewport",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "bf-cache",
          "weight": 0,
          "group": "diagnostics"
        },
        {
          "id": "network-requests",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "network-rtt",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "network-server-latency",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "main-thread-tasks",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "diagnostics",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "metrics",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "screenshot-thumbnails",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "final-screenshot",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "script-treemap-data",
          "weight": 0,
          "group": "hidden"
        },
        {
          "id": "resource-summary",
          "weight": 0,
          "group": "hidden"
        }
      ],
      "id": "performance",
      "score": 0.96
    }
  },
  "categoryGroups": {
    "metrics": {
      "title": "Metrics"
    },
    "insights": {
      "title": "Insights",
      "description": "These insights are also available in the Chrome DevTools Performance Panel - [record a trace](https://developer.chrome.com/docs/devtools/performance/reference) to view more detailed information."
    },
    "diagnostics": {
      "title": "Diagnostics",
      "description": "More information about the performance of your application. These numbers don't [directly affect](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/) the Performance score."
    },
    "a11y-best-practices": {
      "title": "Best practices",
      "description": "These items highlight common accessibility best practices."
    },
    "a11y-color-contrast": {
      "title": "Contrast",
      "description": "These are opportunities to improve the legibility of your content."
    },
    "a11y-names-labels": {
      "title": "Names and labels",
      "description": "These are opportunities to improve the semantics of the controls in your application. This may enhance the experience for users of assistive technology, like a screen reader."
    },
    "a11y-navigation": {
      "title": "Navigation",
      "description": "These are opportunities to improve keyboard navigation in your application."
    },
    "a11y-aria": {
      "title": "ARIA",
      "description": "These are opportunities to improve the usage of ARIA in your application which may enhance the experience for users of assistive technology, like a screen reader."
    },
    "a11y-language": {
      "title": "Internationalization and localization",
      "description": "These are opportunities to improve the interpretation of your content by users in different locales."
    },
    "a11y-audio-video": {
      "title": "Audio and video",
      "description": "These are opportunities to provide alternative content for audio and video. This may improve the experience for users with hearing or vision impairments."
    },
    "a11y-tables-lists": {
      "title": "Tables and lists",
      "description": "These are opportunities to improve the experience of reading tabular or list data using assistive technology, like a screen reader."
    },
    "seo-mobile": {
      "title": "Mobile Friendly",
      "description": "Make sure your pages are mobile friendly so users don’t have to pinch or zoom in order to read the content pages. [Learn how to make pages mobile-friendly](https://developers.google.com/search/mobile-sites/)."
    },
    "seo-content": {
      "title": "Content Best Practices",
      "description": "Format your HTML in a way that enables crawlers to better understand your app’s content."
    },
    "seo-crawl": {
      "title": "Crawling and Indexing",
      "description": "To appear in search results, crawlers need access to your app."
    },
    "best-practices-trust-safety": {
      "title": "Trust and Safety"
    },
    "best-practices-ux": {
      "title": "User Experience"
    },
    "best-practices-browser-compat": {
      "title": "Browser Compatibility"
    },
    "best-practices-general": {
      "title": "General"
    },
    "hidden": {
      "title": ""
    }
  },
  "stackPacks": [],
  "entities": [
    {
      "name": "todzz.eu",
      "origins": [
        "https://www.todzz.eu"
      ],
      "isFirstParty": true,
      "isUnrecognized": true
    },
    {
      "name": "Web eID",
      "homepage": "https://chromewebstore.google.com/detail/ncibgoaomkmdpilpocfeponihegamlic",
      "origins": [
        "chrome-extension://ncibgoaomkmdpilpocfeponihegamlic"
      ],
      "category": "Chrome Extension"
    },
    {
      "name": "servicehost.io",
      "origins": [
        "https://todzz.admin.servicehost.io"
      ],
      "isUnrecognized": true
    },
    {
      "name": "Imgur",
      "origins": [
        "https://i.imgur.com"
      ],
      "category": "utility"
    }
  ],
  "fullPageScreenshot": {
    "screenshot": {
      "data": "data:image/webp;base64,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",
      "width": 887,
      "height": 3325
    },
    "nodes": {
      "page-0-H3": {
        "id": "",
        "top": 821,
        "bottom": 944,
        "left": 442,
        "right": 638,
        "width": 196,
        "height": 123
      },
      "page-1-DIV": {
        "id": "",
        "top": 16,
        "bottom": 52,
        "left": 575,
        "right": 871,
        "width": 296,
        "height": 36
      },
      "page-2-META": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "page-3-DIV": {
        "id": "",
        "top": 316,
        "bottom": 2913,
        "left": 409,
        "right": 679,
        "width": 270,
        "height": 2597
      },
      "page-4-path": {
        "id": "",
        "top": 327,
        "bottom": 339,
        "left": 284,
        "right": 296,
        "width": 12,
        "height": 12
      },
      "page-5-IMG": {
        "id": "",
        "top": 18,
        "bottom": 50,
        "left": 749,
        "right": 781,
        "width": 32,
        "height": 32
      },
      "page-6-svg": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "page-7-DIV": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-0-path": {
        "id": "",
        "top": 327,
        "bottom": 339,
        "left": 284,
        "right": 296,
        "width": 12,
        "height": 12
      },
      "1-1-DIV": {
        "id": "",
        "top": 316,
        "bottom": 2913,
        "left": 409,
        "right": 679,
        "width": 270,
        "height": 2597
      },
      "1-2-IMG": {
        "id": "",
        "top": 18,
        "bottom": 50,
        "left": 749,
        "right": 781,
        "width": 32,
        "height": 32
      },
      "1-3-IMG": {
        "id": "",
        "top": 393,
        "bottom": 405,
        "left": 78,
        "right": 90,
        "width": 12,
        "height": 12
      },
      "1-4-IMG": {
        "id": "",
        "top": 471,
        "bottom": 483,
        "left": 78,
        "right": 90,
        "width": 12,
        "height": 12
      },
      "1-5-IMG": {
        "id": "",
        "top": 378,
        "bottom": 390,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-6-IMG": {
        "id": "",
        "top": 486,
        "bottom": 498,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-7-IMG": {
        "id": "",
        "top": 564,
        "bottom": 576,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-8-IMG": {
        "id": "",
        "top": 642,
        "bottom": 654,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-9-IMG": {
        "id": "",
        "top": 769,
        "bottom": 781,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-10-IMG": {
        "id": "",
        "top": 950,
        "bottom": 962,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-11-IMG": {
        "id": "",
        "top": 1043,
        "bottom": 1055,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-12-IMG": {
        "id": "",
        "top": 1150,
        "bottom": 1162,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-13-IMG": {
        "id": "",
        "top": 1243,
        "bottom": 1255,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-14-IMG": {
        "id": "",
        "top": 1350,
        "bottom": 1362,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-15-IMG": {
        "id": "",
        "top": 1458,
        "bottom": 1470,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-16-IMG": {
        "id": "",
        "top": 1565,
        "bottom": 1577,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-17-IMG": {
        "id": "",
        "top": 1673,
        "bottom": 1685,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-18-IMG": {
        "id": "",
        "top": 1751,
        "bottom": 1763,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-19-IMG": {
        "id": "",
        "top": 1858,
        "bottom": 1870,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-20-IMG": {
        "id": "",
        "top": 1983,
        "bottom": 1995,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-21-IMG": {
        "id": "",
        "top": 2093,
        "bottom": 2105,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-22-IMG": {
        "id": "",
        "top": 2218,
        "bottom": 2230,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-23-IMG": {
        "id": "",
        "top": 2311,
        "bottom": 2323,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-24-IMG": {
        "id": "",
        "top": 2419,
        "bottom": 2431,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-25-IMG": {
        "id": "",
        "top": 2526,
        "bottom": 2538,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-26-IMG": {
        "id": "",
        "top": 2637,
        "bottom": 2649,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-27-IMG": {
        "id": "",
        "top": 2744,
        "bottom": 2756,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-28-IMG": {
        "id": "",
        "top": 2822,
        "bottom": 2834,
        "left": 422,
        "right": 434,
        "width": 12,
        "height": 12
      },
      "1-29-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-30-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-31-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-32-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-33-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-34-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-35-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-36-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-37-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-38-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-39-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-40-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-41-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-42-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-43-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-44-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-45-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-46-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-47-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-48-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-49-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-50-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-51-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-52-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-53-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-54-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-55-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-56-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-57-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-58-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-59-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-60-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-61-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-62-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-63-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-64-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-65-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-66-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-67-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-68-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-69-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-70-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-71-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-72-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-73-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-74-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-75-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-76-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-77-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-78-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-79-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-80-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-81-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-82-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-83-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-84-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-85-LINK": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-86-META": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-87-META": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      },
      "1-88-META": {
        "id": "",
        "top": 0,
        "bottom": 0,
        "left": 0,
        "right": 0,
        "width": 0,
        "height": 0
      }
    }
  },
  "timing": {
    "entries": [
      {
        "startTime": 200,
        "name": "lh:config",
        "duration": 232,
        "entryType": "measure"
      },
      {
        "startTime": 201.4,
        "name": "lh:config:resolveArtifactsToDefns",
        "duration": 1.3,
        "entryType": "measure"
      },
      {
        "startTime": 432.2,
        "name": "lh:runner:gather",
        "duration": 27111.9,
        "entryType": "measure"
      },
      {
        "startTime": 432.4,
        "name": "lh:driver:connect",
        "duration": 19.7,
        "entryType": "measure"
      },
      {
        "startTime": 452.2,
        "name": "lh:driver:navigate",
        "duration": 26.9,
        "entryType": "measure"
      },
      {
        "startTime": 479.4,
        "name": "lh:gather:getBenchmarkIndex",
        "duration": 1019.1,
        "entryType": "measure"
      },
      {
        "startTime": 1498.6,
        "name": "lh:gather:getVersion",
        "duration": 5.3,
        "entryType": "measure"
      },
      {
        "startTime": 1503.9,
        "name": "lh:gather:getDevicePixelRatio",
        "duration": 2.2,
        "entryType": "measure"
      },
      {
        "startTime": 1506.5,
        "name": "lh:prepare:navigationMode",
        "duration": 8465.2,
        "entryType": "measure"
      },
      {
        "startTime": 1516.2,
        "name": "lh:storage:clearDataForOrigin",
        "duration": 53.2,
        "entryType": "measure"
      },
      {
        "startTime": 1569.5,
        "name": "lh:storage:clearBrowserCaches",
        "duration": 8399.3,
        "entryType": "measure"
      },
      {
        "startTime": 9970.1,
        "name": "lh:gather:prepareThrottlingAndNetwork",
        "duration": 1.6,
        "entryType": "measure"
      },
      {
        "startTime": 10125.6,
        "name": "lh:driver:navigate",
        "duration": 9421.4,
        "entryType": "measure"
      },
      {
        "startTime": 20598.5,
        "name": "lh:computed:NetworkRecords",
        "duration": 2.1,
        "entryType": "measure"
      },
      {
        "startTime": 20601,
        "name": "lh:gather:getArtifact:DevtoolsLog",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 20601.1,
        "name": "lh:gather:getArtifact:Trace",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 20601.1,
        "name": "lh:gather:getArtifact:ConsoleMessages",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 20601.2,
        "name": "lh:gather:getArtifact:CSSUsage",
        "duration": 466.3,
        "entryType": "measure"
      },
      {
        "startTime": 21067.6,
        "name": "lh:gather:getArtifact:DOMStats",
        "duration": 13.4,
        "entryType": "measure"
      },
      {
        "startTime": 21081,
        "name": "lh:gather:getArtifact:ImageElements",
        "duration": 4001.7,
        "entryType": "measure"
      },
      {
        "startTime": 25082.7,
        "name": "lh:gather:getArtifact:JsUsage",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25083,
        "name": "lh:gather:getArtifact:LinkElements",
        "duration": 10.6,
        "entryType": "measure"
      },
      {
        "startTime": 25092.9,
        "name": "lh:computed:MainResource",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25093.7,
        "name": "lh:gather:getArtifact:MetaElements",
        "duration": 5.9,
        "entryType": "measure"
      },
      {
        "startTime": 25099.6,
        "name": "lh:gather:getArtifact:NetworkUserAgent",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 25100,
        "name": "lh:gather:getArtifact:OptimizedImages",
        "duration": 10.5,
        "entryType": "measure"
      },
      {
        "startTime": 25110.6,
        "name": "lh:gather:getArtifact:ResponseCompression",
        "duration": 30.6,
        "entryType": "measure"
      },
      {
        "startTime": 25141.3,
        "name": "lh:gather:getArtifact:Scripts",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 25141.6,
        "name": "lh:gather:getArtifact:SourceMaps",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25141.7,
        "name": "lh:gather:getArtifact:Stacks",
        "duration": 40.2,
        "entryType": "measure"
      },
      {
        "startTime": 25141.8,
        "name": "lh:gather:collectStacks",
        "duration": 40.1,
        "entryType": "measure"
      },
      {
        "startTime": 25182,
        "name": "lh:gather:getArtifact:Stylesheets",
        "duration": 11.5,
        "entryType": "measure"
      },
      {
        "startTime": 25193.6,
        "name": "lh:gather:getArtifact:TraceElements",
        "duration": 590.5,
        "entryType": "measure"
      },
      {
        "startTime": 25193.9,
        "name": "lh:computed:TraceEngineResult",
        "duration": 534.1,
        "entryType": "measure"
      },
      {
        "startTime": 25194,
        "name": "lh:computed:ProcessedTrace",
        "duration": 45.8,
        "entryType": "measure"
      },
      {
        "startTime": 25243.6,
        "name": "lh:computed:TraceEngineResult:total",
        "duration": 463.9,
        "entryType": "measure"
      },
      {
        "startTime": 25243.7,
        "name": "lh:computed:TraceEngineResult:parse",
        "duration": 387.5,
        "entryType": "measure"
      },
      {
        "startTime": 25244.3,
        "name": "lh:computed:TraceEngineResult:parse:handleEvent",
        "duration": 205.8,
        "entryType": "measure"
      },
      {
        "startTime": 25450.2,
        "name": "lh:computed:TraceEngineResult:parse:Meta:finalize",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 25450.5,
        "name": "lh:computed:TraceEngineResult:parse:AnimationFrames:finalize",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25450.7,
        "name": "lh:computed:TraceEngineResult:parse:Animations:finalize",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 25451,
        "name": "lh:computed:TraceEngineResult:parse:Samples:finalize",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25451.1,
        "name": "lh:computed:TraceEngineResult:parse:AuctionWorklets:finalize",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25451.3,
        "name": "lh:computed:TraceEngineResult:parse:NetworkRequests:finalize",
        "duration": 11.2,
        "entryType": "measure"
      },
      {
        "startTime": 25462.6,
        "name": "lh:computed:TraceEngineResult:parse:Renderer:finalize",
        "duration": 23.9,
        "entryType": "measure"
      },
      {
        "startTime": 25486.6,
        "name": "lh:computed:TraceEngineResult:parse:Flows:finalize",
        "duration": 12.4,
        "entryType": "measure"
      },
      {
        "startTime": 25499,
        "name": "lh:computed:TraceEngineResult:parse:AsyncJSCalls:finalize",
        "duration": 5.3,
        "entryType": "measure"
      },
      {
        "startTime": 25504.4,
        "name": "lh:computed:TraceEngineResult:parse:DOMStats:finalize",
        "duration": 5,
        "entryType": "measure"
      },
      {
        "startTime": 25509.4,
        "name": "lh:computed:TraceEngineResult:parse:UserTimings:finalize",
        "duration": 4.3,
        "entryType": "measure"
      },
      {
        "startTime": 25513.7,
        "name": "lh:computed:TraceEngineResult:parse:ExtensionTraceData:finalize",
        "duration": 4.7,
        "entryType": "measure"
      },
      {
        "startTime": 25518.5,
        "name": "lh:computed:TraceEngineResult:parse:LayerTree:finalize",
        "duration": 4.7,
        "entryType": "measure"
      },
      {
        "startTime": 25523.3,
        "name": "lh:computed:TraceEngineResult:parse:Frames:finalize",
        "duration": 16.4,
        "entryType": "measure"
      },
      {
        "startTime": 25539.7,
        "name": "lh:computed:TraceEngineResult:parse:GPU:finalize",
        "duration": 4.9,
        "entryType": "measure"
      },
      {
        "startTime": 25544.7,
        "name": "lh:computed:TraceEngineResult:parse:ImagePainting:finalize",
        "duration": 5,
        "entryType": "measure"
      },
      {
        "startTime": 25549.8,
        "name": "lh:computed:TraceEngineResult:parse:Initiators:finalize",
        "duration": 7.4,
        "entryType": "measure"
      },
      {
        "startTime": 25557.3,
        "name": "lh:computed:TraceEngineResult:parse:Invalidations:finalize",
        "duration": 4.4,
        "entryType": "measure"
      },
      {
        "startTime": 25561.7,
        "name": "lh:computed:TraceEngineResult:parse:PageLoadMetrics:finalize",
        "duration": 6.6,
        "entryType": "measure"
      },
      {
        "startTime": 25568.3,
        "name": "lh:computed:TraceEngineResult:parse:LargestImagePaint:finalize",
        "duration": 5.7,
        "entryType": "measure"
      },
      {
        "startTime": 25574,
        "name": "lh:computed:TraceEngineResult:parse:LargestTextPaint:finalize",
        "duration": 4.4,
        "entryType": "measure"
      },
      {
        "startTime": 25578.5,
        "name": "lh:computed:TraceEngineResult:parse:Screenshots:finalize",
        "duration": 5.6,
        "entryType": "measure"
      },
      {
        "startTime": 25584.1,
        "name": "lh:computed:TraceEngineResult:parse:LayoutShifts:finalize",
        "duration": 6.5,
        "entryType": "measure"
      },
      {
        "startTime": 25590.7,
        "name": "lh:computed:TraceEngineResult:parse:Memory:finalize",
        "duration": 5.4,
        "entryType": "measure"
      },
      {
        "startTime": 25596.2,
        "name": "lh:computed:TraceEngineResult:parse:PageFrames:finalize",
        "duration": 5.8,
        "entryType": "measure"
      },
      {
        "startTime": 25602.1,
        "name": "lh:computed:TraceEngineResult:parse:Scripts:finalize",
        "duration": 6.7,
        "entryType": "measure"
      },
      {
        "startTime": 25608.9,
        "name": "lh:computed:TraceEngineResult:parse:SelectorStats:finalize",
        "duration": 4.5,
        "entryType": "measure"
      },
      {
        "startTime": 25613.6,
        "name": "lh:computed:TraceEngineResult:parse:UserInteractions:finalize",
        "duration": 5.2,
        "entryType": "measure"
      },
      {
        "startTime": 25618.9,
        "name": "lh:computed:TraceEngineResult:parse:Workers:finalize",
        "duration": 4.5,
        "entryType": "measure"
      },
      {
        "startTime": 25623.5,
        "name": "lh:computed:TraceEngineResult:parse:Warnings:finalize",
        "duration": 5,
        "entryType": "measure"
      },
      {
        "startTime": 25628.5,
        "name": "lh:computed:TraceEngineResult:parse:clone",
        "duration": 2.7,
        "entryType": "measure"
      },
      {
        "startTime": 25631.2,
        "name": "lh:computed:TraceEngineResult:insights",
        "duration": 76.2,
        "entryType": "measure"
      },
      {
        "startTime": 25631.7,
        "name": "lh:computed:TraceEngineResult:insights:CLSCulprits",
        "duration": 0.5,
        "entryType": "measure"
      },
      {
        "startTime": 25632.3,
        "name": "lh:computed:TraceEngineResult:insights:Cache",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 25632.7,
        "name": "lh:computed:TraceEngineResult:insights:DOMSize",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 25633.1,
        "name": "lh:computed:TraceEngineResult:insights:DocumentLatency",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25633.3,
        "name": "lh:computed:TraceEngineResult:insights:DuplicatedJavaScript",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 25633.7,
        "name": "lh:computed:TraceEngineResult:insights:FontDisplay",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25633.8,
        "name": "lh:computed:TraceEngineResult:insights:ForcedReflow",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25634,
        "name": "lh:computed:TraceEngineResult:insights:INPBreakdown",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25634.1,
        "name": "lh:computed:TraceEngineResult:insights:ImageDelivery",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25634.4,
        "name": "lh:computed:TraceEngineResult:insights:LCPBreakdown",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 25634.4,
        "name": "lh:computed:TraceEngineResult:insights:LCPDiscovery",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25634.6,
        "name": "lh:computed:TraceEngineResult:insights:LegacyJavaScript",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25634.7,
        "name": "lh:computed:TraceEngineResult:insights:ModernHTTP",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25634.9,
        "name": "lh:computed:TraceEngineResult:insights:NetworkDependencyTree",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25635,
        "name": "lh:computed:TraceEngineResult:insights:RenderBlocking",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25635.2,
        "name": "lh:computed:TraceEngineResult:insights:SlowCSSSelector",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25635.4,
        "name": "lh:computed:TraceEngineResult:insights:ThirdParties",
        "duration": 1.7,
        "entryType": "measure"
      },
      {
        "startTime": 25637.1,
        "name": "lh:computed:TraceEngineResult:insights:Viewport",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25637.4,
        "name": "lh:computed:TraceEngineResult:insights:createLanternContext",
        "duration": 43.6,
        "entryType": "measure"
      },
      {
        "startTime": 25681,
        "name": "lh:computed:TraceEngineResult:insights:CLSCulprits",
        "duration": 0.6,
        "entryType": "measure"
      },
      {
        "startTime": 25681.6,
        "name": "lh:computed:TraceEngineResult:insights:Cache",
        "duration": 0.7,
        "entryType": "measure"
      },
      {
        "startTime": 25682.3,
        "name": "lh:computed:TraceEngineResult:insights:DOMSize",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 25682.6,
        "name": "lh:computed:TraceEngineResult:insights:DocumentLatency",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25682.8,
        "name": "lh:computed:TraceEngineResult:insights:DuplicatedJavaScript",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 25683,
        "name": "lh:computed:TraceEngineResult:insights:FontDisplay",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 25683,
        "name": "lh:computed:TraceEngineResult:insights:ForcedReflow",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25683.1,
        "name": "lh:computed:TraceEngineResult:insights:INPBreakdown",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 25683.1,
        "name": "lh:computed:TraceEngineResult:insights:ImageDelivery",
        "duration": 2.9,
        "entryType": "measure"
      },
      {
        "startTime": 25686,
        "name": "lh:computed:TraceEngineResult:insights:LCPBreakdown",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 25686.3,
        "name": "lh:computed:TraceEngineResult:insights:LCPDiscovery",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25686.4,
        "name": "lh:computed:TraceEngineResult:insights:LegacyJavaScript",
        "duration": 4.7,
        "entryType": "measure"
      },
      {
        "startTime": 25691.1,
        "name": "lh:computed:TraceEngineResult:insights:ModernHTTP",
        "duration": 3.5,
        "entryType": "measure"
      },
      {
        "startTime": 25694.6,
        "name": "lh:computed:TraceEngineResult:insights:NetworkDependencyTree",
        "duration": 2.1,
        "entryType": "measure"
      },
      {
        "startTime": 25696.7,
        "name": "lh:computed:TraceEngineResult:insights:RenderBlocking",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 25697.1,
        "name": "lh:computed:TraceEngineResult:insights:SlowCSSSelector",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 25697.1,
        "name": "lh:computed:TraceEngineResult:insights:ThirdParties",
        "duration": 9.6,
        "entryType": "measure"
      },
      {
        "startTime": 25706.7,
        "name": "lh:computed:TraceEngineResult:insights:Viewport",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25735.3,
        "name": "lh:computed:ProcessedNavigation",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 25736.1,
        "name": "lh:computed:CumulativeLayoutShift",
        "duration": 32,
        "entryType": "measure"
      },
      {
        "startTime": 25769.4,
        "name": "lh:computed:Responsiveness",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 25784.1,
        "name": "lh:gather:getArtifact:ViewportDimensions",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 25785,
        "name": "lh:gather:getArtifact:FullPageScreenshot",
        "duration": 1278.7,
        "entryType": "measure"
      },
      {
        "startTime": 27063.8,
        "name": "lh:gather:getArtifact:BFCacheFailures",
        "duration": 454.5,
        "entryType": "measure"
      },
      {
        "startTime": 27544.3,
        "name": "lh:runner:audit",
        "duration": 817,
        "entryType": "measure"
      },
      {
        "startTime": 27544.5,
        "name": "lh:runner:auditing",
        "duration": 816.2,
        "entryType": "measure"
      },
      {
        "startTime": 27546,
        "name": "lh:audit:viewport",
        "duration": 2.4,
        "entryType": "measure"
      },
      {
        "startTime": 27546.9,
        "name": "lh:computed:ViewportMeta",
        "duration": 0.5,
        "entryType": "measure"
      },
      {
        "startTime": 27548.6,
        "name": "lh:audit:first-contentful-paint",
        "duration": 15,
        "entryType": "measure"
      },
      {
        "startTime": 27549.1,
        "name": "lh:computed:FirstContentfulPaint",
        "duration": 13.1,
        "entryType": "measure"
      },
      {
        "startTime": 27549.3,
        "name": "lh:computed:LanternFirstContentfulPaint",
        "duration": 12.9,
        "entryType": "measure"
      },
      {
        "startTime": 27549.4,
        "name": "lh:computed:PageDependencyGraph",
        "duration": 8.4,
        "entryType": "measure"
      },
      {
        "startTime": 27557.9,
        "name": "lh:computed:LoadSimulator",
        "duration": 1.7,
        "entryType": "measure"
      },
      {
        "startTime": 27558,
        "name": "lh:computed:NetworkAnalysis",
        "duration": 1.5,
        "entryType": "measure"
      },
      {
        "startTime": 27563.8,
        "name": "lh:audit:largest-contentful-paint",
        "duration": 6.2,
        "entryType": "measure"
      },
      {
        "startTime": 27564.2,
        "name": "lh:computed:LargestContentfulPaint",
        "duration": 5,
        "entryType": "measure"
      },
      {
        "startTime": 27564.3,
        "name": "lh:computed:LanternLargestContentfulPaint",
        "duration": 4.9,
        "entryType": "measure"
      },
      {
        "startTime": 27570.2,
        "name": "lh:audit:first-meaningful-paint",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 27571.2,
        "name": "lh:audit:speed-index",
        "duration": 293.8,
        "entryType": "measure"
      },
      {
        "startTime": 27571.6,
        "name": "lh:computed:LanternSpeedIndex",
        "duration": 292.4,
        "entryType": "measure"
      },
      {
        "startTime": 27571.6,
        "name": "lh:computed:SpeedIndex",
        "duration": 292.4,
        "entryType": "measure"
      },
      {
        "startTime": 27571.7,
        "name": "lh:computed:Speedline",
        "duration": 284.2,
        "entryType": "measure"
      },
      {
        "startTime": 27865,
        "name": "lh:audit:screenshot-thumbnails",
        "duration": 1.8,
        "entryType": "measure"
      },
      {
        "startTime": 27866.8,
        "name": "lh:audit:final-screenshot",
        "duration": 2.1,
        "entryType": "measure"
      },
      {
        "startTime": 27867.1,
        "name": "lh:computed:Screenshots",
        "duration": 1.7,
        "entryType": "measure"
      },
      {
        "startTime": 27869.2,
        "name": "lh:audit:total-blocking-time",
        "duration": 19,
        "entryType": "measure"
      },
      {
        "startTime": 27869.7,
        "name": "lh:computed:TotalBlockingTime",
        "duration": 17.7,
        "entryType": "measure"
      },
      {
        "startTime": 27869.8,
        "name": "lh:computed:LanternInteractive",
        "duration": 7,
        "entryType": "measure"
      },
      {
        "startTime": 27869.8,
        "name": "lh:computed:LanternTotalBlockingTime",
        "duration": 17.6,
        "entryType": "measure"
      },
      {
        "startTime": 27888.5,
        "name": "lh:audit:max-potential-fid",
        "duration": 8,
        "entryType": "measure"
      },
      {
        "startTime": 27888.9,
        "name": "lh:computed:MaxPotentialFID",
        "duration": 6.2,
        "entryType": "measure"
      },
      {
        "startTime": 27889,
        "name": "lh:computed:LanternMaxPotentialFID",
        "duration": 6.1,
        "entryType": "measure"
      },
      {
        "startTime": 27896.8,
        "name": "lh:audit:cumulative-layout-shift",
        "duration": 1.3,
        "entryType": "measure"
      },
      {
        "startTime": 27898.3,
        "name": "lh:audit:server-response-time",
        "duration": 2.7,
        "entryType": "measure"
      },
      {
        "startTime": 27901.3,
        "name": "lh:audit:interactive",
        "duration": 1.3,
        "entryType": "measure"
      },
      {
        "startTime": 27901.8,
        "name": "lh:computed:Interactive",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27902.8,
        "name": "lh:audit:user-timings",
        "duration": 4.4,
        "entryType": "measure"
      },
      {
        "startTime": 27903.3,
        "name": "lh:computed:UserTimings",
        "duration": 2.9,
        "entryType": "measure"
      },
      {
        "startTime": 27907.4,
        "name": "lh:audit:critical-request-chains",
        "duration": 3.7,
        "entryType": "measure"
      },
      {
        "startTime": 27907.9,
        "name": "lh:computed:CriticalRequestChains",
        "duration": 1,
        "entryType": "measure"
      },
      {
        "startTime": 27911.3,
        "name": "lh:audit:redirects",
        "duration": 3.1,
        "entryType": "measure"
      },
      {
        "startTime": 27914.5,
        "name": "lh:audit:mainthread-work-breakdown",
        "duration": 18.4,
        "entryType": "measure"
      },
      {
        "startTime": 27915.1,
        "name": "lh:computed:MainThreadTasks",
        "duration": 16,
        "entryType": "measure"
      },
      {
        "startTime": 27933.1,
        "name": "lh:audit:bootup-time",
        "duration": 11,
        "entryType": "measure"
      },
      {
        "startTime": 27935.7,
        "name": "lh:computed:TBTImpactTasks",
        "duration": 5.1,
        "entryType": "measure"
      },
      {
        "startTime": 27944.2,
        "name": "lh:audit:uses-rel-preconnect",
        "duration": 2.2,
        "entryType": "measure"
      },
      {
        "startTime": 27946.6,
        "name": "lh:audit:font-display",
        "duration": 1.1,
        "entryType": "measure"
      },
      {
        "startTime": 27947.7,
        "name": "lh:audit:diagnostics",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 27948.6,
        "name": "lh:audit:network-requests",
        "duration": 3.2,
        "entryType": "measure"
      },
      {
        "startTime": 27948.8,
        "name": "lh:computed:EntityClassification",
        "duration": 1.7,
        "entryType": "measure"
      },
      {
        "startTime": 27952,
        "name": "lh:audit:network-rtt",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 27953,
        "name": "lh:audit:network-server-latency",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 27953.8,
        "name": "lh:audit:main-thread-tasks",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 27954.2,
        "name": "lh:audit:metrics",
        "duration": 2.6,
        "entryType": "measure"
      },
      {
        "startTime": 27954.4,
        "name": "lh:computed:TimingSummary",
        "duration": 2.4,
        "entryType": "measure"
      },
      {
        "startTime": 27954.6,
        "name": "lh:computed:FirstContentfulPaintAllFrames",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27954.7,
        "name": "lh:computed:LargestContentfulPaintAllFrames",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27954.8,
        "name": "lh:computed:TimeToFirstByte",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27954.8,
        "name": "lh:computed:LCPBreakdown",
        "duration": 1.6,
        "entryType": "measure"
      },
      {
        "startTime": 27955,
        "name": "lh:computed:LCPImageRecord",
        "duration": 1.3,
        "entryType": "measure"
      },
      {
        "startTime": 27956.8,
        "name": "lh:audit:resource-summary",
        "duration": 1.2,
        "entryType": "measure"
      },
      {
        "startTime": 27957.1,
        "name": "lh:computed:ResourceSummary",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 27958.2,
        "name": "lh:audit:third-party-summary",
        "duration": 3.7,
        "entryType": "measure"
      },
      {
        "startTime": 27962,
        "name": "lh:audit:third-party-facades",
        "duration": 3,
        "entryType": "measure"
      },
      {
        "startTime": 27965.1,
        "name": "lh:audit:largest-contentful-paint-element",
        "duration": 1.1,
        "entryType": "measure"
      },
      {
        "startTime": 27966.4,
        "name": "lh:audit:lcp-lazy-loaded",
        "duration": 0.7,
        "entryType": "measure"
      },
      {
        "startTime": 27967.3,
        "name": "lh:audit:layout-shifts",
        "duration": 1.8,
        "entryType": "measure"
      },
      {
        "startTime": 27969.4,
        "name": "lh:audit:long-tasks",
        "duration": 5.6,
        "entryType": "measure"
      },
      {
        "startTime": 27975.2,
        "name": "lh:audit:non-composited-animations",
        "duration": 1.2,
        "entryType": "measure"
      },
      {
        "startTime": 27976.6,
        "name": "lh:audit:unsized-images",
        "duration": 1.6,
        "entryType": "measure"
      },
      {
        "startTime": 27978.3,
        "name": "lh:audit:prioritize-lcp-image",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 27979.2,
        "name": "lh:audit:script-treemap-data",
        "duration": 32.8,
        "entryType": "measure"
      },
      {
        "startTime": 27979.4,
        "name": "lh:computed:JSBundles",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27979.5,
        "name": "lh:computed:ModuleDuplication",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27979.6,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27980.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27980.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 1,
        "entryType": "measure"
      },
      {
        "startTime": 27981.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 11.1,
        "entryType": "measure"
      },
      {
        "startTime": 27992.6,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27992.8,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 27993.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27993.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.5,
        "entryType": "measure"
      },
      {
        "startTime": 27993.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27994.1,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27994.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27994.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27995,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27995.2,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27995.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27995.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27995.6,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27995.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27995.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.5,
        "entryType": "measure"
      },
      {
        "startTime": 27996.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27996.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27996.6,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 27996.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27997.1,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27997.2,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 1.5,
        "entryType": "measure"
      },
      {
        "startTime": 27998.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 27999,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 27999.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27999.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 27999.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.5,
        "entryType": "measure"
      },
      {
        "startTime": 28000,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28000.2,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28000.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28000.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28000.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28000.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28001.1,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 28001.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28001.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 28002,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28002.1,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28002.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 1.7,
        "entryType": "measure"
      },
      {
        "startTime": 28004.2,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28004.4,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0,
        "entryType": "measure"
      },
      {
        "startTime": 28004.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28004.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28004.8,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28005,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28005.2,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 3.5,
        "entryType": "measure"
      },
      {
        "startTime": 28008.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28009,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28009.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28009.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28009.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28009.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 28010.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28010.5,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28010.7,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28010.9,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28011,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28011.3,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.2,
        "entryType": "measure"
      },
      {
        "startTime": 28011.6,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28011.8,
        "name": "lh:computed:UnusedJavascriptSummary",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28012.3,
        "name": "lh:audit:uses-long-cache-ttl",
        "duration": 2.5,
        "entryType": "measure"
      },
      {
        "startTime": 28015,
        "name": "lh:audit:total-byte-weight",
        "duration": 2,
        "entryType": "measure"
      },
      {
        "startTime": 28017.2,
        "name": "lh:audit:offscreen-images",
        "duration": 6.7,
        "entryType": "measure"
      },
      {
        "startTime": 28024.1,
        "name": "lh:audit:render-blocking-resources",
        "duration": 2.2,
        "entryType": "measure"
      },
      {
        "startTime": 28024.8,
        "name": "lh:computed:UnusedCSS",
        "duration": 0.4,
        "entryType": "measure"
      },
      {
        "startTime": 28025.2,
        "name": "lh:computed:NavigationInsights",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28025.4,
        "name": "lh:computed:FirstContentfulPaint",
        "duration": 0.1,
        "entryType": "measure"
      },
      {
        "startTime": 28026.4,
        "name": "lh:audit:unminified-css",
        "duration": 10.4,
        "entryType": "measure"
      },
      {
        "startTime": 28037,
        "name": "lh:audit:unminified-javascript",
        "duration": 72.4,
        "entryType": "measure"
      },
      {
        "startTime": 28109.7,
        "name": "lh:audit:unused-css-rules",
        "duration": 3.3,
        "entryType": "measure"
      },
      {
        "startTime": 28113.3,
        "name": "lh:audit:unused-javascript",
        "duration": 9.3,
        "entryType": "measure"
      },
      {
        "startTime": 28122.7,
        "name": "lh:audit:modern-image-formats",
        "duration": 6.3,
        "entryType": "measure"
      },
      {
        "startTime": 28129.1,
        "name": "lh:audit:uses-optimized-images",
        "duration": 4.7,
        "entryType": "measure"
      },
      {
        "startTime": 28133.9,
        "name": "lh:audit:uses-text-compression",
        "duration": 3.8,
        "entryType": "measure"
      },
      {
        "startTime": 28137.9,
        "name": "lh:audit:uses-responsive-images",
        "duration": 5.2,
        "entryType": "measure"
      },
      {
        "startTime": 28138.3,
        "name": "lh:computed:ImageRecords",
        "duration": 0.3,
        "entryType": "measure"
      },
      {
        "startTime": 28143.3,
        "name": "lh:audit:efficient-animated-content",
        "duration": 3.4,
        "entryType": "measure"
      },
      {
        "startTime": 28146.8,
        "name": "lh:audit:duplicated-javascript",
        "duration": 3.3,
        "entryType": "measure"
      },
      {
        "startTime": 28150.2,
        "name": "lh:audit:legacy-javascript",
        "duration": 167.3,
        "entryType": "measure"
      },
      {
        "startTime": 28317.7,
        "name": "lh:audit:dom-size",
        "duration": 1.8,
        "entryType": "measure"
      },
      {
        "startTime": 28319.7,
        "name": "lh:audit:no-document-write",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28320.7,
        "name": "lh:audit:uses-http2",
        "duration": 3.7,
        "entryType": "measure"
      },
      {
        "startTime": 28324.5,
        "name": "lh:audit:uses-passive-event-listeners",
        "duration": 3.3,
        "entryType": "measure"
      },
      {
        "startTime": 28328,
        "name": "lh:audit:bf-cache",
        "duration": 1.1,
        "entryType": "measure"
      },
      {
        "startTime": 28329.2,
        "name": "lh:audit:cache-insight",
        "duration": 1.1,
        "entryType": "measure"
      },
      {
        "startTime": 28330.4,
        "name": "lh:audit:cls-culprits-insight",
        "duration": 1.2,
        "entryType": "measure"
      },
      {
        "startTime": 28331.7,
        "name": "lh:audit:document-latency-insight",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28332.7,
        "name": "lh:audit:dom-size-insight",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28333.7,
        "name": "lh:audit:duplicated-javascript-insight",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28334.7,
        "name": "lh:audit:font-display-insight",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28335.6,
        "name": "lh:audit:forced-reflow-insight",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 28336.7,
        "name": "lh:audit:image-delivery-insight",
        "duration": 1.3,
        "entryType": "measure"
      },
      {
        "startTime": 28338.1,
        "name": "lh:audit:inp-breakdown-insight",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 28339.2,
        "name": "lh:audit:lcp-breakdown-insight",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 28340.3,
        "name": "lh:audit:lcp-discovery-insight",
        "duration": 0.6,
        "entryType": "measure"
      },
      {
        "startTime": 28341.1,
        "name": "lh:audit:legacy-javascript-insight",
        "duration": 1.1,
        "entryType": "measure"
      },
      {
        "startTime": 28342.4,
        "name": "lh:audit:modern-http-insight",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 28343.5,
        "name": "lh:audit:network-dependency-tree-insight",
        "duration": 1,
        "entryType": "measure"
      },
      {
        "startTime": 28344.7,
        "name": "lh:audit:render-blocking-insight",
        "duration": 0.9,
        "entryType": "measure"
      },
      {
        "startTime": 28345.8,
        "name": "lh:audit:third-parties-insight",
        "duration": 13.9,
        "entryType": "measure"
      },
      {
        "startTime": 28359.9,
        "name": "lh:audit:viewport-insight",
        "duration": 0.8,
        "entryType": "measure"
      },
      {
        "startTime": 28360.8,
        "name": "lh:runner:generate",
        "duration": 0.5,
        "entryType": "measure"
      }
    ],
    "total": 27928.9
  },
  "i18n": {
    "rendererFormattedStrings": {},
    "icuMessagePaths": {
      "core/audits/viewport.js | title": [
        "audits.viewport.title"
      ],
      "core/audits/viewport.js | description": [
        "audits.viewport.description"
      ],
      "core/lib/i18n/i18n.js | firstContentfulPaintMetric": [
        "audits[first-contentful-paint].title"
      ],
      "core/audits/metrics/first-contentful-paint.js | description": [
        "audits[first-contentful-paint].description"
      ],
      "core/lib/i18n/i18n.js | seconds": [
        {
          "values": {
            "timeInMs": 642.4782
          },
          "path": "audits[first-contentful-paint].displayValue"
        },
        {
          "values": {
            "timeInMs": 1212.4782
          },
          "path": "audits[largest-contentful-paint].displayValue"
        },
        {
          "values": {
            "timeInMs": 1439.432639162748
          },
          "path": "audits[speed-index].displayValue"
        },
        {
          "values": {
            "timeInMs": 1234.4782
          },
          "path": "audits.interactive.displayValue"
        },
        {
          "values": {
            "timeInMs": 719.469999999997
          },
          "path": "audits[mainthread-work-breakdown].displayValue"
        },
        {
          "values": {
            "timeInMs": 288.0770000000011
          },
          "path": "audits[bootup-time].displayValue"
        }
      ],
      "core/lib/i18n/i18n.js | largestContentfulPaintMetric": [
        "audits[largest-contentful-paint].title"
      ],
      "core/audits/metrics/largest-contentful-paint.js | description": [
        "audits[largest-contentful-paint].description"
      ],
      "core/lib/i18n/i18n.js | firstMeaningfulPaintMetric": [
        "audits[first-meaningful-paint].title"
      ],
      "core/audits/metrics/first-meaningful-paint.js | description": [
        "audits[first-meaningful-paint].description"
      ],
      "core/lib/i18n/i18n.js | speedIndexMetric": [
        "audits[speed-index].title"
      ],
      "core/audits/metrics/speed-index.js | description": [
        "audits[speed-index].description"
      ],
      "core/lib/i18n/i18n.js | totalBlockingTimeMetric": [
        "audits[total-blocking-time].title"
      ],
      "core/audits/metrics/total-blocking-time.js | description": [
        "audits[total-blocking-time].description"
      ],
      "core/lib/i18n/i18n.js | ms": [
        {
          "values": {
            "timeInMs": 20
          },
          "path": "audits[total-blocking-time].displayValue"
        },
        {
          "values": {
            "timeInMs": 90
          },
          "path": "audits[max-potential-fid].displayValue"
        },
        {
          "values": {
            "timeInMs": 40.611000000000004
          },
          "path": "audits[network-rtt].displayValue"
        },
        {
          "values": {
            "timeInMs": 162.47820000000002
          },
          "path": "audits[network-server-latency].displayValue"
        },
        {
          "values": {
            "timeInMs": 1212.4782
          },
          "path": "audits[largest-contentful-paint-element].displayValue"
        }
      ],
      "core/lib/i18n/i18n.js | maxPotentialFIDMetric": [
        "audits[max-potential-fid].title"
      ],
      "core/audits/metrics/max-potential-fid.js | description": [
        "audits[max-potential-fid].description"
      ],
      "core/lib/i18n/i18n.js | cumulativeLayoutShiftMetric": [
        "audits[cumulative-layout-shift].title"
      ],
      "core/audits/metrics/cumulative-layout-shift.js | description": [
        "audits[cumulative-layout-shift].description"
      ],
      "core/audits/server-response-time.js | title": [
        "audits[server-response-time].title"
      ],
      "core/audits/server-response-time.js | description": [
        "audits[server-response-time].description"
      ],
      "core/audits/server-response-time.js | displayValue": [
        {
          "values": {
            "timeInMs": 17.429000000000002
          },
          "path": "audits[server-response-time].displayValue"
        }
      ],
      "core/lib/i18n/i18n.js | columnURL": [
        "audits[server-response-time].details.headings[0].label",
        "audits[bootup-time].details.headings[0].label",
        "audits[uses-rel-preconnect].details.headings[0].label",
        "audits[font-display].details.headings[0].label",
        "audits[network-rtt].details.headings[0].label",
        "audits[network-server-latency].details.headings[0].label",
        "audits[long-tasks].details.headings[0].label",
        "audits[unsized-images].details.headings[1].label",
        "audits[uses-long-cache-ttl].details.headings[0].label",
        "audits[total-byte-weight].details.headings[0].label",
        "audits[unminified-javascript].details.headings[0].label",
        "audits[unused-javascript].details.headings[0].label",
        "audits[modern-image-formats].details.headings[1].label",
        "audits[uses-responsive-images].details.headings[1].label",
        "audits[font-display-insight].details.headings[0].label",
        "audits[image-delivery-insight].details.headings[0].label",
        "audits[legacy-javascript-insight].details.headings[0].label",
        "audits[modern-http-insight].details.headings[0].label",
        "audits[render-blocking-insight].details.headings[0].label"
      ],
      "core/lib/i18n/i18n.js | columnTimeSpent": [
        "audits[server-response-time].details.headings[1].label",
        "audits[mainthread-work-breakdown].details.headings[1].label",
        "audits[network-rtt].details.headings[1].label",
        "audits[network-server-latency].details.headings[1].label"
      ],
      "core/lib/i18n/i18n.js | interactiveMetric": [
        "audits.interactive.title"
      ],
      "core/audits/metrics/interactive.js | description": [
        "audits.interactive.description"
      ],
      "core/audits/user-timings.js | title": [
        "audits[user-timings].title"
      ],
      "core/audits/user-timings.js | description": [
        "audits[user-timings].description"
      ],
      "core/lib/i18n/i18n.js | columnName": [
        "audits[user-timings].details.headings[0].label"
      ],
      "core/audits/user-timings.js | columnType": [
        "audits[user-timings].details.headings[1].label"
      ],
      "core/lib/i18n/i18n.js | columnStartTime": [
        "audits[user-timings].details.headings[2].label",
        "audits[long-tasks].details.headings[1].label"
      ],
      "core/lib/i18n/i18n.js | columnDuration": [
        "audits[user-timings].details.headings[3].label",
        "audits[long-tasks].details.headings[2].label",
        "audits[lcp-breakdown-insight].details.items[0].headings[1].label",
        "audits[render-blocking-insight].details.headings[2].label"
      ],
      "core/audits/critical-request-chains.js | title": [
        "audits[critical-request-chains].title"
      ],
      "core/audits/critical-request-chains.js | description": [
        "audits[critical-request-chains].description"
      ],
      "core/audits/redirects.js | title": [
        "audits.redirects.title"
      ],
      "core/audits/redirects.js | description": [
        "audits.redirects.description"
      ],
      "core/audits/mainthread-work-breakdown.js | title": [
        "audits[mainthread-work-breakdown].title"
      ],
      "core/audits/mainthread-work-breakdown.js | description": [
        "audits[mainthread-work-breakdown].description"
      ],
      "core/audits/mainthread-work-breakdown.js | columnCategory": [
        "audits[mainthread-work-breakdown].details.headings[0].label"
      ],
      "core/audits/bootup-time.js | title": [
        "audits[bootup-time].title"
      ],
      "core/audits/bootup-time.js | description": [
        "audits[bootup-time].description"
      ],
      "core/audits/bootup-time.js | columnTotal": [
        "audits[bootup-time].details.headings[1].label"
      ],
      "core/audits/bootup-time.js | columnScriptEval": [
        "audits[bootup-time].details.headings[2].label"
      ],
      "core/audits/bootup-time.js | columnScriptParse": [
        "audits[bootup-time].details.headings[3].label"
      ],
      "core/audits/uses-rel-preconnect.js | title": [
        "audits[uses-rel-preconnect].title"
      ],
      "core/audits/uses-rel-preconnect.js | description": [
        "audits[uses-rel-preconnect].description"
      ],
      "core/lib/i18n/i18n.js | displayValueMsSavings": [
        {
          "values": {
            "wastedMs": 161.0064
          },
          "path": "audits[uses-rel-preconnect].displayValue"
        }
      ],
      "core/lib/i18n/i18n.js | columnWastedBytes": [
        "audits[uses-rel-preconnect].details.headings[1].label",
        "audits[font-display].details.headings[1].label",
        "audits[unminified-javascript].details.headings[2].label",
        "audits[unused-javascript].details.headings[2].label",
        "audits[modern-image-formats].details.headings[3].label",
        "audits[uses-responsive-images].details.headings[3].label",
        "audits[font-display-insight].details.headings[1].label",
        "audits[image-delivery-insight].details.headings[2].label"
      ],
      "core/audits/font-display.js | title": [
        "audits[font-display].title"
      ],
      "core/audits/font-display.js | description": [
        "audits[font-display].description"
      ],
      "core/audits/network-rtt.js | title": [
        "audits[network-rtt].title"
      ],
      "core/audits/network-rtt.js | description": [
        "audits[network-rtt].description"
      ],
      "core/audits/network-server-latency.js | title": [
        "audits[network-server-latency].title"
      ],
      "core/audits/network-server-latency.js | description": [
        "audits[network-server-latency].description"
      ],
      "core/lib/i18n/i18n.js | columnResourceType": [
        "audits[resource-summary].details.headings[0].label"
      ],
      "core/lib/i18n/i18n.js | columnRequests": [
        "audits[resource-summary].details.headings[1].label"
      ],
      "core/lib/i18n/i18n.js | columnTransferSize": [
        "audits[resource-summary].details.headings[2].label",
        "audits[third-party-summary].details.headings[1].label",
        "audits[uses-long-cache-ttl].details.headings[2].label",
        "audits[total-byte-weight].details.headings[1].label",
        "audits[unminified-javascript].details.headings[1].label",
        "audits[unused-javascript].details.headings[1].label",
        "audits[cache-insight].details.headings[2].label",
        "audits[render-blocking-insight].details.headings[1].label"
      ],
      "core/lib/i18n/i18n.js | total": [
        "audits[resource-summary].details.items[0].label",
        "audits[cls-culprits-insight].details.items[0].items[0].node.value",
        "audits[cls-culprits-insight].details.items[1].items[0].node.value"
      ],
      "core/lib/i18n/i18n.js | scriptResourceType": [
        "audits[resource-summary].details.items[1].label"
      ],
      "core/lib/i18n/i18n.js | otherResourceType": [
        "audits[resource-summary].details.items[2].label"
      ],
      "core/lib/i18n/i18n.js | imageResourceType": [
        "audits[resource-summary].details.items[3].label"
      ],
      "core/lib/i18n/i18n.js | stylesheetResourceType": [
        "audits[resource-summary].details.items[4].label"
      ],
      "core/lib/i18n/i18n.js | documentResourceType": [
        "audits[resource-summary].details.items[5].label"
      ],
      "core/lib/i18n/i18n.js | mediaResourceType": [
        "audits[resource-summary].details.items[6].label"
      ],
      "core/lib/i18n/i18n.js | fontResourceType": [
        "audits[resource-summary].details.items[7].label"
      ],
      "core/lib/i18n/i18n.js | thirdPartyResourceType": [
        "audits[resource-summary].details.items[8].label"
      ],
      "core/audits/third-party-summary.js | title": [
        "audits[third-party-summary].title"
      ],
      "core/audits/third-party-summary.js | description": [
        "audits[third-party-summary].description"
      ],
      "core/audits/third-party-summary.js | displayValue": [
        {
          "values": {
            "timeInMs": 0
          },
          "path": "audits[third-party-summary].displayValue"
        }
      ],
      "core/audits/third-party-summary.js | columnThirdParty": [
        "audits[third-party-summary].details.headings[0].label"
      ],
      "core/lib/i18n/i18n.js | columnBlockingTime": [
        "audits[third-party-summary].details.headings[2].label"
      ],
      "core/audits/third-party-facades.js | title": [
        "audits[third-party-facades].title"
      ],
      "core/audits/third-party-facades.js | description": [
        "audits[third-party-facades].description"
      ],
      "core/audits/largest-contentful-paint-element.js | title": [
        "audits[largest-contentful-paint-element].title"
      ],
      "core/audits/largest-contentful-paint-element.js | description": [
        "audits[largest-contentful-paint-element].description"
      ],
      "core/lib/i18n/i18n.js | columnElement": [
        "audits[largest-contentful-paint-element].details.items[0].headings[0].label",
        "audits[layout-shifts].details.headings[0].label",
        "audits[non-composited-animations].details.headings[0].label",
        "audits[dom-size].details.headings[1].label",
        "audits[cls-culprits-insight].details.items[0].headings[0].label",
        "audits[dom-size-insight].details.headings[1].label"
      ],
      "core/audits/largest-contentful-paint-element.js | columnPhase": [
        "audits[largest-contentful-paint-element].details.items[1].headings[0].label"
      ],
      "core/audits/largest-contentful-paint-element.js | columnPercentOfLCP": [
        "audits[largest-contentful-paint-element].details.items[1].headings[1].label"
      ],
      "core/audits/largest-contentful-paint-element.js | columnTiming": [
        "audits[largest-contentful-paint-element].details.items[1].headings[2].label"
      ],
      "core/audits/largest-contentful-paint-element.js | itemTTFB": [
        "audits[largest-contentful-paint-element].details.items[1].items[0].phase"
      ],
      "core/audits/largest-contentful-paint-element.js | itemLoadDelay": [
        "audits[largest-contentful-paint-element].details.items[1].items[1].phase"
      ],
      "core/audits/largest-contentful-paint-element.js | itemLoadTime": [
        "audits[largest-contentful-paint-element].details.items[1].items[2].phase"
      ],
      "core/audits/largest-contentful-paint-element.js | itemRenderDelay": [
        "audits[largest-contentful-paint-element].details.items[1].items[3].phase"
      ],
      "core/audits/lcp-lazy-loaded.js | title": [
        "audits[lcp-lazy-loaded].title"
      ],
      "core/audits/lcp-lazy-loaded.js | description": [
        "audits[lcp-lazy-loaded].description"
      ],
      "core/audits/layout-shifts.js | title": [
        "audits[layout-shifts].title"
      ],
      "core/audits/layout-shifts.js | description": [
        "audits[layout-shifts].description"
      ],
      "core/audits/layout-shifts.js | displayValueShiftsFound": [
        {
          "values": {
            "shiftCount": 3
          },
          "path": "audits[layout-shifts].displayValue"
        }
      ],
      "core/audits/layout-shifts.js | columnScore": [
        "audits[layout-shifts].details.headings[1].label"
      ],
      "core/audits/long-tasks.js | title": [
        "audits[long-tasks].title"
      ],
      "core/audits/long-tasks.js | description": [
        "audits[long-tasks].description"
      ],
      "core/audits/long-tasks.js | displayValue": [
        {
          "values": {
            "itemCount": 2
          },
          "path": "audits[long-tasks].displayValue"
        }
      ],
      "core/audits/non-composited-animations.js | title": [
        "audits[non-composited-animations].title"
      ],
      "core/audits/non-composited-animations.js | description": [
        "audits[non-composited-animations].description"
      ],
      "core/audits/unsized-images.js | title": [
        "audits[unsized-images].title"
      ],
      "core/audits/unsized-images.js | description": [
        "audits[unsized-images].description"
      ],
      "core/audits/prioritize-lcp-image.js | title": [
        "audits[prioritize-lcp-image].title"
      ],
      "core/audits/prioritize-lcp-image.js | description": [
        "audits[prioritize-lcp-image].description"
      ],
      "core/audits/byte-efficiency/uses-long-cache-ttl.js | failureTitle": [
        "audits[uses-long-cache-ttl].title"
      ],
      "core/audits/byte-efficiency/uses-long-cache-ttl.js | description": [
        "audits[uses-long-cache-ttl].description"
      ],
      "core/audits/byte-efficiency/uses-long-cache-ttl.js | displayValue": [
        {
          "values": {
            "itemCount": 2
          },
          "path": "audits[uses-long-cache-ttl].displayValue"
        }
      ],
      "core/lib/i18n/i18n.js | columnCacheTTL": [
        "audits[uses-long-cache-ttl].details.headings[1].label",
        "audits[cache-insight].details.headings[1].label"
      ],
      "core/audits/byte-efficiency/total-byte-weight.js | title": [
        "audits[total-byte-weight].title"
      ],
      "core/audits/byte-efficiency/total-byte-weight.js | description": [
        "audits[total-byte-weight].description"
      ],
      "core/audits/byte-efficiency/total-byte-weight.js | displayValue": [
        {
          "values": {
            "totalBytes": 683128
          },
          "path": "audits[total-byte-weight].displayValue"
        }
      ],
      "core/audits/byte-efficiency/offscreen-images.js | title": [
        "audits[offscreen-images].title"
      ],
      "core/audits/byte-efficiency/offscreen-images.js | description": [
        "audits[offscreen-images].description"
      ],
      "core/audits/byte-efficiency/render-blocking-resources.js | title": [
        "audits[render-blocking-resources].title"
      ],
      "core/audits/byte-efficiency/render-blocking-resources.js | description": [
        "audits[render-blocking-resources].description"
      ],
      "core/audits/byte-efficiency/unminified-css.js | title": [
        "audits[unminified-css].title"
      ],
      "core/audits/byte-efficiency/unminified-css.js | description": [
        "audits[unminified-css].description"
      ],
      "core/audits/byte-efficiency/unminified-javascript.js | title": [
        "audits[unminified-javascript].title"
      ],
      "core/audits/byte-efficiency/unminified-javascript.js | description": [
        "audits[unminified-javascript].description"
      ],
      "core/lib/i18n/i18n.js | displayValueByteSavings": [
        {
          "values": {
            "wastedBytes": 40287
          },
          "path": "audits[unminified-javascript].displayValue"
        },
        {
          "values": {
            "wastedBytes": 241418
          },
          "path": "audits[unused-javascript].displayValue"
        },
        {
          "values": {
            "wastedBytes": 49859.6
          },
          "path": "audits[modern-image-formats].displayValue"
        },
        {
          "values": {
            "wastedBytes": 54081
          },
          "path": "audits[uses-responsive-images].displayValue"
        },
        {
          "values": {
            "wastedBytes": 55535
          },
          "path": "audits[image-delivery-insight].displayValue"
        }
      ],
      "core/audits/byte-efficiency/unused-css-rules.js | title": [
        "audits[unused-css-rules].title"
      ],
      "core/audits/byte-efficiency/unused-css-rules.js | description": [
        "audits[unused-css-rules].description"
      ],
      "core/audits/byte-efficiency/unused-javascript.js | title": [
        "audits[unused-javascript].title"
      ],
      "core/audits/byte-efficiency/unused-javascript.js | description": [
        "audits[unused-javascript].description"
      ],
      "core/audits/byte-efficiency/modern-image-formats.js | title": [
        "audits[modern-image-formats].title"
      ],
      "core/audits/byte-efficiency/modern-image-formats.js | description": [
        "audits[modern-image-formats].description"
      ],
      "core/lib/i18n/i18n.js | columnResourceSize": [
        "audits[modern-image-formats].details.headings[2].label",
        "audits[uses-responsive-images].details.headings[2].label",
        "audits[image-delivery-insight].details.headings[1].label"
      ],
      "core/audits/byte-efficiency/uses-optimized-images.js | title": [
        "audits[uses-optimized-images].title"
      ],
      "core/audits/byte-efficiency/uses-optimized-images.js | description": [
        "audits[uses-optimized-images].description"
      ],
      "core/audits/byte-efficiency/uses-text-compression.js | title": [
        "audits[uses-text-compression].title"
      ],
      "core/audits/byte-efficiency/uses-text-compression.js | description": [
        "audits[uses-text-compression].description"
      ],
      "core/audits/byte-efficiency/uses-responsive-images.js | title": [
        "audits[uses-responsive-images].title"
      ],
      "core/audits/byte-efficiency/uses-responsive-images.js | description": [
        "audits[uses-responsive-images].description"
      ],
      "core/audits/byte-efficiency/efficient-animated-content.js | title": [
        "audits[efficient-animated-content].title"
      ],
      "core/audits/byte-efficiency/efficient-animated-content.js | description": [
        "audits[efficient-animated-content].description"
      ],
      "core/audits/byte-efficiency/duplicated-javascript.js | title": [
        "audits[duplicated-javascript].title"
      ],
      "core/audits/byte-efficiency/duplicated-javascript.js | description": [
        "audits[duplicated-javascript].description"
      ],
      "core/audits/byte-efficiency/legacy-javascript.js | title": [
        "audits[legacy-javascript].title"
      ],
      "core/audits/byte-efficiency/legacy-javascript.js | description": [
        "audits[legacy-javascript].description"
      ],
      "core/audits/dobetterweb/dom-size.js | failureTitle": [
        "audits[dom-size].title"
      ],
      "core/audits/dobetterweb/dom-size.js | description": [
        "audits[dom-size].description"
      ],
      "core/audits/dobetterweb/dom-size.js | displayValue": [
        {
          "values": {
            "itemCount": 942
          },
          "path": "audits[dom-size].displayValue"
        }
      ],
      "core/audits/dobetterweb/dom-size.js | columnStatistic": [
        "audits[dom-size].details.headings[0].label"
      ],
      "core/audits/dobetterweb/dom-size.js | columnValue": [
        "audits[dom-size].details.headings[2].label"
      ],
      "core/audits/dobetterweb/dom-size.js | statisticDOMElements": [
        "audits[dom-size].details.items[0].statistic"
      ],
      "core/audits/dobetterweb/dom-size.js | statisticDOMDepth": [
        "audits[dom-size].details.items[1].statistic"
      ],
      "core/audits/dobetterweb/dom-size.js | statisticDOMWidth": [
        "audits[dom-size].details.items[2].statistic"
      ],
      "core/audits/dobetterweb/no-document-write.js | title": [
        "audits[no-document-write].title"
      ],
      "core/audits/dobetterweb/no-document-write.js | description": [
        "audits[no-document-write].description"
      ],
      "core/lib/i18n/i18n.js | columnSource": [
        "audits[no-document-write].details.headings[0].label",
        "audits[uses-passive-event-listeners].details.headings[0].label",
        "audits[forced-reflow-insight].details.items[0].headings[0].label"
      ],
      "core/audits/dobetterweb/uses-http2.js | title": [
        "audits[uses-http2].title"
      ],
      "core/audits/dobetterweb/uses-http2.js | description": [
        "audits[uses-http2].description"
      ],
      "core/audits/dobetterweb/uses-passive-event-listeners.js | title": [
        "audits[uses-passive-event-listeners].title"
      ],
      "core/audits/dobetterweb/uses-passive-event-listeners.js | description": [
        "audits[uses-passive-event-listeners].description"
      ],
      "core/audits/bf-cache.js | failureTitle": [
        "audits[bf-cache].title"
      ],
      "core/audits/bf-cache.js | description": [
        "audits[bf-cache].description"
      ],
      "core/audits/bf-cache.js | displayValue": [
        {
          "values": {
            "itemCount": 1
          },
          "path": "audits[bf-cache].displayValue"
        }
      ],
      "core/audits/bf-cache.js | failureReasonColumn": [
        "audits[bf-cache].details.headings[0].label"
      ],
      "core/audits/bf-cache.js | failureTypeColumn": [
        "audits[bf-cache].details.headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/panels/application/components/BackForwardCacheStrings.js | cacheControlNoStore": [
        "audits[bf-cache].details.items[0].reason"
      ],
      "core/audits/bf-cache.js | actionableFailureType": [
        "audits[bf-cache].details.items[0].failureType"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/Cache.js | title": [
        "audits[cache-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/Cache.js | description": [
        "audits[cache-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/Cache.js | requestColumn": [
        "audits[cache-insight].details.headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/CLSCulprits.js | title": [
        "audits[cls-culprits-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/CLSCulprits.js | description": [
        "audits[cls-culprits-insight].description"
      ],
      "core/audits/insights/cls-culprits-insight.js | columnScore": [
        "audits[cls-culprits-insight].details.items[0].headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DocumentLatency.js | title": [
        "audits[document-latency-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DocumentLatency.js | description": [
        "audits[document-latency-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DocumentLatency.js | passingRedirects": [
        "audits[document-latency-insight].details.items.noRedirects.label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DocumentLatency.js | passingServerResponseTime": [
        {
          "values": {
            "PH1": "179 ms"
          },
          "path": "audits[document-latency-insight].details.items.serverResponseIsFast.label"
        }
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DocumentLatency.js | passingTextCompression": [
        "audits[document-latency-insight].details.items.usesCompression.label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | title": [
        "audits[dom-size-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | description": [
        "audits[dom-size-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | statistic": [
        "audits[dom-size-insight].details.headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | value": [
        "audits[dom-size-insight].details.headings[2].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | totalElements": [
        "audits[dom-size-insight].details.items[0].statistic"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | maxChildren": [
        "audits[dom-size-insight].details.items[1].statistic"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DOMSize.js | maxDOMDepth": [
        "audits[dom-size-insight].details.items[2].statistic"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DuplicatedJavaScript.js | title": [
        "audits[duplicated-javascript-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DuplicatedJavaScript.js | description": [
        "audits[duplicated-javascript-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DuplicatedJavaScript.js | columnSource": [
        "audits[duplicated-javascript-insight].details.headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/DuplicatedJavaScript.js | columnDuplicatedBytes": [
        "audits[duplicated-javascript-insight].details.headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/FontDisplay.js | title": [
        "audits[font-display-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/FontDisplay.js | description": [
        "audits[font-display-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ForcedReflow.js | title": [
        "audits[forced-reflow-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ForcedReflow.js | description": [
        "audits[forced-reflow-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ForcedReflow.js | totalReflowTime": [
        "audits[forced-reflow-insight].details.items[0].headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ImageDelivery.js | title": [
        "audits[image-delivery-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ImageDelivery.js | description": [
        "audits[image-delivery-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ImageDelivery.js | useModernFormat": [
        "audits[image-delivery-insight].details.items[0].subItems.items[0].reason"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ImageDelivery.js | useResponsiveSize": [
        {
          "values": {
            "PH1": "180x183",
            "PH2": "33x32"
          },
          "path": "audits[image-delivery-insight].details.items[0].subItems.items[1].reason"
        }
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/INPBreakdown.js | title": [
        "audits[inp-breakdown-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/INPBreakdown.js | description": [
        "audits[inp-breakdown-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPBreakdown.js | title": [
        "audits[lcp-breakdown-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPBreakdown.js | description": [
        "audits[lcp-breakdown-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPBreakdown.js | subpart": [
        "audits[lcp-breakdown-insight].details.items[0].headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPBreakdown.js | timeToFirstByte": [
        "audits[lcp-breakdown-insight].details.items[0].items[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPBreakdown.js | elementRenderDelay": [
        "audits[lcp-breakdown-insight].details.items[0].items[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPDiscovery.js | title": [
        "audits[lcp-discovery-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LCPDiscovery.js | description": [
        "audits[lcp-discovery-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LegacyJavaScript.js | title": [
        "audits[legacy-javascript-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LegacyJavaScript.js | description": [
        "audits[legacy-javascript-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/LegacyJavaScript.js | columnWastedBytes": [
        "audits[legacy-javascript-insight].details.headings[2].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ModernHTTP.js | title": [
        "audits[modern-http-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ModernHTTP.js | description": [
        "audits[modern-http-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ModernHTTP.js | protocol": [
        "audits[modern-http-insight].details.headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | title": [
        "audits[network-dependency-tree-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | description": [
        "audits[network-dependency-tree-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | preconnectOriginsTableTitle": [
        "audits[network-dependency-tree-insight].details.items[1].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | preconnectOriginsTableDescription": [
        "audits[network-dependency-tree-insight].details.items[1].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | noPreconnectOrigins": [
        "audits[network-dependency-tree-insight].details.items[1].value.value"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | estSavingTableTitle": [
        "audits[network-dependency-tree-insight].details.items[2].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | estSavingTableDescription": [
        "audits[network-dependency-tree-insight].details.items[2].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | columnOrigin": [
        "audits[network-dependency-tree-insight].details.items[2].value.headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js | columnWastedMs": [
        "audits[network-dependency-tree-insight].details.items[2].value.headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/RenderBlocking.js | title": [
        "audits[render-blocking-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/RenderBlocking.js | description": [
        "audits[render-blocking-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ThirdParties.js | title": [
        "audits[third-parties-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ThirdParties.js | description": [
        "audits[third-parties-insight].description"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ThirdParties.js | columnThirdParty": [
        "audits[third-parties-insight].details.headings[0].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ThirdParties.js | columnTransferSize": [
        "audits[third-parties-insight].details.headings[1].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/ThirdParties.js | columnMainThreadTime": [
        "audits[third-parties-insight].details.headings[2].label"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/Viewport.js | title": [
        "audits[viewport-insight].title"
      ],
      "node_modules/@paulirish/trace_engine/models/trace/insights/Viewport.js | description": [
        "audits[viewport-insight].description"
      ],
      "core/config/default-config.js | performanceCategoryTitle": [
        "categories.performance.title"
      ],
      "core/config/default-config.js | metricGroupTitle": [
        "categoryGroups.metrics.title"
      ],
      "core/config/default-config.js | insightsGroupTitle": [
        "categoryGroups.insights.title"
      ],
      "core/config/default-config.js | insightsGroupDescription": [
        "categoryGroups.insights.description"
      ],
      "core/config/default-config.js | diagnosticsGroupTitle": [
        "categoryGroups.diagnostics.title"
      ],
      "core/config/default-config.js | diagnosticsGroupDescription": [
        "categoryGroups.diagnostics.description"
      ],
      "core/config/default-config.js | a11yBestPracticesGroupTitle": [
        "categoryGroups[a11y-best-practices].title"
      ],
      "core/config/default-config.js | a11yBestPracticesGroupDescription": [
        "categoryGroups[a11y-best-practices].description"
      ],
      "core/config/default-config.js | a11yColorContrastGroupTitle": [
        "categoryGroups[a11y-color-contrast].title"
      ],
      "core/config/default-config.js | a11yColorContrastGroupDescription": [
        "categoryGroups[a11y-color-contrast].description"
      ],
      "core/config/default-config.js | a11yNamesLabelsGroupTitle": [
        "categoryGroups[a11y-names-labels].title"
      ],
      "core/config/default-config.js | a11yNamesLabelsGroupDescription": [
        "categoryGroups[a11y-names-labels].description"
      ],
      "core/config/default-config.js | a11yNavigationGroupTitle": [
        "categoryGroups[a11y-navigation].title"
      ],
      "core/config/default-config.js | a11yNavigationGroupDescription": [
        "categoryGroups[a11y-navigation].description"
      ],
      "core/config/default-config.js | a11yAriaGroupTitle": [
        "categoryGroups[a11y-aria].title"
      ],
      "core/config/default-config.js | a11yAriaGroupDescription": [
        "categoryGroups[a11y-aria].description"
      ],
      "core/config/default-config.js | a11yLanguageGroupTitle": [
        "categoryGroups[a11y-language].title"
      ],
      "core/config/default-config.js | a11yLanguageGroupDescription": [
        "categoryGroups[a11y-language].description"
      ],
      "core/config/default-config.js | a11yAudioVideoGroupTitle": [
        "categoryGroups[a11y-audio-video].title"
      ],
      "core/config/default-config.js | a11yAudioVideoGroupDescription": [
        "categoryGroups[a11y-audio-video].description"
      ],
      "core/config/default-config.js | a11yTablesListsVideoGroupTitle": [
        "categoryGroups[a11y-tables-lists].title"
      ],
      "core/config/default-config.js | a11yTablesListsVideoGroupDescription": [
        "categoryGroups[a11y-tables-lists].description"
      ],
      "core/config/default-config.js | seoMobileGroupTitle": [
        "categoryGroups[seo-mobile].title"
      ],
      "core/config/default-config.js | seoMobileGroupDescription": [
        "categoryGroups[seo-mobile].description"
      ],
      "core/config/default-config.js | seoContentGroupTitle": [
        "categoryGroups[seo-content].title"
      ],
      "core/config/default-config.js | seoContentGroupDescription": [
        "categoryGroups[seo-content].description"
      ],
      "core/config/default-config.js | seoCrawlingGroupTitle": [
        "categoryGroups[seo-crawl].title"
      ],
      "core/config/default-config.js | seoCrawlingGroupDescription": [
        "categoryGroups[seo-crawl].description"
      ],
      "core/config/default-config.js | bestPracticesTrustSafetyGroupTitle": [
        "categoryGroups[best-practices-trust-safety].title"
      ],
      "core/config/default-config.js | bestPracticesUXGroupTitle": [
        "categoryGroups[best-practices-ux].title"
      ],
      "core/config/default-config.js | bestPracticesBrowserCompatGroupTitle": [
        "categoryGroups[best-practices-browser-compat].title"
      ],
      "core/config/default-config.js | bestPracticesGeneralGroupTitle": [
        "categoryGroups[best-practices-general].title"
      ]
    }
  }
}