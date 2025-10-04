# Task 012: Implement Production-Ready Logging System

## Original Requirement

Plan and implement a good app logging into logs table in database or what is the best practices. Log important things that lead to catching bugs. Think that logs shall be read also by AI so do not log too much so too much tokens wasted to read logs and logs shall be possible to see only errors for example and then certain section maybe full logs. Also think of performance so logging won't do harm to overall app performance.

Write e2e and unit tests to verify your work and then commit to a separate branch.

---

## PHASED IMPLEMENTATION PLAN

### 🎯 MVP (Phase 1) - Core Database Logging [APPROVED]
**Goal**: Get logs persisting to database with minimal code changes
**Time**: 1-2 hours
**Testable**: Yes - can query logs from DB

**Deliverables:**
1. ✅ Database migration for logs table
2. ✅ Hasura permissions and metadata
3. ✅ GraphQL mutation for log insertion
4. ✅ Enhanced logging service with DB persistence
5. ✅ Basic error logging integration
6. ✅ Unit tests for logging service
7. ✅ Basic E2E test for log creation
8. ✅ Commit to `feature/enhanced-logging` branch

**What's Included:**
- Logs saved to PostgreSQL via GraphQL
- In-memory buffer with batched DB writes
- Error and warn levels logged automatically
- Privacy-safe (no sensitive data)
- Performant (async, debounced)

**What's Deferred:**
- Log viewer UI (Phase 2)
- Advanced filtering UI (Phase 2)
- Export functionality (Phase 2)
- Automatic cleanup cron (Phase 3)
- Error boundary component (Phase 3)

---

### 📊 Phase 2 - Log Viewer & Management [NOT STARTED]
**Goal**: Admin interface to view and filter logs
**Time**: 2-3 hours

**Deliverables:**
1. Admin logs page (`/[lang]/admin/logs`)
2. LogViewer component with filtering
3. Export logs functionality
4. Search by component, level, user, date
5. E2E tests for viewer

---

### 🔧 Phase 3 - Advanced Features [NOT STARTED]
**Goal**: Production-ready features
**Time**: 1-2 hours

**Deliverables:**
1. Error boundary component
2. Automatic log cleanup (30-day retention)
3. Performance monitoring
4. Log sampling for high-volume events
5. Production environment configuration

---

## ARCHITECTURE (Approved)

### Log Levels (Priority Order)
1. **ERROR** - Application errors, failed operations (always log)
2. **WARN** - Recoverable issues, deprecation warnings
3. **INFO** - Important state changes, user actions
4. **DEBUG** - Detailed debugging information (dev only, not persisted)

### What to Log

**✅ ALWAYS LOG (ERROR/WARN):**
- GraphQL/API errors
- Store operation failures
- Permission denied errors
- Authentication failures
- Uncaught exceptions

**✅ CONDITIONALLY LOG (INFO) - MVP keeps this minimal:**
- Critical user actions (login, signup)
- Board/List/Todo creation (optional in MVP)

**❌ NEVER LOG:**
- Passwords, tokens, API keys
- Full user objects (only IDs)
- Large data payloads (>1KB)
- High-frequency events

### Performance Strategy (Approved)

1. **In-Memory Buffer**: Max 1000 entries client-side
2. **Batched Writes**: Send to DB every 10s OR when 50 logs accumulated
3. **Debounced**: Avoid overwhelming DB with writes
4. **Async**: Non-blocking DB inserts
5. **Indexed**: Fast queries on timestamp, level, user_id

### Database Schema (Approved)

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_user_id ON logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_logs_component ON logs(component);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
```

### Privacy & Security (Approved)

```typescript
// ✅ GOOD - Structured, safe logging
loggingStore.error('AuthService', 'Login failed', {
  email: 'user@example.com', // OK - not sensitive
  reason: 'Invalid password',
  attemptCount: 3
});

// ❌ BAD - Sensitive data
loggingStore.info('AuthService', 'User logged in', {
  password: '***', // NEVER
  token: '***'     // NEVER
});

