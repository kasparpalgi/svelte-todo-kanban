# Performance Optimizations - Implementation Summary

## Overview

This document tracks the performance optimizations implemented based on task 028 speed analysis. The goal is to reduce Largest Contentful Paint (LCP) from 6.82s (sometimes 2-3s) to consistently <1.5s.

## Analysis Summary

The root cause of slow performance was identified as:
- **Massive GraphQL payloads** loading unnecessary data upfront
- **No local caching** requiring full refetch on every board switch
- **Comments and uploads loaded for all todos** even when cards never opened
- **Full nested objects duplicated** across todos

## Phase 1: Split TODO Fragment ✅ COMPLETED

**Status**: Implemented, pending type generation
**Expected Impact**: 60-80% payload reduction
**Commit**: `d78af62` - perf: Implement split GraphQL fragments

### What Was Done

1. **Created TODO_MINIMAL_FRAGMENT**
   - Only essential fields for card display
   - Aggregates for counts (comments_aggregate, uploads_aggregate, labels_aggregate)
   - Minimal assignee info (no email field)
   - Minimal label info (id, name, color only)
   - Minimal list/board info

2. **Created TODO_FULL_FRAGMENT**
   - All fields including content, timestamps
   - Full comments array
   - Full uploads array
   - Full labels with all fields
   - Full nested board objects

3. **Added New Queries**
   - `GET_TODOS_MINIMAL`: For board/list views
   - `GET_TODO_FULL`: For card detail modal (uses todos_by_pk for single fetch)

4. **Updated Stores**
   - `loadTodosInitial()`: Uses GET_TODOS_MINIMAL (first 50 todos)
   - `loadTodosRemaining()`: Uses GET_TODOS_MINIMAL (background loading)
   - `loadTodoDetails()`: Uses GET_TODO_FULL (on-demand when opening card)

5. **Updated CardModal**
   - Calls `loadTodoDetails()` on open to fetch full data
   - Seamless transition from minimal to full data

### Data Comparison

**Before (TODO_FRAGMENT)**:
```graphql
50 todos × (
  base fields +
  5-20 comments each +
  2-10 uploads each +
  full assignee +
  full labels +
  full list/board
) = ~500KB-2MB
```

**After (TODO_MINIMAL_FRAGMENT)**:
```graphql
50 todos × (
  base fields +
  3 count aggregates +
  minimal assignee (4 fields) +
  minimal labels (3 fields) +
  minimal list/board
) = ~100-300KB
```

**Reduction**: 60-80%

### Before/After Flow

#### Before
1. User opens board → Load 50 todos with FULL data (2-3s)
2. Background → Load 100+ more todos with FULL data
3. User opens card → Already has data (but wasted bandwidth)

#### After
1. User opens board → Load 50 todos with MINIMAL data (<1s) ✨
2. Background → Load 100+ more todos with MINIMAL data
3. User opens card → Fetch FULL data for that card only (<100ms) ✨

## Phase 2: IndexedDB Caching (Next)

**Status**: Planned
**Expected Impact**: 90%+ faster re-opens (instant vs 2s)
**Effort**: 4-6 hours

### Plan

1. Install Dexie.js: `npm install dexie`
2. Create `src/lib/db/cache.ts`
3. Define schema:
   ```typescript
   class CacheDB extends Dexie {
     boards: Table<CachedBoard, string>;
     todos: Table<CachedTodos, string>;
   }
   ```
4. Cache structure:
   - TTL: 24 hours
   - LRU eviction: Keep last 50 boards
   - Store: board_id, todos[], lastAccessed, ttl
5. Flow:
   - Check IndexedDB first
   - Render cached data instantly (<50ms)
   - Fetch fresh data in background
   - Update if changed

### Expected Result
- Re-opening boards: 2s → <50ms (instant)
- Offline support: View cached boards without network
- Better UX: Instant feedback while loading fresh data

## Phase 3: Optimize Board Loading (Next)

**Status**: Planned
**Expected Impact**: 30-50% reduction for users with many boards
**Effort**: 1 hour

### Plan

