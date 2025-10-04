# Project Context

## Overview
Modern Kanban ToDo application with drag-and-drop functionality, rich task management, file attachments, and real-time optimistic updates. Built as a monorepo with SvelteKit frontend and Hasura backend.

## MANDATORY TESTING REQUIREMENTS

**CRITICAL: Claude Code MUST always write tests to verify its work!**

### Testing Rules (NEVER SKIP THESE)

1. **After ANY code change, ALWAYS:**
   - Write unit tests for new functions/stores (Vitest)
   - Write component tests for UI changes (Svelte Testing Library)
   - Write E2E tests for user workflows (Playwright)
   - Run `npm run check` to verify no type errors
   - Run `npm test` to execute all tests
   - Document test coverage in the task file

2. **Test Coverage Requirements:**
   - **Stores**: Test all actions, derived state, error handling, optimistic updates
   - **Components**: Test rendering, user interactions, edge cases
   - **API Integration**: Test success/failure scenarios, error handling
   - **E2E**: Test complete user workflows from start to finish

3. **Test File Locations:**
   ```
   src/lib/stores/featureStore.svelte.ts
   src/lib/stores/featureStore.test.ts      # Unit tests next to store
   
   src/lib/components/feature/Component.svelte
   src/lib/components/feature/Component.test.ts  # Component tests
   
   tests/e2e/feature-workflow.spec.ts       # E2E tests in tests/ folder
   ```

4. **Debugging & Verification Process:**
   - Add `console.log` statements for debugging during development
   - Verify functionality works as expected
   - Run all tests and fix any failures
   - Remove unnecessary console.logs and comments before finalizing
   - Document what was tested in the task file

5. **Task Documentation:**
   Every task file in `/todo/` folder MUST include:
   ```markdown
   # [Task Name]
   
   ## Original Requirement
   [User's original request - KEEP AT TOP]
   
   ## Plan
   [Detailed implementation plan]
   
   ## Implementation
   [What was built]
   
   ## Tests Written
   - [ ] Unit tests: [list files and what they test]
   - [ ] Component tests: [list files and what they test]
   - [ ] E2E tests: [list files and what they test]
   - [ ] `npm run check` - passed ✓
   - [ ] `npm test` - passed ✓
   
   ## Test Coverage
   [Coverage percentage and any gaps]
   
   ## Execution Results
   [What worked, what didn't, any issues encountered]
   ```

### Example Test Structure

```typescript
// Unit test for store (featureStore.test.ts)
import { describe, it, expect, beforeEach } from 'vitest';
import { featureStore } from './featureStore.svelte';

describe('featureStore', () => {
  beforeEach(() => {
    // Reset state if needed
  });

  it('should load items successfully', async () => {
    await featureStore.loadItems();
    expect(featureStore.loading).toBe(false);
    expect(featureStore.items.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });

  it('should perform optimistic updates correctly', async () => {
    // Test optimistic update and rollback
  });
});
```

```typescript
// Component test (Component.test.ts)
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Component from './Component.svelte';

describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(Component);
    expect(getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const { getByRole } = render(Component);
    const button = getByRole('button');
    await fireEvent.click(button);
    // Assert expected behavior
  });
});
```

```typescript
// E2E test (feature-workflow.spec.ts)
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Create Board');
  await page.fill('input[name="name"]', 'Test Board');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Test Board')).toBeVisible();
});
```

## Claude Code Multi-Terminal Best Practices

### Parallel Development with Git Worktrees (RECOMMENDED)

Git Worktrees let you check out multiple branches simultaneously in separate directories, sharing a single repository database without duplicating .git directories.

**Why Use Worktrees:**
- Each Claude Code instance works in complete isolation
- No merge conflicts with yourself
- No need to switch branches constantly
- Each session maintains its own context and state
- Perfect for running multiple AI agents on different features in parallel

**Basic Worktree Commands:**
```bash
# Create a new worktree for a feature branch
git worktree add ../feature-branch feature-name

# Navigate to worktree and start Claude Code
cd ../feature-branch
claude

# List all worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../feature-branch
```

**Automated Worktree Manager:**
Create a bash function for faster workflow (save to `~/.bashrc` or `~/.zshrc`):

