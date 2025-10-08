# Logging System Improvement Plan

**Date**: 2025-10-04
**Status**: Ready for Execution

---

## Execution Strategy

Fix issues in priority order, with verification after each fix.

---

## Phase A: Critical Fixes (2 hours)

### A1. Fix Data Serialization (30 min)
**Issue**: #1 - Circular reference crashes
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Replace `JSON.parse(JSON.stringify())` with safe serializer
2. Handle circular references
3. Special handling for Error objects
4. Handle Date, undefined, functions gracefully

**Test**: Create unit test with circular reference

---

### A2. Verify/Create Logs Table Migration (15 min)
**Issue**: #2 - Missing table migration
**Location**: `hasura/migrations/`

**Action**:
1. Search for existing logs table creation migration
2. If missing, create it with proper schema
3. Verify migration is applied
4. Test with actual database query

**Verification**: Query `\d logs` in PostgreSQL

---

### A3. Fix Flush Race Condition (30 min)
**Issue**: #3 - Log loss/duplication
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Add `isFlushingInProgress` flag
2. Queue logs that arrive during flush
3. Process queue after flush completes
4. Add unit test for concurrent flushes

**Test**: Simulate rapid logging during flush

---

### A4. Document ErrorBoundary Limitations (15 min)
**Issue**: #4 - False expectations
**Files**: `ErrorBoundary.svelte`, documentation

**Action**:
1. Add JSDoc comment explaining what it catches
2. Add comment in component explaining limitations
3. Update documentation with clear limitations
4. Add recommendation for component-level error handling

**Note**: Full fix would require Svelte 5 runes-based error handling

---

## Phase B: High Priority Fixes (1.5 hours)

### B1. Add Application Integration (45 min)
**Issue**: #5 - No actual usage
**Files**: `client.ts`, `user.svelte.ts`, key stores

**Action**:
1. Add GraphQL error logging in `client.ts`
2. Add auth failure logging in `user.svelte.ts`
3. Add critical operation logging in 2-3 key stores
4. Log all uncaught errors from async operations

**Examples**:
- User login/logout
- Board creation failures
- Todo update errors
- Permission denied errors

---

### B2. Fix Sampling vs Rate Limiting Order (15 min)
**Issue**: #6 - Inefficient order
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Move sampling check before rate limiting
2. Or exclude sampled-out logs from rate limit count
3. Add comment explaining the order
4. Unit test to verify efficiency

---

### B3. Add Performance Tracking Safeguard (15 min)
**Issue**: #7 - Infinite loop risk
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Add recursion depth counter
2. Return early if tracking is already in progress
3. Use try/finally to ensure cleanup
4. Unit test for recursion prevention

---

### B4. Add Production Error Reporting (15 min)
**Issue**: #8 - Silent failures
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Store failed logs in memory array
2. Add periodic retry mechanism
3. Add metric for failed log count
4. Optionally: localStorage fallback

**Test**: Mock failing GraphQL request

---

### B5. Add Rate Limiter Cleanup (15 min)
**Issue**: #9 - Memory leak
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
1. Add periodic cleanup function
2. Call every 5 minutes via setInterval
3. Remove entries where resetTime < now
4. Add unit test for cleanup

---

## Phase C: Testing & Verification (1 hour)

### C1. Write Real Unit Tests for Phase 3 (30 min)
**Issue**: #10 - Placeholder tests
**File**: `src/lib/stores/__tests__/logging-phase3.test.ts`

**Action**:
Write actual tests for:
1. Performance tracking (with real duration)
2. Sampling rates (statistical verification)
3. Rate limiting (edge cases)
4. Error boundary event handling
5. Circular reference serialization
6. Flush race condition handling
7. Rate limiter cleanup

**Target**: 80%+ coverage for Phase 3

---

### C2. Integration Testing (20 min)
**New File**: `e2e/logging-integration.spec.ts`

**Action**:
Test actual logging flow:
1. User performs action that should log (e.g., login failure)
2. Verify log appears in database
3. Verify log appears in UI (/logs page)
4. Test filtering/searching
5. Test export functionality

---

### C3. Performance Testing (10 min)
**File**: `src/lib/stores/__tests__/logging-performance.test.ts`

**Action**:
Measure:
1. Overhead of sanitizeData() on 1KB object
2. Overhead of log() function (should be <1ms)
3. Memory usage after 10,000 logs
4. Verify batch flush doesn't block

**Acceptance**: <5ms overhead per log call

---

