# Project Context

## MCP (Model Context Protocol) MANDATORY SETUP

**CRITICAL: Claude Code MUST have MCP servers configured before starting work!**

### One-Time Setup Instructions (Do This NOW)

MCP servers connect Claude Code to external tools and services, transforming it from a conversational AI into a powerful development environment. Complete this setup once:

#### 1. Essential MCP Servers for This Project

```bash
# MANDATORY: Playwright for browser console access and E2E testing
claude mcp add playwright -- npx @playwright/mcp@latest

# MANDATORY: Sequential Thinking for complex problem solving
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# MANDATORY: PostgreSQL for database operations (Hasura backend)
claude mcp add postgres -e POSTGRES_CONNECTION_STRING="postgresql://user:pass@localhost:5432/kanban_db" -- npx -y @modelcontextprotocol/server-postgres

# HIGHLY RECOMMENDED: Filesystem for direct file operations
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/your/project

# RECOMMENDED: GitHub for version control operations
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
# You'll be prompted for GitHub token

# OPTIONAL: Context7 for latest framework documentation
claude mcp add --transport http context7 https://mcp.context7.com/mcp
# You'll be prompted for API key
```

**For Windows Users**, add `cmd -- /c` before npx commands:
```bash
claude mcp add playwright -- cmd /c npx @playwright/mcp@latest
claude mcp add sequential-thinking -- cmd /c npx -y @modelcontextprotocol/server-sequential-thinking
```

#### 2. Verify Installation

```bash
# List all configured MCP servers
claude mcp list

# Should show: playwright, sequential-thinking, postgres, filesystem, github, context7
```

#### 3. Project-Specific Configuration

Create `.mcp.json` in project root (this gets committed to git for team sharing):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${PROJECT_ROOT}"]
    }
  }
}
```

Then create `.env` file (NOT committed) with sensitive values:
```env
POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/kanban_db
PROJECT_ROOT=/absolute/path/to/kanban-todo
```

### MCP Usage in Development Workflow

#### Using Playwright MCP for Browser Debugging

```typescript
// In your prompts to Claude, you can now say:
"Use Playwright to navigate to http://localhost:5173 and check the browser console for errors"
"Use Playwright to test the drag-and-drop functionality and capture console logs"
"Use Playwright to take a snapshot of the todo board and verify layout"
```

**Available Playwright MCP Tools:**
- `browser_navigate`: Open pages in browser
- `browser_console_messages`: Read console logs in real-time
- `browser_snapshot`: Capture page state as accessibility tree
- `browser_execute`: Run JavaScript in browser context

#### Using Sequential Thinking for Complex Tasks

```typescript
// For complex features or debugging, instruct Claude:
"Use sequential thinking to analyze the best approach for implementing real-time collaboration"
"Think through this bug step-by-step using sequential thinking"
"Use sequential thinking to evaluate different state management approaches"
```

#### Using PostgreSQL MCP for Database Operations

```typescript
// Direct database access for debugging and analysis:
"Use the postgres MCP to check the schema of the todos table"
"Query the database to show all boards for user_id X"
"Use postgres to verify the trigger function is working correctly"
```

#### Using Context7 for Latest Documentation

```typescript
// When working with frameworks:
"Use context7 to get the latest SvelteKit documentation on form actions"
"Check context7 for current best practices with Svelte 5 runes"
```

---

## Overview
Modern Kanban ToDo application with drag-and-drop functionality, rich task management, file attachments, and real-time optimistic updates. Built as a monorepo with SvelteKit frontend and Hasura backend.

## MANDATORY TESTING & DEBUGGING REQUIREMENTS

**CRITICAL: Claude Code MUST always write tests AND verify functionality before finalizing!**

### Development Workflow (NEVER SKIP THESE)

1. **Plan & Understand**
   - Read relevant files to understand context
   - **Use Sequential Thinking MCP** for complex features
   - Create task file in `todo/` folder with original requirement at top
   - Document implementation plan

2. **Implement with Debug Logging**
   - Add structured console.logs during development
   - Use consistent prefixes for easy filtering
   - Log function entry/exit, state changes, API responses
   
3. **Verify Functionality Using MCP Tools**
   - **Use Playwright MCP to test in browser** - navigate to dev server
   - **Capture browser console logs** using `browser_console_messages`
   - **Take snapshots** of UI state for verification
   - For server-side code, check terminal output
   - For database changes, **use Postgres MCP** to verify

4. **Write Comprehensive Tests**
   - Unit tests for stores/utilities
   - Component tests for UI
   - **E2E tests using Playwright** (MCP-enhanced)
   - Mock external dependencies (API, localStorage)

5. **Quality Gates**
   - Run `npm run check` - MUST pass (no type errors)
   - Run `npm test` - MUST pass (all tests green)
   - **Use Playwright MCP to verify E2E scenarios**
   - Verify test coverage is adequate

6. **Clean Up**
   - Remove most of the logs and comment out most important debug console.logs for future easy debugging
   - Keep only production-relevant logging (use `loggingStore`)
   - Remove temporary code/comments
   - Final code review

7. **Document**
   - Update task file with test results
   - Document test coverage percentage
   - Note MCP tools used for verification
   - Note any known limitations

### Debug Logging Standards

#### During Development: Use Structured Console Logs

```typescript
// ✅ GOOD: Structured debug logging
console.log('[BoardStore.loadBoards] Starting load, userId:', userId);
console.log('[BoardStore.loadBoards] API Response:', { count: data.boards.length });
console.log('[BoardStore.loadBoards] Selected board:', state.selectedBoard?.name);

