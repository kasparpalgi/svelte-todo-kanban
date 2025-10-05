# GitHub Integration - Database Migration Required

**Date**: 2025-10-05
**Status**: ⚠️ Temporarily Disabled
**Branch**: `feature/enhanced-logging`

---

## Problem

The GitHub integration functionality requires database schema changes that haven't been applied to your production database yet.

### Error Encountered
```
GraphQL request error: field 'github_issue_number' not found in type: 'todos'
```

### Root Cause
The GraphQL queries include GitHub-related fields (`github_issue_number`, `github_issue_id`, `github_synced_at`, `github_url`, `github_comment_id`) that don't exist in your current database schema.

---

## What's Been Done (Temporary Fix)

To make the application load, I've temporarily disabled GitHub integration:

### 1. GraphQL Schema Changes
**File**: `src/lib/graphql/documents.ts`

- ❌ Removed `github_issue_number`, `github_issue_id`, `github_synced_at`, `github_url` from `TODO_FRAGMENT`
- ❌ Removed `github_comment_id`, `github_synced_at` from `COMMENT_FRAGMENT`
- ❌ Removed `github` from `BOARD_FRAGMENT`
- ❌ Commented out `GET_TODO_BY_GITHUB_ISSUE` query
- ❌ Commented out `GET_COMMENT_BY_GITHUB_ID` query

### 2. Code Changes
**File**: `src/lib/stores/todos.svelte.ts`

- ❌ Disabled `syncTodoToGithub()` function (returns immediately)
- ❌ Commented out GitHub metadata updates after todo creation
- ❌ Commented out GitHub sync after todo updates

### 3. TypeScript Types
- ✅ Regenerated GraphQL types without GitHub fields
- ✅ Application now compiles without errors

---

## Required Database Migrations

Three migrations exist but haven't been applied:

###  1. Add GitHub Tracking to Boards
**Migration**: `hasura/migrations/default/1759263945133_alter_table_public_boards_add_column_github/`

```sql
ALTER TABLE public.boards
  ADD COLUMN github JSONB;

COMMENT ON COLUMN public.boards.github IS 'GitHub repository connection (owner, repo, etc.)';
```

### 2. Add GitHub Tracking to Todos
**Migration**: `hasura/migrations/default/1759608245965_add_github_tracking_to_todos/`

```sql
ALTER TABLE public.todos
  ADD COLUMN github_issue_number INTEGER,
  ADD COLUMN github_issue_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ,
  ADD COLUMN github_url TEXT;

CREATE INDEX idx_todos_github_issue_id ON public.todos(github_issue_id)
  WHERE github_issue_id IS NOT NULL;

CREATE INDEX idx_todos_github_issue_number ON public.todos(github_issue_number)
  WHERE github_issue_number IS NOT NULL;
```

### 3. Add GitHub Tracking to Comments
**Migration**: `hasura/migrations/default/1759609643306_add_github_tracking_to_comments/`

```sql
ALTER TABLE public.comments
  ADD COLUMN github_comment_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ;

CREATE INDEX idx_comments_github_comment_id ON public.comments(github_comment_id)
  WHERE github_comment_id IS NOT NULL;
```

---

## How to Apply Migrations

### Option 1: Using Hasura CLI (Recommended)

```bash
# Navigate to hasura directory
cd hasura

# Apply migrations
hasura migrate apply --endpoint https://todzz.admin.servicehost.io

# Apply metadata
hasura metadata apply --endpoint https://todzz.admin.servicehost.io
```

### Option 2: Manual SQL Execution

1. Connect to your production database
2. Execute the SQL from each migration's `up.sql` file in order:
   - `1759263945133_alter_table_public_boards_add_column_github/up.sql`
   - `1759608245965_add_github_tracking_to_todos/up.sql`
   - `1759609643306_add_github_tracking_to_comments/up.sql`

### Option 3: Hasura Console

1. Open Hasura Console at https://todzz.admin.servicehost.io/console
2. Go to Data → SQL
3. Execute each migration SQL manually

---

## After Migrations Are Applied

Once the database migrations are applied, you need to restore GitHub functionality:

### 1. Restore GraphQL Queries

**File**: `src/lib/graphql/documents.ts`

```typescript
// Uncomment and restore these lines in TODO_FRAGMENT:
github_issue_number
github_issue_id
github_synced_at
github_url

// Uncomment and restore these lines in COMMENT_FRAGMENT:
github_comment_id
github_synced_at

// Uncomment and restore in BOARD_FRAGMENT:
github

// Uncomment these queries:
export const GET_TODO_BY_GITHUB_ISSUE = ...
export const GET_COMMENT_BY_GITHUB_ID = ...
```

### 2. Restore Code Functionality

**File**: `src/lib/stores/todos.svelte.ts`

Uncomment all the code marked with:
```typescript
// TODO: Uncomment when database migrations are applied
```

Specifically:
- `syncTodoToGithub()` function implementation
- GitHub metadata updates after todo creation
- GitHub sync calls after todo updates

### 3. Regenerate Types

```bash
npm run generate
```

### 4. Test

```bash
# Check for TypeScript errors
npm run check

# Build the application
npm run build

# Run E2E tests
npm run test:e2e
```

---

## GitHub Integration Features (Currently Disabled)

The following features are temporarily disabled:

❌ **Bidirectional Sync**
- Todo changes → GitHub issue updates
- GitHub issue changes → Todo updates (webhooks)

❌ **Create GitHub Issues**
- Creating GitHub issues from todos
- Automatic linking and metadata tracking

❌ **Import GitHub Issues**
- Importing existing issues as todos
- Syncing issue metadata

❌ **Webhook Processing**
- Real-time updates from GitHub
- Issue/comment event handling

❌ **GitHub Integration UI**
- GitHub connection settings
- Issue linking indicators
- Sync status displays

---

## E2E Tests Status

The E2E tests for GitHub integration were implemented but will fail until migrations are applied:

- ✅ Test infrastructure complete (64 tests)
- ✅ Test files created
- ⏳ **12 passing** (error handling tests)
- ⏳ **52 failing** (require GitHub fields in database)

Test files:
- `e2e/github-import.unauthenticated.spec.ts` (16 tests)
- `e2e/github-create-issue.unauthenticated.spec.ts` (13 tests)
- `e2e/github-update-issue.unauthenticated.spec.ts` (17 tests)
- `e2e/github-webhooks.unauthenticated.spec.ts` (18 tests)

---

## Summary

**Current State**: Application loads but GitHub integration is disabled

**To Restore**:
1. Apply 3 database migrations
2. Uncomment code in 2 files
3. Regenerate GraphQL types
4. Test and verify

**Estimated Time**: 15-30 minutes (depending on migration method)

**Risk**: Low - migrations only add new columns, no data modification

---

## Questions?

If you need help applying migrations or restoring functionality, please ask!