## Phase D: Documentation & Polish (30 min)

### D1. Update Documentation (15 min)
**Files**: `012-logging.md`, README additions

**Action**:
1. Document what ErrorBoundary actually catches
2. Add integration examples
3. Add troubleshooting guide
4. Document known limitations
5. Add performance characteristics

---

### D2. Add Observability (15 min)
**File**: `src/lib/stores/logging.svelte.ts`

**Action**:
Add metrics:
- Total logs created
- Logs flushed vs failed
- Rate limiter hits
- Sampling hits
- Slow operations count

Expose via:
```typescript
function getMetrics() {
	return {
		totalLogs: state.logs.length,
		errorCount: state.performanceMetrics.errorCount,
		warnCount: state.performanceMetrics.warnCount,
		flushSuccessCount,
		flushFailureCount,
		rateLimitHits,
		samplingHits
	};
}
```

---

## Verification Checklist

After all fixes:

### Functional Tests
- [ ] Create log entry → appears in memory
- [ ] Batch of 50 logs → triggers flush
- [ ] Timeout of 10s → triggers flush
- [ ] Error log → saved to database
- [ ] Circular reference in data → doesn't crash
- [ ] Rate limit exceeded → logs stopped
- [ ] Sampling enabled → ~10% logged (statistical)
- [ ] Slow operation → warning logged
- [ ] Failed GraphQL → logs stored for retry

### Integration Tests
- [ ] User login failure → appears in /logs
- [ ] Board creation error → appears in /logs
- [ ] Filter logs by ERROR → only errors shown
- [ ] Export logs → valid JSON downloaded
- [ ] ErrorBoundary catches window.error
- [ ] ErrorBoundary catches unhandledrejection

### Performance Tests
- [ ] 1000 logs in 1s → no UI lag
- [ ] sanitizeData(large object) → <10ms
- [ ] log() call overhead → <1ms
- [ ] Memory usage stable after 10K logs

### Type Safety
- [ ] npm run check → 0 errors
- [ ] All GraphQL queries typed
- [ ] No `any` types in new code

---

## Success Criteria

**Before marking as production-ready:**

1. ✅ All 4 critical issues fixed
2. ✅ At least 4 of 5 high-priority issues fixed
3. ✅ Real unit tests written (not placeholders)
4. ✅ Integration tests pass
5. ✅ Type checking passes
6. ✅ Performance tests pass
7. ✅ Documentation updated
8. ✅ Actual integration in 3+ places in app

**Estimated Total Time**: 5 hours

---

## Implementation Order

1. **A2** - Verify logs table (15min) - Blocker for everything
2. **A1** - Fix serialization (30min) - High risk
3. **A3** - Fix flush race (30min) - High risk
4. **B3** - Performance safeguard (15min) - Prevents recursion
5. **B1** - Add integration (45min) - Makes system useful
6. **B4** - Error reporting (15min) - Visibility
7. **B2** - Sampling order (15min) - Optimization
8. **B5** - Rate limiter cleanup (15min) - Memory leak
9. **C1** - Write tests (30min) - Verification
10. **C2** - Integration tests (20min) - E2E verification
11. **A4** - Document limitations (15min) - Clear expectations
12. **D1** - Update docs (15min) - Final polish
13. **D2** - Add observability (15min) - Monitoring
14. **C3** - Performance tests (10min) - Validation

**Total**: ~4.5 hours

---

## Risk Assessment

**High Risk Areas:**
1. Data serialization - Could break existing logs
2. Flush coordination - Could lose logs if wrong
3. Database migration - Could fail if table structure wrong

**Mitigation:**
- Test each fix in isolation
- Keep backup of working code
- Verify with actual database queries
- Run full test suite after each change

---

## Rollback Plan

If critical issues found after deployment:

1. Revert to Phase 2 commit (logging works but no Phase 3)
2. Disable sampling and rate limiting via config
3. Increase flush timeout to reduce database load
4. Monitor error logs for logging failures

**Rollback Command:**
```bash
git revert HEAD~1  # Revert Phase 3
```

---

## Post-Implementation Monitoring

After deployment, monitor:
- Database log growth rate
- Failed flush count in metrics
- Error logs mentioning "LoggingStore"
- Performance impact on page load
- Memory usage over 24 hours

**Alert Thresholds:**
- Failed flush rate > 5%
- Log database growth > 10GB/week
- Memory usage increase > 100MB/day
- Log() overhead > 5ms average

---

## Next Steps

Ready to execute? Start with Phase A.