1. Track recent boards in localStorage
2. Load only:
   - Selected board
   - Last 5 accessed boards
3. Lazy load all boards when selector opened

### Current Issue
Loads ALL boards user has access to (could be 50+)
Each board includes labels and members

## Phase 4: Additional Optimizations

### Virtual Scrolling
- For boards with 50+ cards per column
- Use `@tanstack/virtual`
- Impact: 20-30% faster rendering

### Code Splitting
- Lazy load CardModal
- Lazy load heavy components
- Impact: 10-15% faster initial load

### Image Lazy Loading
- Lazy load upload images
- Use intersection observer
- Impact: 10-20% faster with many images

## Testing & Verification

### After Type Generation

1. **Start Hasura**:
   ```bash
   cd hasura
   docker-compose up -d
   ```

2. **Generate Types**:
   ```bash
   npm run generate
   ```

3. **Type Check**:
   ```bash
   npm run check
   ```
   Should pass with no errors

4. **Run Tests**:
   ```bash
   npm test
   ```

### Performance Testing

1. **Chrome DevTools**:
   - Network tab: Check payload sizes
   - Performance tab: Measure LCP
   - Lighthouse: Run audit

2. **Test Scenarios**:
   - Small board (10 todos)
   - Medium board (50 todos)
   - Large board (200+ todos)

3. **Network Throttling**:
   - Fast 3G
   - Slow 3G
   - Offline (after caching implemented)

### Expected Metrics

| Metric | Before | After Phase 1 | After Phase 2 |
|--------|--------|---------------|---------------|
| Initial Payload | 500KB-2MB | 100-300KB | 100-300KB |
| Initial Load | 2-3s | <1.5s | <1.5s |
| Re-open Board | 2s | 1.5s | <50ms |
| LCP | 2-6.82s | <2s | <1s |
| Time to Interactive | 3-4s | <2s | <1s |

## Known Issues & Limitations

### Type Generation Required

The new fragments and queries need type generation:
```bash
npm run generate
```

This requires:
- Hasura running locally
- `.env` file with API_ENDPOINT_DEV and HASURA_ADMIN_SECRET

### Temporary Type Casts

Code uses `as any` casts for type compatibility until types are regenerated:
```typescript
state.todos = data.todos as any || [];
```

These will be resolved after running `npm run generate`.

### Backward Compatibility

The original `TODO_FRAGMENT` is kept for backward compatibility but marked as deprecated. Future code should use:
- `TODO_MINIMAL_FRAGMENT` for lists/boards
- `TODO_FULL_FRAGMENT` for detail views

## Migration Guide

### For New Queries

Use minimal fragment for list views:
```typescript
const data = await request(GET_TODOS_MINIMAL, {
  where: { list_id: { _eq: listId } }
});
```

Use full fragment for detail views:
```typescript
const todo = await request(GET_TODO_FULL, {
  id: todoId
});
```

### For Existing Code

No changes needed - backward compatible through TODO_FRAGMENT

### For New Features

Always use minimal fragment first, load full data on-demand

## Performance Monitoring

### Production Logging

Monitor in `/[lang]/logs`:
- Load times
- Payload sizes
- Error rates
- Cache hit rates (after Phase 2)

### Analytics

Track with Vercel Analytics:
- LCP
- FCP (First Contentful Paint)
- TTI (Time to Interactive)
- CLS (Cumulative Layout Shift)

## Related Files

- `src/lib/graphql/documents.ts` - Fragment and query definitions
- `src/lib/stores/todos.svelte.ts` - Store implementation
- `src/routes/[lang]/[username]/[board]/CardModal.svelte` - Modal component
- `.claude/todo/028-speedAnalysis.md` - Original analysis
- `CLAUDE.md` - Architecture documentation

## References

- [Task 028 Speed Analysis](.claude/todo/028-speedAnalysis.md)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Dexie.js Documentation](https://dexie.org/)
- [Chrome Performance Tools](https://developer.chrome.com/docs/devtools/performance/)

---

**Last Updated**: 2025-11-15
**Next Review**: After Phase 2 implementation