```bash
# w - Claude Code worktree manager
# Usage: w <project> <branch-name> [command]
# Examples:
#   w myproject new-feature          # Create/enter worktree
#   w myproject new-feature claude   # Start Claude in worktree
#   w myproject new-feature git status

function w() {
  local project=$1
  local branch=$2
  shift 2
  local cmd="$@"
  
  local worktree_base="$HOME/projects/worktrees"
  local worktree_path="$worktree_base/$project/$branch"
  
  # Create worktree if it doesn't exist
  if [[ ! -d "$worktree_path" ]]; then
    mkdir -p "$worktree_base/$project"
    cd "$HOME/projects/$project"
    git worktree add "$worktree_path" -b "$branch"
  fi
  
  # Execute command in worktree or just cd
  if [[ -n "$cmd" ]]; then
    cd "$worktree_path" && $cmd
  else
    cd "$worktree_path"
  fi
}
```

**Workflow Example:**
```bash
# Terminal 1: Feature A
w kanban-todo feature-a claude

# Terminal 2: Feature B  
w kanban-todo feature-b claude

# Terminal 3: Bug fix
w kanban-todo bugfix-123 claude

# Each has its own isolated environment!
```

### GitButler Integration (ALTERNATIVE - No Worktrees)

GitButler allows running multiple Claude Code sessions in the same directory by automatically creating separate branches for each session using Claude Code hooks.

**How It Works:**
- Uses Claude Code lifecycle hooks
- Automatically creates a new branch per session
- Assigns work to appropriate branches automatically
- Commits changes per chat round with AI-generated messages
- No worktree management needed

**Setup:**
1. Install GitButler CLI: `https://gitbutler.com/downloads`
2. Configure Claude Code hooks: `https://docs.gitbutler.com/features/ai-integration/claude-code-hooks`
3. Run multiple Claude sessions - each gets its own branch automatically

### Claude Code Plan Mode

Plan Mode instructs Claude to create a plan by analyzing the codebase with read-only operations, perfect for exploring codebases, planning complex changes, or reviewing code safely.

**When to Use Plan Mode:**
- Exploring unfamiliar codebases
- Planning multi-file changes
- Complex features requiring analysis first
- You can confidently leave Claude running without worrying about unauthorized changes

**Usage:**
```bash
# Start Claude in plan mode
claude --plan

# Or prompt within Claude:
"Use plan mode to analyze how to implement feature X"
```

### Multi-Agent Patterns

Effective approaches include having one Claude write code while another reviews or tests it, similar to working with multiple engineers.

**Common Patterns:**

1. **Developer + Reviewer Pattern:**
   - Terminal 1: Claude writes feature
   - Terminal 2: Claude reviews code quality and suggests improvements
   
2. **Developer + Tester Pattern:**
   - Terminal 1: Claude implements feature
   - Terminal 2: Claude writes comprehensive tests
   
3. **Parallel Features Pattern:**
   - Terminal 1: Feature A development
   - Terminal 2: Feature B development
   - Terminal 3: Bug fixes
   - Each in separate worktrees/branches

4. **Research + Implementation:**
   - Terminal 1: Plan mode exploration
   - Terminal 2: Active implementation

### Voice Integration (ADVANCED)

Using voice dictation tools like SuperWhisper allows natural explanation of complex features, making it easier to communicate requirements than typing.

**Benefits:**
- Faster context sharing for complex features
- Natural "brain dump" of requirements
- Works well for explaining edge cases and scenarios that would take forever to type

### Best Practices Summary

1. **Isolation is Key:**
   - Use git worktrees for truly independent work
   - OR use GitButler for automatic branch management
   - Never run multiple Claudes in same directory without isolation

2. **Plan Before Executing:**
   - Use plan mode for complex changes
   - Let Claude analyze before making changes
   - Review plans before accepting

3. **Resource Management:**
   - Each worktree needs its own build artifacts
   - Consider port conflicts if running dev servers
   - Use docker-compose for backend services

4. **Testing Everything:**
   - **MANDATORY**: Write tests for all changes
   - Use separate Claude instance for test generation
   - Run `npm run check` and `npm test` before finalizing

5. **Context Management:**
   - Keep task files updated in `/todo/` folder
   - Document what each terminal/session is working on
   - Original requirements stay at top of task files

Important! Make sure it works what you do with appropriate tests and run `npm run check` first to make sure no type issues or stupid mistakes. 

Before doing any task get context from relevant files and plan the work in a professional way. Add to the `todo` folder task file your plan and execution results.

First add console.log's for better understanding what your code does and once tested and working remove unnecessary comments and console logging.

In todo folder when you document your plan and results, leave into very top my original requirement.

## Tech Stack

