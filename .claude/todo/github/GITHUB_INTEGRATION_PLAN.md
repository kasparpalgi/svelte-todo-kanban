# GitHub Integration Plan

**Date**: 2025-10-04
**Status**: Phase 1 Ready for Implementation

---

## Executive Summary

Implement bidirectional synchronization between GitHub Issues and Todos, enabling teams to manage issues directly from the Kanban board while maintaining GitHub as the source of truth.

**Existing Infrastructure**:
- ✅ GitHub OAuth authentication (in settings)
- ✅ Encrypted token storage in `user.settings.tokens.github`
- ✅ Repository selection UI (`GithubRepoSelector`)
- ✅ Board-to-repo assignment (`boards.github` JSON field)

**What We'll Build**:
- Phase 1: Import GitHub issues → Todos
- Phase 2: Create GitHub issues when creating todos
- Phase 3: Bidirectional updates & comments sync
- Phase 4: Real-time webhooks

---

## Current Database Schema Analysis

### Boards Table
```typescript
boards {
  id: string
  name: string
  alias: string
  github: jsonb | null  // Stores: { owner: string, repo: string, full_name: string }
  sort_order: number
  is_public: boolean
  allow_public_comments: boolean
  user_id: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Todos Table
```typescript
todos {
  id: string
  title: string
  content: text | null
  due_on: timestamp | null
  sort_order: number
  priority: 'low' | 'medium' | 'high' | null
  list_id: string
  user_id: string
  completed_at: timestamp | null
  created_at: timestamp
  updated_at: timestamp
  alias: string  // Unique per user
}
```

**Missing**: No GitHub issue tracking in todos table!

---

## Phase 1: Import GitHub Issues → Todos

**Goal**: One-way sync to import existing GitHub issues into board todos

### 1.1 Database Schema Changes

**Migration**: Add GitHub tracking to todos

```sql
-- Add GitHub issue metadata to todos table
ALTER TABLE public.todos
  ADD COLUMN github_issue_number INTEGER,
  ADD COLUMN github_issue_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ,
  ADD COLUMN github_url TEXT;

-- Create unique constraint (one issue per board)
CREATE UNIQUE INDEX todos_board_github_issue_unique
  ON public.todos(list_id, github_issue_number)
  WHERE github_issue_number IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_todos_github_issue_id ON public.todos(github_issue_id)
  WHERE github_issue_id IS NOT NULL;
```

**Why these fields?**
- `github_issue_number`: Human-readable issue # (e.g., 42)
- `github_issue_id`: GitHub's internal ID (immutable, for API calls)
- `github_synced_at`: Last sync timestamp (detect stale data)
- `github_url`: Direct link to issue (UX convenience)

### 1.2 GraphQL Schema Updates

**Update `documents.ts`**:

```typescript
// Update TODO_FRAGMENT
export const TODO_FRAGMENT = graphql(`
  fragment TodoFields on todos {
    id
    title
    content
    due_on
    sort_order
    priority
    list_id
    completed_at
    created_at
    updated_at
    github_issue_number
    github_issue_id
    github_synced_at
    github_url
    # ... existing fields
  }
`);
```

### 1.3 Backend API Endpoint

**Create**: `src/routes/api/github/import-issues/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { decryptGithubToken } from '$lib/server/github';
import { request } from '$lib/graphql/client';
import { GET_BOARDS, CREATE_TODO } from '$lib/graphql/documents';

