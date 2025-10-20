# Project Context - Kanban Todo App

## MCP Servers (Pre-configured)

### Verify MCP Configuration
```bash
claude mcp list

# Should show (✓ Connected):
# - playwright
# - sequential-thinking
# - filesystem (optional but recommended)
# - context7 (optional)
```

If any are missing, see setup instructions in README.md.

### MCP Usage
- **Playwright**: Browser testing, console logs, UI snapshots
- **Sequential Thinking**: Complex planning, architecture decisions
- **Filesystem**: Bulk file operations (optional)

---

## Tech Stack

**Frontend**: Svelte 5, SvelteKit, TypeScript, Tailwind, shadcn-svelte, Neodrag  
**Backend**: Hasura GraphQL, PostgreSQL, Auth.js  
**Testing**: Playwright (E2E), Vitest (unit/component)

---

## Development Workflow

### 1. Plan
- Create task file in `todo/` with original requirement at top
- Use Sequential Thinking MCP for complex features
- Read relevant files for context

### 2. Implement
- Add structured console.logs: `console.log('[Component.method]', data)`
- Follow store factory pattern
- Use optimistic updates for mutations

### 3. Verify
- **Playwright MCP**: Test in browser, capture console logs
- **Hasura Console**: Verify database changes (see below)
- Check terminal output

### 4. Test (MANDATORY)
- Write unit tests for stores
- Write component tests for UI
- Write E2E tests with Playwright
- Run `npm run check` (must pass)
- Run `npm test` (must pass)

### 5. Clean Up
- Remove/comment debug logs
- Use `loggingStore` for production logs
- Update task file with results

---

## Hasura Database Verification

### Access Hasura Console
```bash
cd hasura
hasura console
# Opens browser at http://localhost:9695
```

### Console Features
- **Data Tab**: Browse tables, run SQL queries, check schema
- **API Tab**: Test GraphQL queries/mutations
- **Events Tab**: Verify triggers and event handlers

### Common Hasura CLI Commands
```bash
cd hasura

# Apply metadata changes
hasura metadata apply

# Apply migrations
hasura migrate apply --all-databases

# Create new migration
hasura migrate create "migration_name" --from-server

# Reload metadata
hasura metadata reload

# Check status
hasura migrate status
```

### Verify Database Changes
```graphql
# In Hasura Console API Explorer
query VerifyData {
  todos(limit: 5, order_by: { created_at: desc }) {
    id
    title
    list_id
    order
  }
  boards { id name alias }
}
```

---

## Store Pattern (CRITICAL)

```typescript
import { browser } from '$app/environment';

function createStore() {
  const state = $state({
    items: [],
    loading: false,
    error: null
  });

  async function loadItems() {
    if (!browser) return;
    state.loading = true;
    state.error = null;
    try {
      const data = await request(GET_ITEMS, {});
      state.items = data.items || [];
    } catch (error) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  }

  const sorted = $derived([...state.items].sort((a, b) => a.order - b.order));

  return {
    get items() { return state.items; },
    get loading() { return state.loading; },
    get error() { return state.error; },
    get sorted() { return sorted; },
    loadItems
  };
}

export const store = createStore();
```

**Rules**:
- Single `$state` object
- Browser guard: `if (!browser) return;`
- Loading in `finally` block
- Getters prevent external mutation
- Return `{ success, message, data? }`

---

## Optimistic Updates

```typescript
async function updateItem(id, updates) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx === -1) return { success: false, message: 'Not found' };
  
  const original = { ...state.items[idx] };
  state.items[idx] = { ...original, ...updates }; // Optimistic
  
  try {
    const data = await request(UPDATE_ITEM, { id, updates });
    const updated = data.update_items?.returning?.[0];
    if (!updated) throw new Error('Update failed');
    
    state.items[idx] = updated; // Server data
    return { success: true, message: 'Updated', data: updated };
  } catch (error) {
    state.items[idx] = original; // Rollback
    return { success: false, message: error.message };
  }
}
```

---

## GraphQL Workflow

1. Add query/mutation to `src/lib/graphql/documents.ts`
2. Run `npm run generate`
3. Import types from `src/lib/graphql/generated.ts`
4. Use `request()` from `src/lib/graphql/client.ts`
5. Verify in Hasura Console

```typescript
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated';

const data: GetBoardsQuery = await request(GET_BOARDS, { user_id });
```

---

## Logging

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// Production logs (persisted to DB)
loggingStore.error('Component', 'Error msg', { error });
loggingStore.warn('Component', 'Warning', { context });
loggingStore.info('Component', 'Info', { data });

// Dev only (not persisted)
loggingStore.debug('Component', 'Debug', { data });
```

**Auto-redacts**: passwords, tokens, API keys  
**View logs**: `/[lang]/logs`

---

## User Feedback

```typescript
import { displayMessage } from '$lib/stores/errorSuccess.svelte';

displayMessage('Error occurred'); // Error, 7s
displayMessage('Success!', 1500, true); // Success, 1.5s
```

---

## Directory Structure

```
src/
├── routes/[lang]/      # Language-based routing
├── lib/
│   ├── components/
│   │   ├── todo/       # Todo components
│   │   ├── listBoard/  # Board/list components
│   │   └── ui/         # Shared UI (shadcn)
│   ├── stores/         # State (factory pattern)
│   ├── graphql/
│   │   ├── client.ts
│   │   ├── documents.ts  # ALL queries/mutations
│   │   └── generated.ts  # Auto-generated types
│   └── locales/        # i18n translations
hasura/
├── metadata/           # GraphQL schema, permissions
├── migrations/         # DB migrations
└── seeds/              # Test data
tests/
├── e2e/                # Playwright E2E
└── unit/               # Unit tests
todo/                   # Task docs (ALWAYS update)
```

---

## Common Commands

```bash
# Dev
npm run dev