### Frontend
- **Framework**: Svelte 5, SvelteKit with TypeScript (static adapter for mobile)
- **UI Components**: shadcn-svelte, Tailwind CSS, Lucide icons
- **Rich Text Editor**: svelte-tiptap (markdown support)
- **Drag & Drop**: @dnd-kit/svelte for Kanban interactions
- **Forms**: Zod validation
- **i18n**: sveltekit-i18n (lightweight, zero dependencies)

### Backend
- **API**: Hasura GraphQL (enterprise-grade engine)
- **Database**: PostgreSQL with functions for business logic
- **Auth**: Auth.js with JWT tokens
- **Email**: nodemailer
- **GraphQL Client**: graphql-request with graphql

### Testing
- **E2E**: Playwright
- **Unit/Component**: Vitest
- **Coverage**: MANDATORY for all changes

## Architecture

### Directory Structure
```
src/
├── routes/
│   ├── [lang]/           # Language-based routing (current pattern)
│   └── api/              # SvelteKit server routes (Auth.js, file uploads)
├── lib/
│   ├── components/
│   │   ├── todo/         # Todo-specific components
│   │   ├── listBoard/    # Board and list components
│   │   └── ui/           # Shared UI (mostly shadcn-svelte)
│   ├── stores/           # State management (factory pattern)
│   ├── graphql/
│   │   ├── client.ts     # GraphQL client
│   │   ├── documents.ts  # All queries/mutations (for codegen)
│   │   └── generated.ts  # Auto-generated types
│   └── locales/          # Translation files
hasura/
├── metadata/             # GraphQL schema, permissions, relationships
├── migrations/           # Database migrations
└── seeds/                # Test data (optional)
tests/
├── e2e/                  # Playwright E2E tests
└── unit/                 # Additional unit tests (if not co-located)
todo/                     # Task documentation (ALWAYS update)
```

### Routing System

**Current Pattern**: `/[lang]/[route]`

**URL Generation**: PostgreSQL functions create SEO-friendly aliases
- **Boards**: `/[lang]/[username]/[boardAlias]` (globally unique)
- **Todos**: `/[lang]/[username]/[boardAlias]/[todoAlias]` (user-scoped unique)

**Alias Generation Logic**:
- Converts to lowercase, URL-friendly format
- Replaces spaces with hyphens
- Removes special characters
- Handles duplicates with numbers (e.g., `my-board`, `my-board-2`)

**Planned Improvements**:
1. Custom usernames (auto-generated from name, e.g., "Tom Woods" → `tom`, `tom-w`, `tom1`)
2. Shareable URLs: `/[username]/[boardAlias]/[todoAlias]`

## Store Pattern (CRITICAL)

All stores MUST follow this factory pattern in `src/lib/stores/<name>.svelte.ts`:

```typescript
import { browser } from '$app/environment';

function createSomeStore() {
  // Single $state object for all reactive state
  const state = $state({
    items: [],
    loading: false,
    error: null
  });

  // --- Actions: async functions for API interactions ---
  async function loadItems() {
    if (!browser) return; // CRITICAL: Always check browser first
    
    state.loading = true;
    state.error = null;
    
    try {
      const data = await request(GET_ITEMS, { /* params */ });
      state.items = data.items || [];
    } catch (error) {
      state.error = error.message;
    } finally {
      state.loading = false; // Always in finally
    }
  }

  // --- Derived State: computed values ---
  const sortedItems = $derived(
    [...state.items].sort((a, b) => a.order - b.order)
  );

  // --- Public API: expose via getters (prevents direct mutation) ---
  return {
    get items() { return state.items; },
    get loading() { return state.loading; },
    get error() { return state.error; },
    get sortedItems() { return sortedItems; },
    loadItems,
    updateItem
  };
}

export const someStore = createSomeStore();
```

### Store Rules

1. **State**: Single `$state` object containing all reactive state
2. **Browser Guard**: ALWAYS start actions with `if (!browser) return;`
3. **Loading State**: 
   - Set `state.loading = true` at start
   - Set `state.loading = false` in `finally` block
4. **Error Handling**: Set `state.error` on failure, clear on success
5. **Return Format**: Actions return `{ success: boolean, message: string, data?: T }`
6. **Getters**: Expose state via getters to prevent external mutation
7. **localStorage**: Only for non-critical UI preferences, always wrap in `if (browser)`
8. **Global State**: Check `src/lib/stores/states.svelte.ts` for shared state
9. **Testing**: MUST write unit tests for all store actions and derived state

### localStorage Usage

ONLY for non-critical, persistent UI preferences:

```typescript
// Good: Remembering last selected board
if (browser) {
  const savedId = localStorage.getItem('selectedBoardId');
  const savedBoard = state.boards.find((b) => b.id === savedId);
  state.selectedBoard = savedBoard || state.boards[0];
}

// Bad: Never store sensitive data, auth tokens, or critical app data
```

## Optimistic Updates Pattern (CRITICAL)

ALWAYS follow this pattern for mutations to provide instant UI feedback:

```typescript
async function updateItem(id, updates) {
  // 1. Find and validate item exists
  const itemIndex = state.items.findIndex((i) => i.id === id);
  if (itemIndex === -1) {
    return { success: false, message: 'Item not found' };
  }

  // 2. Store original for rollback
  const original = { ...state.items[itemIndex] };
  
  // 3. Apply optimistic update (instant UI feedback)
  state.items[itemIndex] = { ...original, ...updates };

  try {
    // 4. Execute API call
    const data = await request(UPDATE_ITEM, { 
      id, 
      updates 
    });
    
    const updated = data.update_items?.returning?.[0];

    // 5. Validate API response
    if (!updated) {
      state.items[itemIndex] = original; // Revert on failure
      state.error = 'Failed to update item';
      return { success: false, message: 'Update failed' };
    }
    
    // 6. Apply final update with server data (ensures consistency)
    state.items[itemIndex] = updated;
    return { success: true, message: 'Updated', data: updated };
    
  } catch (error) {
    // 7. Revert on network/request error
    state.items[itemIndex] = original;
    state.error = error.message;
    return { success: false, message: error.message };
  }
}
```

**Why This Pattern**:
- Instant UI feedback (feels fast and responsive)
- Automatic rollback on errors
- Server data consistency
- Clean error handling
- **MUST be tested**: Write tests for both success and rollback scenarios

## GraphQL Operations

### Workflow

1. **Define queries/mutations** in `src/lib/graphql/documents.ts`:
```typescript
export const GET_BOARDS = gql`
  query GetBoards($user_id: uuid!) {
    boards(where: { user_id: { _eq: $user_id } }) {
      id
      name
      alias
    }
  }
`;
```

2. **Generate types**: Run `npm run generate` after any changes

3. **Use in stores**:
```typescript
import { request } from '$lib/graphql/client';
import { GET_BOARDS, UPDATE_BOARD } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated';

const data: GetBoardsQuery = await request(GET_BOARDS, { user_id });
```

### Rules

- **Centralize**: ALL GraphQL operations in `documents.ts` (enables codegen)
- **Type Safety**: Always import generated types
- **Client**: Use `request()` exclusively, never direct fetch
- **Codegen**: Run after every schema or query change
- **Testing**: Mock GraphQL responses in tests

## Error & Success Handling

### Centralized System

**Already configured** - component added to root `+layout.svelte`:
- State: `src/lib/stores/errorSuccess.svelte.ts`
- Display: `src/lib/components/ui/ErrorSuccess.svelte` (toast notifications)

### Usage

```typescript
import { displayMessage } from '$lib/stores/errorSuccess.svelte';

// Error messages (default: 7000ms)
displayMessage('Failed to save changes');
displayMessage('Network error occurred', 5000); // Custom duration

// Success messages (default: 1500ms, third param = isSuccess)
displayMessage('Changes saved', 1500, true);
displayMessage('Board created successfully', 3000, true); // Longer feedback
```

**Best Practices**:
- Use in store actions after operations
- Keep messages concise and actionable
- Extend duration for important/complex messages
- Don't show success for every minor action

## Localization (Partial Implementation)

Using sveltekit-i18n for translations:

### Adding Translations

1. Add to `src/lib/locales/<lang>.json`:
```json
{
  "board": {
    "create": "Create Board",
    "delete": "Delete Board",
    "confirmDelete": "Are you sure?"
  }
}
```

2. Use in components:
```typescript
import { t } from '$lib/i18n';

// In templates
{$t('board.create')}
{$t('board.confirmDelete')}
```

**Note**: AI translation script in `scripts/` folder (work in progress)

## Key Features

- **Kanban Board**: Drag-and-drop with @dnd-kit
- **Rich Tasks**: Priority levels, due dates, descriptions with markdown
- **File Attachments**: Upload and attach files to tasks
- **Dark Mode**: User preference
- **Optimistic Updates**: Instant UI feedback
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript + GraphQL codegen
- **Comprehensive Testing**: Unit, component, and E2E tests

## Critical Rules

### 1. Testing (ABSOLUTE REQUIREMENT)
```typescript
// ALWAYS write tests for new code
// Run npm run check before finalizing
// Run npm test to verify all tests pass
// Document test coverage in task files
```