// ✅ GOOD: Function entry/exit tracking
console.log('[updateTodo] ENTRY', { todoId, updates });
// ... logic ...
console.log('[updateTodo] EXIT', { success, updatedTodo });

// ✅ GOOD: State change tracking
console.log('[DragHandler] Before:', { sourceList, targetList });
state.lists = newLists;
console.log('[DragHandler] After:', { updatedLists: newLists.length });

// ❌ BAD: Unclear context
console.log('loading...'); // What is loading?
console.log(data); // Where is this from?
console.log('error'); // What error? Where?
```

**MCP-Enhanced Debugging:**
```typescript
// Tell Claude to use Playwright MCP:
"Use Playwright to open http://localhost:5173/en/test-user/my-board and check the console for these logs"
"Capture browser console messages while I test the drag-and-drop feature"
```

#### Naming Convention for Debug Logs

```typescript
// Format: [ComponentName.methodName] or [StoreName.action]
console.log('[TodoCard.handleDelete] Confirming deletion', { todoId });
console.log('[todoStore.deleteTodo] Optimistic update applied');
console.log('[DragDrop.onDragEnd] Processing drop', { source, destination });
```

#### What to Log During Development

**DO Log:**
- Function entry/exit with parameters
- API request/response data
- State changes (before/after)
- Conditional branch taken
- Error details with context
- Derived state calculations

**DON'T Log:**
- Sensitive data (passwords, tokens, PII)
- Large objects (>100 lines) - log summaries instead
- Inside loops (causes console spam)
- Redundant information

#### Production Logging: Use loggingStore

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// ALWAYS use loggingStore for production-relevant logs
loggingStore.error('ComponentName', 'Error description', { error: errorObject });
loggingStore.warn('ComponentName', 'Warning description', { context: 'data' });
loggingStore.info('UserStore', 'User logged in', { userId: user.id });

// Debug logs (dev only, not persisted)
loggingStore.debug('ComponentName', 'Debug info', { data: debugData });
```

### Testing Requirements