# Quality
npm run check          # MANDATORY before finalize
npm test               # MANDATORY before finalize
npm run generate       # After GraphQL changes

# Hasura (from hasura/ directory)
hasura console         # Open console
hasura metadata apply
hasura migrate apply --all-databases
hasura migrate create "name" --from-server
```

---

## Critical Rules

### Browser Safety
```typescript
if (!browser) return; // ALWAYS check first
if (browser) localStorage.setItem('key', 'value');
```

### Testing (MANDATORY)
- Write tests for all new code
- Use Playwright MCP for browser verification
- Use Hasura Console for DB verification
- Must pass: `npm run check` && `npm test`

### Security
- Never store sensitive data in localStorage
- Database is single source of truth
- JWT tokens for API auth
- Validate inputs with Zod

### GraphQL
- All operations in `documents.ts`
- Run `npm run generate` after changes
- Use `request()` exclusively
- Import generated types

### State Management
- Factory pattern for stores
- Single `$state` object
- Expose via getters
- Check `states.svelte.ts` for global state

---

## Task Documentation Template

```markdown
# Task Name

## Original Requirement
[User's request - NEVER REMOVE]

## Analysis
- Affected files: [list]
- MCP needed: [playwright/sequential-thinking/filesystem]

## Implementation Plan
1. [Steps with file refs]
2. [Testing strategy]
3. [Verification approach]

## Changes
- `file.ts`: [description]

## Verification
- [ ] Playwright MCP: Browser tested, console verified
- [ ] Hasura Console: DB changes verified
- [ ] Tests written and passing
- [ ] `npm run check` passed
- [ ] `npm test` passed

## Test Coverage
- Store: X% line coverage
- Component: X% line coverage
- E2E: X workflows covered

## Results
- What works: [list]
- Known issues: [list]
- MCP tools used: [list]
```

---

## MCP Verification Workflow

```bash
# 1. Plan
"Use sequential thinking to plan [feature]"

# 2. Implement
# (write code with console.logs)

# 3. Verify
"Use Playwright to test at localhost:5173, capture console"
# Then: cd hasura && hasura console
# Verify DB in Data tab

# 4. Test
# (write unit/component/E2E tests)

# 5. Quality check
npm run check && npm test

# 6. Clean up and document
```

---

## Multi-Terminal Development

### Git Worktrees (Recommended)
```bash
git worktree add ../feature-branch feature-name
cd ../feature-branch
claude
```

### Patterns
- **Dev + Tester**: Terminal 1 codes, Terminal 2 writes tests
- **Dev + Reviewer**: Terminal 1 codes, Terminal 2 reviews
- **Parallel Features**: Each terminal on different feature branch

---

## Key Features

- Kanban board with drag-and-drop
- Rich tasks (priority, dates, markdown)
- File attachments
- Dark mode
- Optimistic updates
- Responsive design
- Type safety (TypeScript + GraphQL codegen)
- Production logging with DB persistence
- Comprehensive testing

---

## Test Credentials

**Dev only** (works only when .env='testing'):
- Email: `test@test.com`
- Access: `/auth/signin`
- Once clicked "Sign in with Test Login" you will be redirected to `/` where is normal signin page. You can now manually navigate to `/et/test/tests-board` and you're authenticated as a test user. 

---

## Performance Tips

- Optimistic updates for instant feedback
- PostgreSQL functions for business logic
- `$derived` for computed values
- Lazy load components when needed

---

## Common Patterns

### New Store
1. Create `src/lib/stores/feature.svelte.ts`
2. Follow factory pattern
3. Add browser guards
4. Implement optimistic updates
5. Write tests
6. Verify with Hasura Console

### New GraphQL Operation
1. Add to `documents.ts`
2. Run `npm run generate`
3. Import types
4. Use `request()`
5. Verify in Hasura Console

### New Component
1. Place in `src/lib/components` folder in `todo/`, `listBoard/`, `auth`, `editor`, `github`, `settings` or `ui/` folder wherever appropriate or create a new. Also in `src/lib/components` some common components.
2. Import stores for state and we prefer to do most of the DB operations in stores.
3. Use `$t()` for i18n
4. Tailwind utilities only
5. Write tests
6. Verify with Playwright MCP

---

## Summary

**Must Do**:
1. ✅ Configure MCP servers (playwright, sequential-thinking)
2. ✅ Write tests for all code
3. ✅ Verify with Playwright MCP + Hasura Console
4. ✅ Run `npm run check` && `npm test` before finalizing
5. ✅ Document in task files

**Never Do**:
- ❌ Skip browser guards
- ❌ Forget optimistic updates
- ❌ Store sensitive data in localStorage
- ❌ Skip testing
- ❌ Forget to verify database changes

# General instructions

### File Structure
- Keep individual component files between 200-300 lines max
- Extract repetitive code patterns into separate, reusable components
- Create dedicated components for distinct UI/functionality blocks
- Separate business logic, utilities, and data fetching into dedicated files

### Bundle Optimization
- Use server load functions (+page.server.ts) for heavy dependencies (date libraries, markdown parsers, etc.) — they won't ship to client
- Use dynamic imports for components below the fold: `const Component = await import('./Heavy.svelte')`
- Maintain tree-shaking compatibility using ES module imports
- Prefer lightweight alternatives to large libraries

### Performance Monitoring
- Install and configure rollup-plugin-visualizer to analyze bundle composition
- Review stats during development when adding new dependencies

Do not run any commands that will change the formatting in all of the files, such as `prettier --write .`