// ✅ GOOD - Selective data
loggingStore.info('TodoStore', 'Todo updated', {
  todoId: todo.id,
  updatedFields: Object.keys(updates) // Not the actual values
});
```

---

## MVP IMPLEMENTATION (Phase 1)

### Files to Create

1. **`hasura/migrations/default/<timestamp>_create_logs_table/up.sql`**
   - CREATE TABLE logs
   - CREATE indexes

2. **`hasura/migrations/default/<timestamp>_create_logs_table/down.sql`**
   - DROP TABLE logs CASCADE

3. **`hasura/metadata/databases/default/tables/public_logs.yaml`**
   - Hasura permissions for logs table
   - Users can only insert their own logs
   - Admins can view all logs

4. **`src/lib/stores/__tests__/logging.test.ts`**
   - Unit tests for logging service
   - Test batching, debouncing, filtering

5. **`e2e/logging.spec.ts`**
   - E2E test for log creation
   - Verify logs appear in database

### Files to Modify

1. **`src/lib/graphql/documents.ts`**
   - Add `CREATE_LOG` mutation

2. **`src/lib/types/common.ts`**
   - Extend `LogEntry` interface with `user_id`, `session_id`

3. **`src/lib/stores/logging.svelte.ts`**
   - Add DB persistence via GraphQL
   - Implement batching and debouncing
   - Add user context
   - Keep existing in-memory functionality

4. **`src/lib/graphql/client.ts`**
   - Auto-log GraphQL errors (catch and log)

5. **`src/lib/stores/user.svelte.ts`** (example integration)
   - Add error logging to updateUser failures

### Implementation Strategy

**Step 1: Database Setup** ✅
- Create migration files
- Apply migration
- Configure Hasura permissions

**Step 2: GraphQL Layer** ✅
- Add CREATE_LOG mutation to documents.ts
- Generate types (`npm run generate`)

**Step 3: Enhanced Logging Service** ✅
- Extend loggingStore with DB persistence
- Add batching logic (max 50 logs or 10s timeout)
- Add user context from session
- Environment-aware (dev vs prod)

**Step 4: Basic Integration** ✅
- Auto-log GraphQL errors in client.ts
- Add example logging in user.svelte.ts
- Keep it minimal for MVP

**Step 5: Testing** ✅
- Unit tests for logging service
- E2E test for log persistence
- Verify no performance impact

**Step 6: Commit** ✅
- Run `npm run check`
- Commit to `feature/enhanced-logging`
- Document what was implemented

---

## MVP Success Criteria

✅ Logs table exists in PostgreSQL
✅ Logs persist to database via GraphQL
✅ ERROR and WARN logs automatically saved
✅ Batched writes (not every log = 1 DB call)
✅ User context included (user_id when available)
✅ Privacy-safe (no passwords/tokens)
✅ Unit tests pass
✅ E2E test confirms DB persistence
✅ Type checking passes (`npm run check`)
✅ Zero performance impact on user actions
✅ Committed to feature branch

---

## Post-MVP Enhancements (Future)

**Phase 2 - Log Viewer:**
- Admin page to view logs
- Filter by level, component, date range
- Search functionality
- Export to JSON

**Phase 3 - Production Ready:**
- Error boundary integration
- Automatic cleanup (retention policy)
- Performance monitoring dashboard
- Log sampling for high-volume

---

## Current Status

- [x] Branch created: `feature/enhanced-logging`
- [x] Architecture documented and approved
- [x] MVP scope defined
- [ ] **MVP Phase 1 - IN PROGRESS**
- [ ] Phase 2 - Not started
- [ ] Phase 3 - Not started

---

## Notes for AI Assistant

**MVP Focus:**
- Keep it simple and testable
- Prioritize database persistence
- Minimal UI changes (no viewer yet)
- Essential error logging only
- Performance is critical
- Privacy is non-negotiable

**Test Requirements:**
- Unit test: batching, debouncing, level filtering
- E2E test: create error, verify in DB
- Performance test: log 100 items, verify batch behavior

**What to Skip in MVP:**
- Log viewer UI
- Advanced filtering
- Export functionality
- Error boundary
- Cleanup cron jobs
- Extensive integration (just 1-2 examples)