#### 1. Unit Tests for Stores
```typescript
// src/lib/stores/boardStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { boardStore } from './boardStore.svelte';

describe('boardStore', () => {
  beforeEach(() => {
    // Reset state or mock dependencies
  });

  it('should load boards successfully', async () => {
    const result = await boardStore.loadBoards('user-123');
    expect(result.success).toBe(true);
    expect(boardStore.boards.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API to throw error
    const result = await boardStore.loadBoards('invalid-user');
    expect(result.success).toBe(false);
    expect(boardStore.error).toBeTruthy();
  });

  it('should perform optimistic updates correctly', async () => {
    const original = boardStore.boards[0];
    const updates = { name: 'Updated Name' };
    
    const result = await boardStore.updateBoard(original.id, updates);
    
    expect(boardStore.boards[0].name).toBe('Updated Name');
    expect(result.success).toBe(true);
  });

  it('should rollback on failed optimistic update', async () => {
    const original = boardStore.boards[0];
    // Mock API to fail
    
    await boardStore.updateBoard(original.id, { name: 'New Name' });
    
    expect(boardStore.boards[0].name).toBe(original.name); // Rolled back
  });
});
```

#### 2. Component Tests
```typescript
// src/lib/components/todo/TodoCard.test.ts
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import TodoCard from './TodoCard.svelte';

describe('TodoCard', () => {
  const mockTodo = {
    id: '1',
    title: 'Test Todo',
    description: 'Description',
    priority: 'high'
  };

  it('should render todo correctly', () => {
    const { getByText } = render(TodoCard, { props: { todo: mockTodo } });
    expect(getByText('Test Todo')).toBeInTheDocument();
  });

  it('should handle edit action', async () => {
    const onEdit = vi.fn();
    const { getByRole } = render(TodoCard, { 
      props: { todo: mockTodo, onEdit } 
    });
    
    const editButton = getByRole('button', { name: /edit/i });
    await fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('should show priority indicator', () => {
    const { container } = render(TodoCard, { props: { todo: mockTodo } });
    const priorityBadge = container.querySelector('[data-priority="high"]');
    expect(priorityBadge).toBeInTheDocument();
  });
});
```

#### 3. E2E Tests with Playwright (MCP-Enhanced)
```typescript
// tests/e2e/todo-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Todo Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/test-user/my-board');
  });

  test('should create, edit, and delete todo', async ({ page }) => {
    // Create todo
    await page.click('button:has-text("New Todo")');
    await page.fill('input[name="title"]', 'E2E Test Todo');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.click('button:has-text("Save")');
    
    // Verify created
    await expect(page.locator('text=E2E Test Todo')).toBeVisible();
    
    // Edit todo
    await page.click('[data-todo-id="1"] button[aria-label="Edit"]');
    await page.fill('input[name="title"]', 'Updated Todo');
    await page.click('button:has-text("Save")');
    
    // Verify updated
    await expect(page.locator('text=Updated Todo')).toBeVisible();
    
    // Delete todo
    await page.click('[data-todo-id="1"] button[aria-label="Delete"]');
    await page.click('button:has-text("Confirm")');
    
    // Verify deleted
    await expect(page.locator('text=Updated Todo')).not.toBeVisible();
  });

  test('should handle drag and drop', async ({ page }) => {
    const source = page.locator('[data-todo-id="1"]');
    const target = page.locator('[data-list-id="done"]');
    
    await source.dragTo(target);
    
    // Verify todo moved to new list
    await expect(target.locator('text=Todo Title')).toBeVisible();
  });
});
```

**MCP-Enhanced E2E Testing:**
```typescript
// During development, Claude can use Playwright MCP to:
// 1. Navigate to the app
// 2. Capture console logs during test execution
// 3. Take snapshots at key points
// 4. Debug failures by inspecting browser state

// Example prompt:
"Use Playwright MCP to test the todo workflow and capture console logs at each step"
```

### Test Coverage Requirements

**Minimum Coverage Targets:**
- **Stores**: 80% line coverage, 100% of actions tested
- **Components**: 70% line coverage, all user interactions tested
- **E2E**: All critical user workflows covered

