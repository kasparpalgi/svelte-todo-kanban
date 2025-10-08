# GitHub Integration Improvement Plan

**Date**: 2025-10-05
**Status**: Post-Phase 4 Analysis & Enhancement Roadmap

---

## Executive Summary

All 4 phases of GitHub integration are now complete:
- ✅ Phase 1: Import GitHub issues → Todos
- ✅ Phase 2: Create GitHub issues from todos
- ✅ Phase 3: Bidirectional updates & comment tracking
- ✅ Phase 4: Real-time webhooks

**Current State**: Functional MVP with basic sync capabilities
**Goal**: Production-ready, robust, well-tested GitHub integration

---

## Current Implementation Analysis

### ✅ What Works Well

**Core Functionality**
- GitHub OAuth authentication with encrypted token storage
- Repository selection and board-to-repo assignment
- Issue import with priority mapping
- Issue creation with automatic metadata sync
- Bidirectional sync (todo ↔ issue)
- Real-time webhook support
- HMAC signature verification

**Architecture**
- Non-blocking design (failures don't crash operations)
- Type-safe GraphQL queries with generated types
- Server-side API routes with proper error handling
- Modular component structure

### ❌ What's Missing

**Critical Gaps**
1. **No Unit Tests for GitHub Integration** - Zero coverage of core logic
2. **E2E Tests Not Implemented** - All tests marked as `skip`
3. **No Error Recovery** - Failed syncs are lost forever
4. **No Conflict Resolution** - Simultaneous edits cause data inconsistency
5. **Comment Sync Incomplete** - Schema ready but logic not implemented
6. **No User Mapping** - Can't create comments from webhooks
7. **No Rate Limiting** - Vulnerable to API rate limit exhaustion
8. **No Sync Status Indicators** - Users don't know if sync failed
9. **No Webhook Delivery Logs** - Can't debug webhook issues
10. **No Batch Operations** - Can't bulk sync/update

**Quality Issues**
- Missing input validation in many endpoints
- Inconsistent error messages
- No retry logic for transient failures
- No telemetry/monitoring hooks
- No performance optimization (N+1 queries possible)

---

## Improvement Priorities

### Priority 1: Testing Infrastructure (CRITICAL)

**Goal**: Achieve >80% test coverage for GitHub integration

#### 1.1 Unit Tests

**Test Files to Create:**

`src/lib/server/__tests__/github.test.ts`
- ✅ Test `getGithubToken()` with valid/invalid user IDs
- ✅ Test `githubRequest()` with success/failure responses
- ✅ Test token decryption with various encrypted formats
- ✅ Test error handling for malformed tokens

`src/routes/api/github/import-issues/__tests__/+server.test.ts`
- ✅ Test issue-to-todo conversion logic
- ✅ Test priority label mapping (high/medium/low)
- ✅ Test closed issue → completed_at mapping
- ✅ Test milestone due_on mapping
- ✅ Test PR exclusion (pull_request field)
- ✅ Test pagination handling
- ✅ Test duplicate prevention

`src/routes/api/github/create-issue/__tests__/+server.test.ts`
- ✅ Test GitHub API request payload construction
- ✅ Test priority → label mapping
- ✅ Test todo metadata update after creation
- ✅ Test error handling (401, 403, 404)

`src/routes/api/github/update-issue/__tests__/+server.test.ts`
- ✅ Test selective field updates (title, body, state)
- ✅ Test completion status → issue state mapping
- ✅ Test github_synced_at timestamp update

`src/routes/api/github/webhook/__tests__/+server.test.ts`
- ✅ Test HMAC signature verification (valid/invalid)
- ✅ Test constant-time comparison
- ✅ Test issue event handlers (edited, closed, reopened, deleted)
- ✅ Test comment event handlers
- ✅ Test unsynced issue handling
- ✅ Test malformed payload handling

`src/routes/api/github/register-webhook/__tests__/+server.test.ts`
- ✅ Test webhook registration with existing webhook
- ✅ Test webhook creation with valid credentials
- ✅ Test permission validation (403 errors)
- ✅ Test environment variable validation

**Test Utilities to Create:**

`src/lib/test-utils/github-mocks.ts`
```typescript
// Mock GitHub API responses
export const mockGithubIssue = (overrides = {}) => ({...})
export const mockGithubComment = (overrides = {}) => ({...})
export const mockWebhookSignature = (payload, secret) => {...}
export const mockGithubToken = () => {...}
```

#### 1.2 E2E Tests Implementation

**Current State**: 4 E2E test files, all tests skipped
**Goal**: Un-skip and implement all E2E tests

**Setup Requirements:**
1. Create test GitHub repository (or use mocked GitHub API)
2. Implement test authentication helper
3. Create seed data for test boards/todos
4. Set up GitHub OAuth app for testing

**Test Files to Implement:**

`e2e/github-import.spec.ts` (Currently 3 tests, all skipped)
- [ ] Implement "should import issues into selected list"
- [ ] Implement "should not duplicate existing synced todos"
- [ ] Implement "should show error if GitHub token missing"
- [ ] Add: "should import closed issues as completed todos"
- [ ] Add: "should import with correct priority labels"
- [ ] Add: "should handle import errors gracefully"

`e2e/github-create-issue.spec.ts` (Currently 8 tests, all skipped)
- [ ] Implement all 8 existing tests
- [ ] Add: "should show GitHub issue number after creation"
- [ ] Add: "should link to GitHub issue from todo card"

`e2e/github-update-issue.spec.ts` (Currently 17 tests, all skipped)
- [ ] Implement all 17 existing tests
- [ ] Add: "should show sync status indicator"
- [ ] Add: "should retry failed syncs"

`e2e/github-webhooks.spec.ts` (Currently 18 tests, all skipped)
- [ ] Implement all 18 existing tests
- [ ] Add: "should show webhook delivery logs"
- [ ] Add: "should handle rapid webhook events"

**New E2E Tests:**

`e2e/github-conflict-resolution.spec.ts` (NEW)
- [ ] Test simultaneous todo/issue edits
- [ ] Test last-write-wins behavior
- [ ] Test conflict notification UI

`e2e/github-sync-recovery.spec.ts` (NEW)
- [ ] Test manual re-sync after failure
- [ ] Test automatic retry on transient errors
- [ ] Test sync queue persistence

---

### Priority 2: Robustness & Error Handling (HIGH)

#### 2.1 Sync Queue & Retry Logic

**Problem**: Failed syncs are logged and forgotten
**Solution**: Persistent sync queue with exponential backoff

**Implementation:**

`hasura/migrations/.../create_github_sync_queue/up.sql`
```sql
CREATE TABLE public.github_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'create_issue', 'update_issue', 'sync_comment'
  entity_type TEXT NOT NULL, -- 'todo', 'comment'
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_retry ON github_sync_queue(next_retry_at)
  WHERE next_retry_at IS NOT NULL AND attempts < max_attempts;
```

**API Endpoint**: `src/routes/api/github/process-queue/+server.ts`
- Background job to process queued syncs
- Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
- Mark as failed after max_attempts
- Return detailed error info

**Store Integration**: Update todos.svelte.ts
```typescript
async function queueGithubSync(operation, entityType, entityId, payload) {
  await serverRequest(CREATE_SYNC_QUEUE_ITEM, {
    operation,
    entity_type: entityType,
    entity_id: entityId,
    payload
  });
}

// Call on sync failure
catch (err) {
  await queueGithubSync('update_issue', 'todo', todoId, updates);
  console.error('Sync failed, queued for retry:', err);
}
```

#### 2.2 Conflict Resolution

**Problem**: Simultaneous edits from both sides cause inconsistency
**Solution**: Last-write-wins with conflict detection

**Database Schema:**
```sql
ALTER TABLE public.todos
  ADD COLUMN github_version INT DEFAULT 0,
  ADD COLUMN last_synced_version INT DEFAULT 0;
```

**Conflict Detection Logic:**
```typescript
// In webhook handler
if (todo.github_version > event.issue.version) {
  // Local is newer, reject webhook update
  console.warn('Conflict: local version newer than webhook');
  // Optionally: push local to GitHub
  return;
}

// In update-issue endpoint
// Include If-Match header with ETag
const response = await githubRequest(..., {
  headers: {
    'If-Match': `W/"${currentEtag}"`
  }
});

if (response.status === 412) {
  // Conflict detected
  throw new Error('Issue was modified on GitHub');
}
```

**UI Component**: `ConflictResolutionDialog.svelte`
- Show diff between local and remote
- Let user choose which version to keep
- Or merge manually

#### 2.3 Rate Limiting Protection

**Problem**: No protection against GitHub API rate limits (5000/hour)
**Solution**: Token bucket algorithm with rate limit tracking

**Implementation**: `src/lib/server/rate-limiter.ts`
```typescript
import { redis } from '$lib/server/redis'; // or in-memory Map

export class GithubRateLimiter {
  private readonly limit = 4500; // Reserve 500 for safety
  private readonly window = 3600000; // 1 hour in ms

  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `github:ratelimit:${userId}`;
    const current = await redis.get(key) || 0;

    if (current >= this.limit) {
      return false; // Rate limited
    }

    await redis.incr(key);
    await redis.expire(key, this.window);
    return true;
  }

  async getRemainingRequests(userId: string): Promise<number> {
    const key = `github:ratelimit:${userId}`;
    const current = await redis.get(key) || 0;
    return this.limit - current;
  }
}
```

**Middleware**: Apply to all GitHub API routes
```typescript
const rateLimiter = new GithubRateLimiter();

if (!await rateLimiter.checkRateLimit(userId)) {
  throw error(429, 'GitHub API rate limit exceeded. Try again later.');
}
```

**UI**: Show remaining requests in settings
```svelte
<div class="text-sm text-muted-foreground">
  GitHub API: {remainingRequests}/{totalRequests} requests remaining
</div>
```

---

### Priority 3: Feature Completeness (MEDIUM)

#### 3.1 Comment Sync Implementation

**Current State**: Database schema ready, logic not implemented
**Goal**: Full bidirectional comment sync

**Missing Pieces:**
1. **User Mapping**: GitHub username → app user_id
2. **Comment Creation from Webhooks**
3. **Comment Updates to GitHub**
4. **Comment Deletion Sync**

**Implementation:**

`hasura/migrations/.../create_github_user_mapping/up.sql`
```sql
CREATE TABLE public.github_user_mapping (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL UNIQUE,
  github_user_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_github_username ON github_user_mapping(github_username);
```

**API Endpoint**: `src/routes/api/github/sync-comment/+server.ts`
```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
  const { todoId, content } = await request.json();

  // Get todo's GitHub issue number
  const todo = await getTodoById(todoId);

  // Create comment on GitHub
  const comment = await githubRequest(
    `/repos/${owner}/${repo}/issues/${todo.github_issue_number}/comments`,
    token,
    { method: 'POST', body: JSON.stringify({ body: content }) }
  );

  // Update local comment with github_comment_id
  await serverRequest(UPDATE_COMMENT, {
    where: { id: { _eq: commentId } },
    _set: {
      github_comment_id: comment.id,
      github_synced_at: new Date().toISOString()
    }
  });
};
```

**Webhook Handler Enhancement:**
```typescript
case 'created':
  // Map GitHub user to app user
  const appUser = await getUserByGithubUsername(comment.user.login);

  if (appUser) {
    await serverRequest(CREATE_COMMENT, {
      objects: [{
        todo_id: todo.id,
        user_id: appUser.id,
        content: comment.body,
        github_comment_id: comment.id,
        github_synced_at: new Date().toISOString()
      }]
    });
  } else {
    // Create as system comment
    console.warn(`GitHub user ${comment.user.login} not mapped`);
  }
  break;
```

#### 3.2 Batch Operations

**Use Cases:**
- Bulk import all issues from repo
- Bulk sync selected todos to GitHub
- Bulk close todos when issues are closed

**API Endpoint**: `src/routes/api/github/batch-sync/+server.ts`
```typescript
export const POST: RequestHandler = async ({ request, locals }) => {
  const { operation, todoIds } = await request.json();

  const results = await Promise.allSettled(
    todoIds.map(id => syncTodoToGithub(id, operation))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  return json({
    total: todoIds.length,
    succeeded: succeeded.length,
    failed: failed.length,
    errors: failed.map(r => r.reason)
  });
};
```

**UI Component**: `BatchSyncDialog.svelte`
- Select multiple todos
- Choose operation (sync, create issue, update)
- Show progress bar
- Display results summary

#### 3.3 Sync Status Indicators

**Visual Feedback:**
- ✅ Synced (green checkmark)
- 🔄 Syncing (spinner)
- ⚠️ Sync failed (warning icon)
- ⏰ Queued for retry (clock icon)

**Implementation**: Update `TodoCard.svelte`
```svelte
{#if todo.github_issue_number}
  <div class="flex items-center gap-1">
    <GithubIcon class="h-3 w-3" />
    <span>#{todo.github_issue_number}</span>

    {#if syncStatus === 'synced'}
      <CheckCircle class="h-3 w-3 text-green-600" />
    {:else if syncStatus === 'syncing'}
      <Loader2 class="h-3 w-3 animate-spin" />
    {:else if syncStatus === 'failed'}
      <AlertTriangle class="h-3 w-3 text-yellow-600"
        title="Sync failed. Click to retry." />
    {/if}
  </div>
{/if}
```

#### 3.4 Webhook Delivery Logs

**Database Schema:**
```sql
CREATE TABLE public.github_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  action TEXT,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processing_status TEXT NOT NULL, -- 'success', 'failed', 'skipped'
  processing_error TEXT,
  processing_duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_delivery_id ON github_webhook_deliveries(delivery_id);
CREATE INDEX idx_webhook_created_at ON github_webhook_deliveries(created_at DESC);
```

**Webhook Endpoint Update:**
```typescript
const startTime = Date.now();
let status = 'success';
let error = null;

try {
  // Process webhook...
} catch (err) {
  status = 'failed';
  error = err.message;
  throw err;
} finally {
  // Log delivery
  await serverRequest(CREATE_WEBHOOK_DELIVERY, {
    delivery_id: deliveryId,
    event_type: eventType,
    payload: event,
    signature_valid: true,
    processing_status: status,
    processing_error: error,
    processing_duration_ms: Date.now() - startTime
  });
}
```

**UI**: `WebhookDeliveryLogs.svelte`
- Table of recent webhook deliveries
- Filter by status (success/failed)
- View payload and error details
- Retry failed webhooks

---

### Priority 4: Developer Experience (LOW)

#### 4.1 Better Error Messages

**Current**: Generic "Failed to sync"
**Improved**: Specific, actionable errors

```typescript
// Before
throw error(500, 'Failed to create issue');

// After
throw error(500, {
  message: 'Failed to create GitHub issue',
  code: 'GITHUB_CREATE_FAILED',
  details: {
    reason: 'Rate limit exceeded',
    retryAfter: 3600,
    suggestedAction: 'Try again in 1 hour'
  }
});
```

#### 4.2 Debugging Tools

**Dev-only Endpoint**: `src/routes/api/github/debug/+server.ts`
```typescript
// Only available in development
if (import.meta.env.DEV) {
  export const GET: RequestHandler = async ({ url }) => {
    const action = url.searchParams.get('action');

    switch (action) {
      case 'test-webhook':
        // Simulate webhook delivery
        break;
      case 'check-rate-limit':
        // Show current rate limit status
        break;
      case 'inspect-queue':
        // Show sync queue contents
        break;
    }
  };
}
```

#### 4.3 Performance Monitoring

**Metrics to Track:**
- Sync duration (p50, p95, p99)
- Webhook processing time
- API error rates
- Queue depth
- Rate limit usage

**Integration with Logging:**
```typescript
loggingStore.measure('githubSync', async () => {
  await syncTodoToGithub(todo);
});

// Query logs later for analysis
```

---

## Implementation Roadmap

### Week 1: Testing Foundation
- [ ] Day 1-2: Set up unit test infrastructure
- [ ] Day 3-4: Write unit tests for all endpoints
- [ ] Day 5: Set up E2E test environment

### Week 2: E2E Test Implementation
- [ ] Day 1-2: Implement import/create-issue E2E tests
- [ ] Day 3-4: Implement update/webhook E2E tests
- [ ] Day 5: Test coverage report & gaps analysis

### Week 3: Robustness
- [ ] Day 1-2: Implement sync queue
- [ ] Day 3-4: Add conflict resolution
- [ ] Day 5: Implement rate limiting

### Week 4: Feature Completion
- [ ] Day 1-2: Complete comment sync
- [ ] Day 3-4: Add batch operations
- [ ] Day 5: Sync status indicators & webhook logs

### Week 5: Polish
- [ ] Day 1-2: Improve error messages
- [ ] Day 3-4: Add debugging tools
- [ ] Day 5: Performance optimization

---

## Success Metrics

**Testing**
- ✅ >80% unit test coverage for GitHub integration
- ✅ 100% of E2E tests passing (not skipped)
- ✅ Zero critical bugs in production

**Reliability**
- ✅ <1% sync failure rate
- ✅ 100% of failed syncs retry successfully
- ✅ Zero data loss from conflicts

**Performance**
- ✅ <2s average sync time
- ✅ <500ms webhook processing time
- ✅ Zero rate limit errors

**User Experience**
- ✅ Clear sync status on all todos
- ✅ Actionable error messages
- ✅ <5s time-to-resolution for conflicts

---

## Future Enhancements (Post-MVP)

1. **Advanced Features**
   - Label sync (GitHub ↔ Board labels)
   - Assignee mapping (GitHub ↔ Board members)
   - Milestone integration
   - Pull request tracking
   - Branch linking
   - CI/CD status display

2. **Enterprise Features**
   - Organization-level GitHub integration
   - SAML/SSO integration
   - Audit logs for compliance
   - Custom webhook rules
   - Sync scheduling (e.g., sync every 15 minutes)

3. **AI/ML Features**
   - Auto-categorization of imported issues
   - Duplicate detection
   - Smart conflict resolution
   - Suggested todo → issue mappings

---

**Next Steps**: Implement Priority 1 (Testing Infrastructure) starting with unit tests for core GitHub server functions.
