# Logging Coverage Documentation

## Overview

The application uses a comprehensive logging system that persists ERROR and WARN level logs to the database for production monitoring. All logs are visible at `/[lang]/logs`.

## What IS Logged

### ✅ ERROR Level (Persisted to Database)

1. **GraphQL/API Failures** (`GraphQLClient`)
   - All GraphQL query/mutation failures
   - JWT token fetch failures
   - Network errors
   - Authentication errors
   - Permission denied errors
   - Includes: operation name, error type, duration, error message

2. **Page Errors** (`ErrorPage`)
   - 500+ server errors
   - 400-499 client errors (except 404, which is WARN)
   - Includes: status code, URL, error message, user agent

3. **User Store Failures** (`UserStore`)
   - Failed user initialization from database
   - Failed user updates
   - Includes: userId, operation details, error context

4. **GitHub Integration** (`GithubImport`, `GithubSync`)
   - Failed issue imports
   - Failed issue creation/updates
   - Includes: repository info, error details

5. **Uncaught Errors** (`ErrorBoundary`)
   - JavaScript runtime errors
   - Unhandled promise rejections
   - Includes: component stack, error details

### ✅ WARN Level (Persisted to Database)

1. **404 Not Found** (`ErrorPage`)
   - Missing pages/routes
   - Includes: URL, referrer

2. **Slow Operations** (`GraphQLClient`, `Performance`)
   - GraphQL operations >1000ms
   - Any tracked operation exceeding threshold
   - Includes: operation name, duration

3. **Permission Issues** (`ListsStore`)
   - Failed board access during logout
   - Silent failures during cleanup

### ✅ INFO Level (Sampled in Production)

1. **User Actions** (`UserStore`)
   - User login/initialization
   - User profile updates
   - Dark mode toggles
   - Settings changes

2. **GitHub Operations** (`GithubImport`, `GithubSync`)
   - Successful issue imports
   - Successful issue creation/updates

3. **Log Viewer** (`LogsPage`)
   - Log fetches
   - Log exports

**Sampling Configuration (Production Only)**:
- Default: 10% of INFO logs
- UserStore: 5% (high volume)
- GithubImport: 100% (critical)
- ErrorBoundary: 100% (critical)

### ✅ DEBUG Level (Dev Only, Not Persisted)

1. **Voice Input** (`VoiceInput`)
   - Transcript processing
   - Duplicate detection

2. **User Store** (`UserStore`)
   - Dark mode application details
   - Document class changes

## What is NOT Logged (Intentional)

- ❌ **Passwords, tokens, API keys** - Auto-redacted by sanitization
- ❌ **Large payloads** (>1KB) - Truncated to prevent bloat
- ❌ **High-frequency events** - Rate limited (100 logs/component/minute)
- ❌ **Successful routine operations** - Only errors and important actions
- ❌ **Server-side routing** - Console.log only (not persisted)

## Logging Best Practices

### When to Log

**ALWAYS log at ERROR level:**
```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// GraphQL/API errors - handled automatically by GraphQLClient
// Manual logging in stores:
loggingStore.error('StoreName', 'Operation failed', {
  id: itemId,
  operation: 'update',
  error: error.message
});
```

**ALWAYS log at WARN level:**
```typescript
// Permission denied, degraded functionality
loggingStore.warn('StoreName', 'Permission denied for operation', {
  operation: 'delete',
  userId: user.id
});

// Slow operations - handled automatically for >1000ms
```

**Sometimes log at INFO level** (will be sampled in production):
```typescript
// Important user actions
loggingStore.info('AuthService', 'User logged in', {
  userId: user.id,
  method: 'google-oauth'
});

// Successful critical operations
loggingStore.info('PaymentService', 'Payment processed', {
  amount: total,
  orderId: order.id
});
```

**Use DEBUG level** for development only:
```typescript
// Temporary debugging (dev only, not persisted)
loggingStore.debug('ComponentName', 'State changed', {
  oldValue: prev,
  newValue: current
});
```

### What NOT to Log

```typescript
// ❌ DON'T: Log successful routine operations
loggingStore.info('TodoStore', 'Todo loaded', { id }); // Too verbose

// ✅ DO: Only log failures
if (!result.success) {
  loggingStore.error('TodoStore', 'Failed to load todo', { id, error });
}

// ❌ DON'T: Log sensitive data (it's auto-redacted anyway)
loggingStore.error('Auth', 'Login failed', {
  password: userPassword // Will be [REDACTED]
});

// ✅ DO: Log contextual info without sensitive data
loggingStore.error('Auth', 'Login failed', {
  email: user.email,
  reason: 'invalid_credentials'
});
```

## Log Data Structure

Each log entry includes:

```typescript
{
  id: string;              // Unique log ID
  timestamp: Date;         // When error occurred
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;       // Component/store name
  message: string;         // Human-readable message
  data?: {                // Optional context
    // Any relevant data (sanitized automatically)
  };
  userAgent: string;      // Browser info
  url: string;            // Page URL
  user_id?: string;       // Current user (if logged in)
  session_id: string;     // Browser session ID
}
```

## Viewing Logs

1. Navigate to `/[lang]/logs` (e.g., `/en/logs`)
2. Filter by:
   - Level (ERROR, WARN, INFO)
   - Component name
   - Date range
   - Search text
3. Export logs as JSON for analysis

## Configuration

Located in `src/lib/config/logging.ts`:

- **Retention**: 30 days (automatic cleanup)
- **Batch Size**: 50 logs (production), 10 (dev)
- **Rate Limiting**: 100 logs/component/minute
- **Slow Operation Threshold**: 1000ms
- **Sampling**: Enabled in production only

## Coverage Summary

### Covered Areas ✅
- ✅ All GraphQL operations (errors + slow queries)
- ✅ Page errors (404, 500, etc.)
- ✅ User authentication and profile operations
- ✅ GitHub integration
- ✅ Uncaught JavaScript errors
- ✅ Performance monitoring (slow operations)

### Server-Side Logging 📋
Server-side operations (layout redirects, auth checks) use `console.log` which appears in server logs. These are not persisted to the database as they're not client-side errors.

## Files Modified

1. `src/routes/+error.svelte` - Logs all page errors (404, 500, etc.)
2. `src/lib/graphql/client.ts` - Logs all GraphQL failures and slow operations
3. `src/lib/stores/logging.svelte.ts` - Core logging system (already existed)
4. `src/lib/components/ErrorBoundary.svelte` - Logs uncaught errors (already existed)
5. `src/lib/stores/user.svelte.ts` - Logs user operations (already existed)

## Testing Logging

To verify logging works:

1. **Test 404 Error**:
   - Navigate to `/en/nonexistent-page`
   - Check `/en/logs` for WARN level entry

2. **Test GraphQL Error**:
   - Trigger a failing mutation (e.g., invalid data)
   - Check logs for ERROR level with operation name

3. **Test Slow Operation**:
   - Throttle network in DevTools
   - Execute any GraphQL query
   - Check logs for WARN if >1000ms

4. **Test Server Error**:
   - Trigger a 500 error
   - Check logs for ERROR level with status code

## Status

✅ **COMPLETE** - Comprehensive logging system covers all critical error paths