**What to Test:**
- ✅ Happy path (success scenarios)
- ✅ Error handling (API failures, network errors)
- ✅ Edge cases (empty states, boundary conditions)
- ✅ Optimistic updates and rollbacks
- ✅ User interactions (clicks, inputs, drag-drop)
- ✅ Conditional rendering
- ✅ Derived state calculations

**What NOT to Test:**
- ❌ Third-party library internals
- ❌ Simple getters with no logic
- ❌ CSS/styling (unless functional requirement)

### Task Documentation Template

Every task file in `/todo/` folder MUST follow this structure:

```markdown
# [Task Name]

## Original Requirement
[User's original request - KEEP AT TOP - NEVER REMOVE]

## Analysis
- Affected files: [list]
- Dependencies: [list]
- Potential risks: [list]
- MCP servers needed: [playwright, postgres, sequential-thinking, etc.]

## Implementation Plan
1. [Step 1 with file references]
2. [Step 2 with file references]
3. [Testing strategy]
4. [MCP verification approach]

## Implementation Details
### Changes Made
- `src/lib/stores/feature.svelte.ts`: [description]
- `src/lib/components/Feature.svelte`: [description]

### Debug Logging Added
- [List key console.logs added for verification]

### MCP Verification Performed
- [ ] Used Playwright MCP to test in browser
- [ ] Captured browser console logs - no errors
- [ ] Used Postgres MCP to verify database changes
- [ ] Used Sequential Thinking for complex decisions

## Testing
### Manual Testing with MCP
- [ ] Playwright MCP: Tested feature in browser
- [ ] Console logs captured and verified
- [ ] UI snapshots taken at key states
- [ ] Database state verified with Postgres MCP

### Automated Tests Written
- [ ] Unit tests: `src/lib/stores/feature.test.ts`
  - ✓ Action success scenarios
  - ✓ Error handling
  - ✓ Optimistic updates
  - ✓ Rollback behavior
  
- [ ] Component tests: `src/lib/components/Feature.test.ts`
  - ✓ Rendering with props
  - ✓ User interactions
  - ✓ Edge cases
  
- [ ] E2E tests: `tests/e2e/feature-workflow.spec.ts`
  - ✓ Complete user workflow
  - ✓ Integration with backend
  - ✓ Browser console verified

### Quality Gates
- [ ] `npm run check` - passed ✓ (no type errors)
- [ ] `npm test` - passed ✓ (all tests green)
- [ ] Playwright MCP verification - passed ✓

### Test Coverage
- Store: 85% line coverage
- Component: 78% line coverage
- E2E: 3 workflows covered
- **Gaps**: [List any untested scenarios and why]

## Cleanup
- [ ] Removed debug console.logs
- [ ] Removed temporary code/comments
- [ ] Code formatted and linted
- [ ] Production logging uses `loggingStore`

## Results
### What Works
- [List successful implementations]

### Known Issues
- [List any limitations or known bugs]

### Performance Notes
- [Any performance considerations]

### MCP Tools Used
- Playwright: [what was verified]
- Postgres: [what was checked]
- Sequential Thinking: [what was analyzed]

## Next Steps
- [Future improvements or related tasks]
```

### Debugging Checklist Before Finalizing

```markdown
- [ ] Used Sequential Thinking MCP for complex planning (if needed)
- [ ] Used Playwright MCP to verify feature in browser
- [ ] Captured and verified browser console logs via MCP
- [ ] Used Postgres MCP to verify database state (if applicable)
- [ ] Console logs show expected behavior
- [ ] All console.logs are structured with [Component.method] format
- [ ] No errors in browser console
- [ ] Server logs show correct flow (if applicable)
- [ ] All tests written and passing
- [ ] Type check passes (`npm run check`)
- [ ] Test suite passes (`npm test`)
- [ ] Debug console.logs removed/commented
- [ ] Production logging uses loggingStore
- [ ] Task file updated with MCP verification results
```

---

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
- **E2E**: Playwright (with MCP integration)
- **Unit/Component**: Vitest
- **Coverage**: MANDATORY for all changes