export const POST: RequestHandler = async ({ request: req, locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) {
    throw error(401, 'Unauthorized');
  }

  const { boardId, targetListId } = await req.json();

  // 1. Get board with GitHub repo info
  const boardData = await request(GET_BOARDS, {
    where: { id: { _eq: boardId } }
  });
  const board = boardData.boards[0];

  if (!board?.github) {
    throw error(400, 'Board not connected to GitHub repository');
  }

  const { owner, repo } = board.github;

  // 2. Get decrypted GitHub token
  const githubToken = await decryptGithubToken(session.user.id);
  if (!githubToken) {
    throw error(401, 'GitHub not connected');
  }

  // 3. Fetch issues from GitHub
  const issuesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`,
    {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );

  if (!issuesResponse.ok) {
    throw error(issuesResponse.status, 'Failed to fetch GitHub issues');
  }

  const issues = await issuesResponse.json();

  // 4. Convert issues to todos
  const todos = issues
    .filter((issue: any) => !issue.pull_request) // Exclude PRs
    .map((issue: any, index: number) => ({
      title: issue.title,
      content: issue.body || null,
      list_id: targetListId,
      user_id: session.user.id,
      github_issue_number: issue.number,
      github_issue_id: issue.id,
      github_url: issue.html_url,
      github_synced_at: new Date().toISOString(),
      sort_order: index,
      priority: issue.labels.some((l: any) => l.name === 'priority: high')
        ? 'high'
        : issue.labels.some((l: any) => l.name === 'priority: medium')
        ? 'medium'
        : 'low',
      completed_at: issue.state === 'closed' ? issue.closed_at : null,
      due_on: issue.milestone?.due_on || null
    }));

  // 5. Bulk insert todos (with conflict handling)
  const result = await request(CREATE_TODO, { objects: todos });

  return json({
    success: true,
    imported: result.insert_todos.returning.length,
    total: issues.length
  });
};
```

### 1.4 Frontend: Import UI

**Create**: `src/lib/components/github/ImportIssuesDialog.svelte`

```svelte
<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Select } from '$lib/components/ui/select';
  import { loggingStore } from '$lib/stores/logging.svelte';
  import { displayMessage } from '$lib/stores/errorSuccess.svelte';

  let {
    open = $bindable(false),
    boardId,
    lists = []
  }: {
    open: boolean;
    boardId: string;
    lists: any[]
  } = $props();

  let selectedListId = $state(lists[0]?.id || '');
  let importing = $state(false);

  async function importIssues() {
    if (!selectedListId) {
      displayMessage('Please select a list');
      return;
    }

    importing = true;
    try {
      const response = await fetch('/api/github/import-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          targetListId: selectedListId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      loggingStore.info('GithubImport', 'Successfully imported issues', {
        boardId,
        imported: result.imported
      });

      displayMessage(
        `Successfully imported ${result.imported} of ${result.total} issues`,
        3000,
        true
      );

      open = false;

      // Reload todos
      window.location.reload();
    } catch (error) {
      loggingStore.error('GithubImport', 'Failed to import issues', { error });
      displayMessage(error.message || 'Failed to import issues');
    } finally {
      importing = false;
    }
  }
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Import GitHub Issues</DialogTitle>
    </DialogHeader>

    <div class="space-y-4">
      <div>
        <label for="target-list" class="text-sm font-medium">
          Import issues into list:
        </label>
        <Select bind:value={selectedListId}>
          {#each lists as list}
            <option value={list.id}>{list.name}</option>
          {/each}
        </Select>
      </div>

      <p class="text-sm text-muted-foreground">
        This will import all open issues from the connected GitHub repository.
        Existing todos won't be duplicated.
      </p>

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => open = false}>
          Cancel
        </Button>
        <Button onclick={importIssues} disabled={importing}>
          {importing ? 'Importing...' : 'Import Issues'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### 1.5 Integration Points

**Update**: `src/lib/components/listBoard/BoardHeader.svelte`

Add "Import from GitHub" button next to existing actions:

```svelte
<script>
  import ImportIssuesDialog from '$lib/components/github/ImportIssuesDialog.svelte';
  import { GithubIcon } from 'lucide-svelte';

  let showImportDialog = $state(false);
</script>

<!-- Add button when board has GitHub repo -->
{#if board.github}
  <Button
    variant="outline"
    size="sm"
    onclick={() => showImportDialog = true}
  >
    <GithubIcon class="h-4 w-4 mr-2" />
    Import Issues
  </Button>
{/if}

<ImportIssuesDialog
  bind:open={showImportDialog}
  boardId={board.id}
  lists={lists}
/>
```

### 1.6 Todo Card Visual Indicator

**Update**: `src/lib/components/todo/TodoCard.svelte`

Show GitHub badge on synced todos:

```svelte
{#if todo.github_issue_number}
  <a
    href={todo.github_url}
    target="_blank"
    class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
  >
    <GithubIcon class="h-3 w-3" />
    #{todo.github_issue_number}
  </a>
{/if}
```

### 1.7 Server Helper: Token Decryption

**Create**: `src/lib/server/github.ts`

```typescript
import { request } from '$lib/graphql/client';
import { graphql } from '$lib/graphql/generated';
import crypto from 'crypto';
import { env } from '$env/dynamic/private';

const GET_USER_GITHUB_TOKEN = graphql(`
  query GetUserGithubToken($userId: uuid!) {
    users_by_pk(id: $userId) {
      id
      settings
    }
  }
`);

export async function decryptGithubToken(userId: string): Promise<string | null> {
  const data = await request(GET_USER_GITHUB_TOKEN, { userId });
  const encryptedToken = data.users_by_pk?.settings?.tokens?.github?.encrypted;

  if (!encryptedToken) return null;

  // Decrypt using your encryption key
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const [ivHex, encryptedHex] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}
```

### 1.8 Testing

**E2E Test**: `e2e/github-import.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GitHub Issues Import', () => {
  test('should import issues into selected list', async ({ page }) => {
    // 1. Login
    // 2. Navigate to board with GitHub repo
    // 3. Click "Import Issues" button
    // 4. Select target list
    // 5. Confirm import
    // 6. Verify todos appear with GitHub badges
  });

  test('should not duplicate existing synced todos', async ({ page }) => {
    // 1. Import issues
    // 2. Import again
    // 3. Verify count doesn't increase
  });

  test('should show error if GitHub token missing', async ({ page }) => {
    // Verify error handling
  });
});
```

**Unit Test**: Test issue-to-todo conversion logic

---

## Phase 2: Create GitHub Issues from Todos

**Goal**: When creating a todo on a GitHub-connected board, optionally create a GitHub issue

### 2.1 UI Enhancement

Add checkbox in "Create Todo" dialog:

```svelte
{#if board.github}
  <label class="flex items-center gap-2">
    <input type="checkbox" bind:checked={createGithubIssue} />
    <span class="text-sm">Create GitHub issue</span>
  </label>
{/if}
```

### 2.2 Backend Endpoint

**Create**: `src/routes/api/github/create-issue/+server.ts`

```typescript
export const POST: RequestHandler = async ({ request: req, locals }) => {
  const { todoId, title, body } = await req.json();

  // 1. Get board's GitHub repo
  // 2. Create issue via GitHub API
  // 3. Update todo with github_issue_number, github_issue_id, github_url

  return json({ success: true, issueNumber, issueUrl });
};
```

### 2.3 Store Integration

Update `todos.svelte.ts` `createTodo()`:

```typescript
async function createTodo(data: CreateTodoInput, createGithubIssue = false) {
  // 1. Create todo in DB
  // 2. If createGithubIssue && board.github:
  //    - Call /api/github/create-issue
  //    - Update todo with GitHub metadata
}
```

---

## Phase 3: Bidirectional Updates & Comments

### 3.1 Sync Todo Updates → GitHub

**Triggers**:
- Todo title changed → Update issue title
- Todo completed → Close issue
- Todo reopened → Reopen issue
- Todo content changed → Update issue body

**Implementation**:
- Add to `updateTodo()` in store
- Call `/api/github/update-issue`

### 3.2 Sync Comments

**Database**:
```sql
ALTER TABLE comments
  ADD COLUMN github_comment_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ;
```

**Flow**:
- Comment created → POST to GitHub `/repos/{owner}/{repo}/issues/{issue_number}/comments`
- Store `github_comment_id` for updates/deletes

### 3.3 Import GitHub Comments

When importing issues, also import comments:

```typescript
// For each issue
const commentsResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}/comments`
);
const comments = await commentsResponse.json();

// Create comments in DB with github_comment_id
```

---

## Phase 4: Real-Time Webhooks

**Goal**: GitHub notifies app when issues/comments change

### 4.1 Webhook Endpoint

**Create**: `src/routes/api/github/webhook/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // 1. Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(body).digest('hex');

  if (signature !== digest) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse event
  const event = JSON.parse(body);
  const eventType = request.headers.get('x-github-event');

  // 3. Handle events
  switch (eventType) {
    case 'issues':
      await handleIssueEvent(event);
      break;
    case 'issue_comment':
      await handleCommentEvent(event);
      break;
  }

  return json({ success: true });
};

async function handleIssueEvent(event: any) {
  const { action, issue, repository } = event;

  // Find todo by github_issue_id
  const todo = await findTodoByGithubIssue(issue.id);

  if (!todo) return; // Not synced

  switch (action) {
    case 'edited':
      // Update todo title/content
      break;
    case 'closed':
      // Mark todo as completed
      break;
    case 'reopened':
      // Reopen todo
      break;
  }
}
```

### 4.2 Webhook Registration

**UI in Settings**: Allow users to register webhooks for their repos

**Auto-register**: When selecting a repo, automatically create webhook if user has admin access

---

## Implementation Timeline

### Phase 1: Import Issues (2-3 hours)
- [x] Plan completed
- [ ] Database migration (15 min)
- [ ] Update GraphQL schema (10 min)
- [ ] Backend `/api/github/import-issues` (45 min)
- [ ] Frontend `ImportIssuesDialog` (30 min)
- [ ] Integration in `BoardHeader` (15 min)
- [ ] Visual indicators on todos (15 min)
- [ ] Token decryption helper (15 min)
- [ ] Testing (30 min)

### Phase 2: Create Issues (1-2 hours)
- [ ] UI checkbox in create todo dialog (15 min)
- [ ] Backend `/api/github/create-issue` (30 min)
- [ ] Store integration (30 min)
- [ ] Testing (30 min)

### Phase 3: Bidirectional Sync (2-3 hours)
- [ ] Update issue endpoint (30 min)
- [ ] Comments schema (15 min)
- [ ] Comments sync logic (60 min)
- [ ] Import comments (30 min)
- [ ] Testing (45 min)

### Phase 4: Webhooks (3-4 hours)
- [ ] Webhook endpoint (60 min)
- [ ] Signature verification (30 min)
- [ ] Event handlers (60 min)
- [ ] Registration UI (45 min)
- [ ] Testing (45 min)

**Total Estimate**: 8-12 hours

---

## Security Considerations

1. **Token Storage**: ✅ Already encrypted in DB
2. **Webhook Signature**: Must verify `x-hub-signature-256`
3. **Rate Limiting**: GitHub API has 5000 req/hour limit
4. **Permissions**: Check user has repo access before syncing
5. **Data Privacy**: Don't expose user tokens in logs (use sanitization)

---

## Error Handling

1. **GitHub API Errors**:
   - 401: Token expired → Prompt re-authentication
   - 403: Rate limited → Show retry timer
   - 404: Repo deleted → Show warning, unlink board

2. **Sync Conflicts**:
   - Issue deleted on GitHub → Soft delete todo (show warning)
   - Todo edited while syncing → Last write wins (log conflict)

3. **Network Failures**:
   - Queue failed syncs for retry
   - Show "out of sync" indicator on todos

---

## Logging Integration

Use existing logging system:

```typescript
// Success
loggingStore.info('GithubSync', 'Imported issues', {
  boardId,
  count: issues.length
});

// Errors
loggingStore.error('GithubSync', 'Failed to create issue', {
  todoId,
  error
});

// Performance
const duration = await loggingStore.measureAsync('importIssues', async () => {
  // Import logic
});
```

---

## Success Metrics

**Phase 1**:
- ✅ Can import 100+ issues in <5 seconds
- ✅ No duplicate todos on re-import
- ✅ Correct mapping of labels → priority
- ✅ Closed issues → completed todos

**Phase 2**:
- ✅ Todo → Issue in <2 seconds
- ✅ Issue number displayed on todo
- ✅ Clickable link to GitHub

**Phase 3**:
- ✅ Todo updates reflected on GitHub within 3s
- ✅ Comments synced bidirectionally
- ✅ No data loss during conflicts

**Phase 4**:
- ✅ Real-time updates within 5s of GitHub change
- ✅ Webhook signature verified (100% of requests)
- ✅ Handle 1000+ webhook events/day

---

## Future Enhancements (Post-MVP)

1. **Pull Requests**: Sync PRs as special todos
2. **Assignees**: Map GitHub assignees → board members
3. **Milestones**: Sync GitHub milestones → board filters
4. **Labels**: Two-way label sync (GitHub ↔ Board labels)
5. **Reactions**: Show GitHub reactions on todos
6. **Branch Links**: Auto-link branches to todos
7. **CI/CD Status**: Show build status on todos
8. **Bulk Operations**: Bulk close issues from board

---

**Status**: ✅ **Ready for Phase 1 Implementation**
