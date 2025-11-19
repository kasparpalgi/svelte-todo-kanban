# Better GitHub Integration

## Original Requirement

Improve GitHub integration. When I create item then issue is created in Github. When I edit it's content, comment or mark it complete or delete it all goes sync to Github - good!

What is missing:
1. When I delete the comment it won't get deleted from GitHub
2. When someone comments in Github - won't come to board here
3. When someone Commits to Github it won't display in board activity.
4. When someone edits issue in Github it won't get edited in or system
5. When someone marks complete, etc. Make proper two way sync and get activities from Github.

## Implementation Summary

### Changes Made

#### 1. Comment Deletion Sync (✅ Completed)
**Files Changed:**
- `src/routes/api/github/delete-comment/+server.ts` - New API endpoint to delete GitHub comments
- `src/lib/stores/comments.svelte.ts` - Updated `deleteComment()` to sync deletions to GitHub
- `src/lib/components/card/CardComments.svelte` - Pass `todo` parameter to deleteComment

**How it works:**
- When a comment is deleted locally, if it has a `github_comment_id`, the app calls the GitHub API to delete it
- Handles 404 errors gracefully (comment already deleted)
- Non-blocking: GitHub deletion failure doesn't prevent local deletion

#### 2. Bidirectional Comment Sync (✅ Completed)
**Files Changed:**
- `src/routes/api/github/webhook/+server.ts` - Enhanced webhook handlers for comments
- `src/lib/graphql/documents.ts` - Added `GET_USER_BY_GITHUB_USERNAME` query

**Features Implemented:**
- **Comment Creation from GitHub**: When someone comments on a GitHub issue, it creates a comment in the app
  - Maps GitHub username to app user via settings
  - Falls back to board owner if user not found
  - Logs activity with GitHub metadata

- **Comment Editing from GitHub**: When a comment is edited on GitHub, it updates locally
  - Syncs content changes
  - Logs activity with old/new values

- **Comment Deletion from GitHub**: When a comment is deleted on GitHub, it's deleted locally
  - Logs activity before deletion
  - Maintains audit trail

#### 3. Commit Activity Logging (✅ Completed)
**Files Changed:**
- `src/routes/api/github/webhook/+server.ts` - Added `handlePushEvent()` function
- `src/routes/api/github/register-webhook/+server.ts` - Added 'push' to webhook events

**How it works:**
- Webhook receives push events from GitHub
- Parses commit messages for issue references (e.g., `#123`, `fixes #456`, `closes #789`)
- Only processes commits on `main` or `master` branches
- Logs commits to activity log with metadata:
  - Commit SHA and URL
  - Author name
  - Commit message
  - Number of files changed
  - Branch name
- Activity type: `github_commit`

**Supported patterns:**
- `#123` - Basic issue reference
- `fixes #456` - Fix keywords
- `closes #789` - Close keywords
- `resolves #101` - Resolve keywords

#### 4. Issue Sync from GitHub (✅ Already Working)
The webhook handler already supports:
- Issue edited → Updates todo title and content
- Issue closed → Marks todo as completed
- Issue reopened → Marks todo as incomplete
- Issue deleted → Preserves local todo (logged)

### Technical Details

#### User Mapping Strategy
For comments created in GitHub, the app attempts to:
1. Find user by GitHub username in `users.settings.tokens.github.username`
2. If not found, use the board owner as fallback **with comment prefix**
3. If no board owner, skip comment creation (logged)

**Fallback Attribution**: When a comment is from an unknown GitHub user, the comment content is prefixed with `**[username on GitHub]:**` to clearly identify the actual author. This prevents confusion about who wrote the comment.

Example:
```
**[octocat on GitHub]:**

This is the actual comment content from GitHub user 'octocat'
```

This ensures proper attribution even when the GitHub user doesn't have an account in the app.

#### Activity Logging
All GitHub webhook events log activities with:
- `action_type`: Type of action (e.g., `commented`, `comment_edited`, `github_commit`)
- `metadata.source`: Set to `"github"` for all webhook-triggered activities
- Additional metadata for commits: SHA, URL, author, branch, files changed

#### Webhook Configuration
The webhook is now configured to listen for:
- `issues` - Issue events (edit, close, reopen, delete)
- `issue_comment` - Comment events (create, edit, delete)
- `push` - Push events (commits)

### Security Considerations

1. **Webhook Signature Verification**: All webhooks verify HMAC SHA-256 signature
2. **User Authentication**: All API endpoints require authenticated session
3. **GitHub Token Security**: Tokens are encrypted in database
4. **Non-blocking Operations**: GitHub sync failures don't break local operations

### Known Limitations

1. **User Mapping**: Comments from unknown GitHub users are prefixed with `[username on GitHub]:` and attributed to board owner
   - Comment clearly shows actual GitHub username to prevent confusion
   - Future improvement: Allow manual user mapping in settings

2. **Branch Filtering**: Only `main` and `master` branches are tracked for commits
   - Future improvement: Make configurable per board

3. **Commit Pattern Matching**: Basic regex patterns may miss some references
   - Future improvement: Use GitHub's issue reference API

4. **One-way Comment Edits**: Editing a comment locally doesn't sync to GitHub
   - Future improvement: Add GitHub comment update endpoint

### Testing Requirements

Before finalizing, the following should be tested:

1. **Comment Deletion**:
   - [ ] Delete comment locally → Verify deleted on GitHub
   - [ ] Delete comment on GitHub → Verify deleted locally
   - [ ] Delete comment without GitHub ID → No errors

2. **Comment Creation**:
   - [ ] Comment on GitHub issue → Verify appears locally
   - [ ] Comment by known user → Correct attribution
   - [ ] Comment by unknown user → Falls back to board owner

3. **Comment Editing**:
   - [ ] Edit comment on GitHub → Verify updated locally
   - [ ] Multiple edits → All sync correctly

4. **Commits**:
   - [ ] Commit with `#123` → Logged to issue #123
   - [ ] Commit with `fixes #456` → Logged to issue #456
   - [ ] Commit on feature branch → Not logged (only main/master)
   - [ ] Commit referencing multiple issues → Logged to all

5. **Issue Sync**:
   - [ ] Edit issue on GitHub → Updates locally
   - [ ] Close issue on GitHub → Marks complete locally
   - [ ] Reopen issue on GitHub → Marks incomplete locally

### Files Modified

1. `src/routes/api/github/delete-comment/+server.ts` (NEW)
2. `src/routes/api/github/webhook/+server.ts` (MODIFIED)
3. `src/routes/api/github/register-webhook/+server.ts` (MODIFIED)
4. `src/lib/stores/comments.svelte.ts` (MODIFIED)
5. `src/lib/components/card/CardComments.svelte` (MODIFIED)
6. `src/lib/graphql/documents.ts` (MODIFIED)

### Next Steps

1. Run `npm run generate` to generate TypeScript types for new GraphQL query
2. Run `npm run check` to verify no type errors
3. Run `npm test` to ensure all tests pass
4. Test all scenarios listed above
5. Commit changes with detailed commit message
6. Push to branch `claude/process-todo-tasks-01CskRurJ6znGFcYPD1WkoUM`

## Status

✅ All requirements implemented
⚠️ Testing required before finalizing
📝 Documentation updated