### MCP Servers (Mandatory)
- **Playwright**: Browser automation, console access, E2E testing
- **Sequential Thinking**: Complex problem-solving and analysis
- **PostgreSQL**: Direct database access and verification
- **Filesystem**: Direct file operations
- **GitHub**: Version control operations (optional)
- **Context7**: Latest framework documentation (optional)

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
.mcp.json                 # MCP server configuration (committed)
.env                      # Environment variables (NOT committed)
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
10. **MCP Verification**: Use Postgres MCP to verify database changes after store operations

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
- **MUST verify with Postgres MCP**: Check database state after operations

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
- **MCP Verification**: Use Postgres MCP to verify database changes

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
- **Production Logging**: Comprehensive logging with DB persistence, error boundary, performance monitoring
- **Comprehensive Testing**: Unit, component, and E2E tests
- **MCP Integration**: Browser automation, database access, sequential thinking

## Critical Rules

### 1. MCP Usage (MANDATORY)
```typescript
// ALWAYS use MCP tools for verification
// Playwright MCP: Test in browser, capture console logs
// Postgres MCP: Verify database changes
// Sequential Thinking MCP: Complex problem solving
// Document MCP usage in task files
```

### 2. Testing (ABSOLUTE REQUIREMENT)
```typescript
// ALWAYS write tests for new code
// Use Playwright MCP for enhanced E2E testing
// Run npm run check before finalizing
// Run npm test to verify all tests pass
// Document test coverage in task files
```

### 3. Browser Safety
```typescript
// ALWAYS check before browser APIs
if (!browser) return;

// Examples
if (browser) {
  localStorage.setItem('key', 'value');
  window.addEventListener('resize', handler);
}
```

### 4. GraphQL Operations
- Use `request()` from `client.ts` exclusively
- Add all queries/mutations to `documents.ts`
- Run `npm run generate` after schema changes
- Import and use generated types
- Verify with Postgres MCP after mutations

### 5. State Management
- Follow factory pattern for all stores
- Use single `$state` object
- Expose via getters
- Check `states.svelte.ts` for global state
- Use Postgres MCP to verify state-database sync

### 6. Mutations
- ALWAYS use optimistic update pattern
- Store original for rollback
- Return consistent result objects
- Handle both API and network errors
- Verify with Postgres MCP

### 7. Security
- Never store sensitive data in localStorage
- Database is single source of truth
- Use JWT tokens for API authentication
- Validate all user inputs with Zod

### 8. User Feedback
- Use `displayMessage()` for all user-facing feedback
- Set appropriate durations
- Provide actionable error messages

### 9. Logging (PRODUCTION SYSTEM)
```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// ALWAYS log errors and warnings
loggingStore.error('ComponentName', 'Error description', { error: errorObject });
loggingStore.warn('ComponentName', 'Warning description', { context: 'data' });

// Log important info (auto-persisted in production)
loggingStore.info('UserStore', 'User logged in', { userId: user.id });

// Debug logging (dev only, not persisted)
loggingStore.debug('ComponentName', 'Debug info', { data: debugData });
```

**What to Log**:
- ✅ GraphQL/API errors (ALWAYS)
- ✅ Store operation failures (ALWAYS)
- ✅ Authentication failures (ALWAYS)
- ✅ Permission denied errors (ALWAYS)
- ✅ Critical user actions (login, signup)
- ❌ Passwords, tokens, API keys (AUTO-REDACTED)
- ❌ Large payloads >1KB
- ❌ High-frequency events

**Features**:
- Auto-persistence to PostgreSQL for ERROR/WARN
- Privacy-safe (auto-redacts sensitive fields)
- Circular reference safe (handles Error objects)
- Performance monitoring (`measureAsync`, `measureSync`)
- Rate limiting (100 logs/component/minute)
- Intelligent sampling in production (10% INFO logs)
- Retry logic for failed writes

**View Logs**: `/[lang]/logs` - filter, search, export