### 2. Browser Safety
```typescript
// ALWAYS check before browser APIs
if (!browser) return;

// Examples
if (browser) {
  localStorage.setItem('key', 'value');
  window.addEventListener('resize', handler);
}
```

### 3. GraphQL Operations
- Use `request()` from `client.ts` exclusively
- Add all queries/mutations to `documents.ts`
- Run `npm run generate` after schema changes
- Import and use generated types

### 4. State Management
- Follow factory pattern for all stores
- Use single `$state` object
- Expose via getters
- Check `states.svelte.ts` for global state

### 5. Mutations
- ALWAYS use optimistic update pattern
- Store original for rollback
- Return consistent result objects
- Handle both API and network errors

### 6. Security
- Never store sensitive data in localStorage
- Database is single source of truth
- Use JWT tokens for API authentication
- Validate all user inputs with Zod

### 7. User Feedback
- Use `displayMessage()` for all user-facing feedback
- Set appropriate durations
- Provide actionable error messages

## Development Commands

```bash
# Development
npm run dev              # Start dev server with --open
npm run dev -- --open    # Explicit open browser

# Code Quality
npm run check            # Type checking (MANDATORY before finalizing)
npm run test             # Run all tests (MANDATORY before finalizing)
npm run generate         # Generate GraphQL types

# Backend (in hasura/ directory)
docker-compose up -d                    # Start Hasura
hasura migrate apply --all-databases    # Apply migrations
hasura metadata apply                   # Apply metadata
hasura seed apply                       # Load test data
hasura console                          # Open Hasura Console

# Clean Install
npm run cu               # Unix-like systems
npm run cw               # Windows
```

## Test Credentials

**Development only** (NODE_ENV=development):
- Email: `test@test.com`
- Access: `/auth/signin` (Auth.js built-in page)
- **Delete in production**

## File Organization Principles

- **GraphQL**: Keep all operations in `documents.ts` for codegen
- **Components**: Feature-based (`todo/`, `listBoard/`) + shared `ui/`
- **Stores**: One per feature, factory pattern
- **Types**: Generated in `graphql/generated.ts`, don't edit manually
- **Locales**: JSON files in `lib/locales/`
- **Tests**: Co-locate with source files or in `tests/` directory
- **Tasks**: Document everything in `todo/` folder

## Common Patterns

### Creating a New Store
1. Create `src/lib/stores/featureStore.svelte.ts`
2. Follow factory pattern with `$state`, actions, derived, getters
3. Add browser guards to all actions
4. Implement optimistic updates for mutations
5. Use `displayMessage()` for user feedback
6. **WRITE TESTS**: Create `featureStore.test.ts` with comprehensive coverage

### Adding a GraphQL Operation
1. Add to `src/lib/graphql/documents.ts`
2. Run `npm run generate`
3. Import generated types
4. Use `request()` in store actions
5. **WRITE TESTS**: Mock GraphQL responses and test error handling

### Adding a Component
1. Place in appropriate directory (`todo/`, `listBoard/`, `ui/`)
2. Import from stores for state
3. Use `$t()` for translatable text
4. Follow Tailwind utility classes (no custom CSS compilation)
5. **WRITE TESTS**: Create `Component.test.ts` for rendering and interactions

### Starting a New Task
1. Create task file in `todo/` folder
2. Document original requirement at top
3. Plan implementation approach
4. Implement with console.logs for debugging
5. **WRITE COMPREHENSIVE TESTS**
6. Run `npm run check` and `npm test`
7. Remove debugging code
8. Document results and test coverage

## Performance Considerations

- **Optimistic Updates**: Provide instant feedback
- **PostgreSQL Functions**: Business logic at DB level for speed
- **Derived State**: Use `$derived` for computed values
- **Lazy Loading**: Import components dynamically when needed

## Security Notes

- JWT tokens for API authentication (supports static adapter)
- Hasura permissions at GraphQL layer
- Server-side validation with Zod
- Never expose sensitive data in localStorage
- Test credentials only in development mode

---

## Summary of Key Changes for Claude Code Usage

1. **MANDATORY TESTING**: All code changes REQUIRE tests before finalization
2. **Git Worktrees**: Use for parallel development in multiple terminals
3. **Plan Mode**: Use for complex changes and code exploration
4. **Multi-Agent Patterns**: Developer + Tester or Developer + Reviewer
5. **Task Documentation**: Always update todo/ folder with test results
6. **Quality Gates**: `npm run check` and `npm test` must pass