## Development Commands

```bash
# Development
npm run dev              # Start dev server with --open
npm run dev -- --open    # Explicit open browser

# Code Quality
npm run check            # Type checking (MANDATORY before finalizing)
npm run test             # Run all tests (MANDATORY before finalizing)
npm run generate         # Generate GraphQL types

# MCP Commands
claude mcp list          # List configured MCP servers
claude mcp add           # Add new MCP server
claude mcp remove        # Remove MCP server
claude mcp reset-project-choices  # Reset MCP approvals

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
- **MCP Config**: `.mcp.json` in project root (committed to git)

## Common Patterns

### Creating a New Store
1. Create `src/lib/stores/featureStore.svelte.ts`
2. Follow factory pattern with `$state`, actions, derived, getters
3. Add browser guards to all actions
4. Implement optimistic updates for mutations
5. Use `displayMessage()` for user feedback
6. **WRITE TESTS**: Create `featureStore.test.ts` with comprehensive coverage
7. **VERIFY WITH MCP**: Use Postgres MCP to check database changes

### Adding a GraphQL Operation
1. Add to `src/lib/graphql/documents.ts`
2. Run `npm run generate`
3. Import generated types
4. Use `request()` in store actions
5. **WRITE TESTS**: Mock GraphQL responses and test error handling
6. **VERIFY WITH MCP**: Use Postgres MCP to verify database state

### Adding a Component
1. Place in appropriate directory (`todo/`, `listBoard/`, `ui/`)
2. Import from stores for state
3. Use `$t()` for translatable text
4. Follow Tailwind utility classes (no custom CSS compilation)
5. **WRITE TESTS**: Create `Component.test.ts` for rendering and interactions
6. **VERIFY WITH MCP**: Use Playwright MCP to test in browser

### Starting a New Task
1. Create task file in `todo/` folder
2. Document original requirement at top
3. **Use Sequential Thinking MCP** for complex planning
4. Plan implementation approach
5. Implement with console.logs for debugging
6. **VERIFY WITH MCP**: Playwright for browser, Postgres for DB
7. **WRITE COMPREHENSIVE TESTS**
8. Run `npm run check` and `npm test`
9. Remove debugging code
10. Document results, test coverage, and MCP verification

## Performance Considerations

- **Optimistic Updates**: Provide instant feedback
- **PostgreSQL Functions**: Business logic at DB level for speed
- **Derived State**: Use `$derived` for computed values
- **Lazy Loading**: Import components dynamically when needed
- **MCP Tools**: Use Playwright MCP to measure performance

## Security Notes

- JWT tokens for API authentication (supports static adapter)
- Hasura permissions at GraphQL layer
- Server-side validation with Zod
- Never expose sensitive data in localStorage
- Test credentials only in development mode
- Use Postgres MCP in READ_ONLY mode when possible

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

# Each has its own isolated environment with MCP servers!
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
- Use with Sequential Thinking MCP for deep analysis
- You can confidently leave Claude running without worrying about unauthorized changes

**Usage:**
```bash
# Start Claude in plan mode
claude --plan

# Or prompt within Claude:
"Use plan mode to analyze how to implement feature X"
"Use sequential thinking in plan mode to evaluate architecture options"
```

### Multi-Agent Patterns

Effective approaches include having one Claude write code while another reviews or tests it, similar to working with multiple engineers.

**Common Patterns:**

1. **Developer + Reviewer Pattern:**
   - Terminal 1: Claude writes feature
   - Terminal 2: Claude reviews code quality and suggests improvements
   
2. **Developer + Tester Pattern:**
   - Terminal 1: Claude implements feature
   - Terminal 2: Claude writes comprehensive tests and uses Playwright MCP to verify
   
3. **Parallel Features Pattern:**
   - Terminal 1: Feature A development
   - Terminal 2: Feature B development
   - Terminal 3: Bug fixes
   - Each in separate worktrees/branches
   - All share same MCP servers

4. **Research + Implementation:**
   - Terminal 1: Plan mode exploration with Sequential Thinking MCP
   - Terminal 2: Active implementation

### Voice Integration (ADVANCED)

Using voice dictation tools like SuperWhisper allows natural explanation of complex features, making it easier to communicate requirements than typing.

**Benefits:**
- Faster context sharing for complex features
- Natural "brain dump" of requirements
- Works well for explaining edge cases and scenarios that would take forever to type

### Best Practices Summary

1. **MCP Servers are Essential:**
   - Configure once per project in `.mcp.json`
   - All team members share same MCP configuration
   - Use Playwright MCP for browser testing
   - Use Postgres MCP for database verification
   - Use Sequential Thinking MCP for complex planning

2. **Isolation is Key:**
   - Use git worktrees for truly independent work
   - OR use GitButler for automatic branch management
   - Never run multiple Claudes in same directory without isolation
   - Each worktree uses same MCP servers

3. **Plan Before Executing:**
   - Use plan mode for complex changes
   - Use Sequential Thinking MCP for analysis
   - Let Claude analyze before making changes
   - Review plans before accepting

4. **Resource Management:**
   - Each worktree needs its own build artifacts
   - Consider port conflicts if running dev servers
   - Use docker-compose for backend services
   - MCP servers are shared across all sessions

5. **Testing Everything:**
   - **MANDATORY**: Write tests for all changes
   - Use Playwright MCP for browser verification
   - Use Postgres MCP for database checks
   - Use separate Claude instance for test generation
   - Run `npm run check` and `npm test` before finalizing

6. **Context Management:**
   - Keep task files updated in `/todo/` folder
   - Document what each terminal/session is working on
   - Document MCP verification performed
   - Original requirements stay at top of task files

---

## Summary of Key Changes for Claude Code Usage

1. **MANDATORY MCP SETUP**: Playwright, Sequential Thinking, and Postgres MCP servers required before starting work
2. **MCP-Enhanced Workflow**: Use MCP tools for verification at every step
3. **Git Worktrees**: Use for parallel development in multiple terminals
4. **Plan Mode + Sequential Thinking**: Use for complex changes and code exploration
5. **Multi-Agent Patterns**: Developer + Tester or Developer + Reviewer
6. **Task Documentation**: Always document MCP verification performed
7. **Quality Gates**: `npm run check` and `npm test` must pass, plus MCP verification

## MCP Quick Reference

### When to Use Each MCP Server

**Playwright MCP** (MANDATORY):
- Testing features in browser
- Capturing console logs
- Taking UI snapshots
- Debugging visual issues
- Running E2E tests

**Sequential Thinking MCP** (MANDATORY):
- Complex feature planning
- Architecture decisions
- Debugging difficult issues
- Evaluating multiple approaches
- Analyzing trade-offs

**Postgres MCP** (MANDATORY):
- Verifying database changes
- Checking schema
- Debugging queries
- Validating triggers/functions
- Inspecting data state

**Filesystem MCP** (RECOMMENDED):
- Direct file operations
- Bulk file changes
- File system exploration

**GitHub MCP** (OPTIONAL):
- Creating PRs
- Managing issues
- Code reviews
- CI/CD operations

**Context7 MCP** (OPTIONAL):
- Getting latest framework docs
- Checking API changes
- Finding current best practices

### Example MCP Workflow

```bash
# 1. Plan with Sequential Thinking
"Use sequential thinking to analyze the best approach for adding real-time collaboration"

# 2. Implement with debug logging
# (write code with console.logs)

# 3. Verify with Playwright MCP
"Use Playwright to navigate to localhost:5173 and test the new feature, capture console logs"

# 4. Check database with Postgres MCP
"Use postgres MCP to verify the new collaboration_sessions table was created correctly"

# 5. Write tests
# (unit, component, E2E tests)

# 6. Final verification
npm run check
npm test

# 7. Clean up and document
# (remove console.logs, update task file)
```