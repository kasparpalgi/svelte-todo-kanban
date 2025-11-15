# CLAUDE.md - AI Assistant Development Guide

> **Purpose**: This document provides AI assistants (like Claude) with comprehensive context about this codebase, its architecture, conventions, and development workflows to ensure consistent, high-quality contributions.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Workflow](#development-workflow)
4. [Code Conventions](#code-conventions)
5. [Database & GraphQL](#database--graphql)
6. [Testing Strategy](#testing-strategy)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Name**: Svelte ToDo Kanban (ToDzz)
**Type**: Modern Kanban-style task management application
**Stack**: SvelteKit + Hasura GraphQL + PostgreSQL

### Key Features
- Drag-and-drop Kanban board with lists and cards
- Rich text editing with Tiptap (Markdown planned)
- File attachments on tasks
- Multi-user boards with role-based access (owner, editor, viewer)
- Board invitations and sharing
- Activity logging and notifications
- GitHub integration (issue sync)
- Tracker integration (time tracking)
- Dark mode and i18n support
- PWA capabilities
- Production logging system

### Technology Stack

**Frontend**:
- **Framework**: SvelteKit (SSR + client-side routing)
- **UI Library**: Svelte 5 (with runes: `$state`, `$derived`, `$effect`)
- **Styling**: TailwindCSS v4 + shadcn-svelte components
- **Rich Text**: svelte-tiptap (TipTap editor)
- **Drag & Drop**: @neodrag/svelte
- **Icons**: lucide-svelte
- **i18n**: sveltekit-i18n

**Backend**:
- **GraphQL Engine**: Hasura (auto-generates GraphQL from PostgreSQL)
- **Database**: PostgreSQL
- **Auth**: Auth.js (SvelteKit) with JWT tokens
- **Adapter**: Hasura adapter for Auth.js

**Dev Tools**:
- **TypeScript**: Full type safety
- **GraphQL Codegen**: Auto-generates TypeScript types from schema
- **Testing**: Playwright (E2E), Vitest (unit/component)
- **Linting**: ESLint + Prettier
- **Build**: Vite

---

## Architecture

### Directory Structure

```
svelte-todo-kanban/
├── src/
│   ├── routes/                      # SvelteKit routes
│   │   ├── +layout.svelte           # Root layout
│   │   ├── +layout.server.ts        # Server-side layout logic
│   │   ├── [lang]/                  # i18n language routes
│   │   │   ├── [username]/          # User-specific routes
│   │   │   │   └── [boardAlias]/    # Board routes
│   │   │   │       └── [todoAlias]/ # Todo detail routes
│   │   │   ├── logs/                # Log viewer
│   │   │   ├── settings/            # User settings
│   │   │   └── invitations/         # Board invitations
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Auth endpoints
│   │   │   ├── github/              # GitHub webhooks
│   │   │   └── upload/              # File upload
│   │   └── signin/                  # Sign-in page
│   │
│   ├── lib/
│   │   ├── components/              # Svelte components
│   │   │   ├── ui/                  # shadcn-svelte UI components
│   │   │   ├── todo/                # Todo-specific components
│   │   │   ├── listBoard/           # Board/list components
│   │   │   ├── auth/                # Auth components
│   │   │   ├── notifications/       # Notification components
│   │   │   ├── activity/            # Activity log components
│   │   │   ├── notes/               # Notes components
│   │   │   ├── editor/              # Rich text editor
│   │   │   ├── card/                # Card components
│   │   │   ├── settings/            # Settings components
│   │   │   └── github/              # GitHub integration
│   │   │
│   │   ├── stores/                  # Svelte stores (state management)
│   │   │   ├── todos.svelte.ts      # Todo state & mutations
│   │   │   ├── listsBoards.svelte.ts # Lists & boards state
│   │   │   ├── user.svelte.ts       # User state
│   │   │   ├── notifications.svelte.ts # Notifications
│   │   │   ├── activityLog.svelte.ts # Activity logs
│   │   │   ├── comments.svelte.ts   # Comments
│   │   │   ├── notes.svelte.ts      # Notes
│   │   │   ├── invitations.svelte.ts # Board invitations
│   │   │   ├── boardMembers.svelte.ts # Board members
│   │   │   ├── labels.svelte.ts     # Labels
│   │   │   ├── todoFiltering.svelte.ts # Filter state
│   │   │   ├── logging.svelte.ts    # Production logging
│   │   │   ├── trackerStats.svelte.ts # Time tracking
│   │   │   └── errorSuccess.svelte.ts # Toast notifications
│   │   │
│   │   ├── graphql/
│   │   │   ├── client.ts            # GraphQL client setup
│   │   │   ├── documents.ts         # All queries/mutations
│   │   │   └── generated/           # Auto-generated types
│   │   │       ├── graphql.ts       # TypeScript types
│   │   │       └── gql.ts           # GraphQL tag function
│   │   │
│   │   ├── server/                  # Server-side utilities
│   │   │   └── jwt.ts               # JWT utilities
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── locales/                 # i18n translations (en, et)
│   │   ├── schemas/                 # Zod validation schemas
│   │   ├── utils/                   # Utility functions
│   │   ├── config/                  # App configuration
│   │   ├── constants/               # Constants
│   │   └── i18n/                    # i18n configuration
│   │
│   ├── hooks.server.ts              # Server-side hooks (Auth.js setup)
│   ├── hooks.client.ts              # Client-side hooks
│   ├── app.html                     # HTML template
│   └── app.css                      # Global styles
│
├── hasura/
│   ├── migrations/                  # Database migrations
│   │   └── default/                 # Default database
│   ├── metadata/                    # Hasura metadata (schema, permissions)
│   │   ├── databases/               # Database configuration
│   │   │   └── default/
│   │   │       └── tables/          # Table metadata (permissions, relationships)
│   │   └── actions.yaml             # GraphQL actions
│   ├── seeds/                       # Seed data
│   ├── docker-compose.yml           # Hasura + PostgreSQL services
│   └── config.yaml                  # Hasura CLI config
│
├── e2e/                             # Playwright E2E tests
│   ├── auth.setup.ts                # Auth setup for tests
│   ├── authenticated.spec.ts        # Authenticated user tests
│   └── *.spec.ts                    # Test files
│
├── tests/                           # Vitest unit tests
│
├── static/                          # Static assets
│
├── .claude/                         # Claude Code configuration
│   ├── prompt.md                    # Custom prompt instructions
│   ├── contextFileSize.md           # Code style guidelines
│   └── todo/                        # Project tasks
│
├── package.json                     # Dependencies & scripts
├── vite.config.ts                   # Vite configuration
├── svelte.config.js                 # SvelteKit configuration
├── playwright.config.ts             # Playwright configuration
├── codegen.ts                       # GraphQL codegen configuration
├── tsconfig.json                    # TypeScript configuration
└── .env                             # Environment variables
```

### Data Flow

```
User Interaction
     ↓
Component (Svelte)
     ↓
Store Method (e.g., todosStore.addTodo())
     ↓
GraphQL Request (via request() in client.ts)
     ↓
Hasura GraphQL Engine
     ↓
PostgreSQL Database
     ↓
Response back to Store
     ↓
Reactive State Update ($state)
     ↓
UI Re-renders
```

### URL Structure

SEO-friendly URLs with auto-generated aliases:

- **Boards**: `/[lang]/[username]/[boardAlias]`
- **Todos**: `/[lang]/[username]/[boardAlias]/[todoAlias]`

**Examples**:
- `/en/john-w/work-projects`
- `/en/sarah/personal-tasks/shopping`

Aliases are auto-generated by PostgreSQL functions:
- Lowercase, hyphenated format
- Duplicate handling with numbers (`my-board`, `my-board-2`)
- **Boards**: Globally unique
- **Todos**: User-scoped unique

---

## Development Workflow

### 1. Environment Setup

**Required Files**:
- `.env` - Application secrets
- `hasura/.env` - Hasura/PostgreSQL credentials
- `.env.test` - Test environment variables

Copy from `.env.example` files and configure.

### 2. Starting Development

```bash
# Install dependencies
npm ci

# Start Hasura (in separate terminal)
cd hasura
docker-compose up -d
hasura console  # Opens at http://localhost:9695

# Start dev server (in project root)
npm run dev     # Opens at http://localhost:5173
```

### 3. Making Changes

#### Adding/Modifying Database Schema

1. **Use Hasura Console** (recommended):
   ```bash
   cd hasura
   hasura console
   ```
   - Make changes via UI (Data tab)
   - Migrations auto-generated

2. **Manual Migration**:
   ```bash
   cd hasura
   hasura migrate create "migration_name" --from-server
   ```

3. **Apply Migrations**:
   ```bash
   hasura migrate apply --all-databases
   hasura metadata apply
   ```

#### Adding GraphQL Queries/Mutations

1. Add to `src/lib/graphql/documents.ts`:
   ```typescript
   export const GET_TODOS = graphql(`
     query GetTodos($where: todos_bool_exp) {
       todos(where: $where) {
         ...TodoFields
       }
     }
   `);
   ```

2. Generate TypeScript types:
   ```bash
   npm run generate
   ```
   This runs GraphQL Codegen and creates types in `src/lib/graphql/generated/`

3. Use in store:
   ```typescript
   import { request } from '$lib/graphql/client';
   import { GET_TODOS } from '$lib/graphql/documents';
   import type { GetTodosQuery } from '$lib/graphql/generated';

   const data: GetTodosQuery = await request(GET_TODOS, { where: {} });
   ```

#### Creating/Modifying Stores

**Store Pattern** (see `src/lib/stores/*.svelte.ts`):

```typescript
import { browser } from '$app/environment';

function createMyStore() {
  // Single $state object for all reactive state
  const state = $state({
    items: [],
    loading: false,
    error: null
  });

  // Always check browser before API calls
  async function loadItems() {
    if (!browser) return;

    state.loading = true;
    state.error = null;

    try {
      const data = await request(GET_ITEMS, {});
      state.items = data.items || [];
    } catch (error) {
      state.error = error.message;
      console.error('Load items error:', error);
    } finally {
      state.loading = false;
    }
  }

  // Mutations return { success, message, data? }
  async function addItem(name: string) {
    if (!browser) return { success: false, message: 'Not in browser' };

    try {
      const result = await request(CREATE_ITEM, { name });

      // Optimistic update
      state.items = [...state.items, result.item];

      return { success: true, message: 'Item added' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  return {
    // Expose as getters
    get items() { return state.items; },
    get loading() { return state.loading; },
    get error() { return state.error; },

    // Methods
    loadItems,
    addItem
  };
}

export const myStore = createMyStore();
```

**Key Rules**:
- Single `$state` object for all reactive state
- Always check `if (!browser)` before browser APIs
- Use `try/catch/finally` for error handling
- Return `{ success, message, data? }` from mutations
- Use optimistic updates for instant UI feedback
- Export as singleton instance

#### Creating Components

**Component Guidelines**:

1. **File Size**: Keep files under 200-300 lines
2. **Extract Logic**: Move complex logic to stores
3. **Props**: Use TypeScript interfaces
4. **Reactivity**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
5. **Accessibility**: Follow WCAG guidelines

**Example**:

```svelte
<script lang="ts">
  import { todosStore } from '$lib/stores/todos.svelte';

  interface Props {
    todoId: string;
  }

  let { todoId }: Props = $props();

  // Derived state
  const todo = $derived(
    todosStore.todos.find(t => t.id === todoId)
  );

  // Side effect
  $effect(() => {
    if (!todo) {
      todosStore.loadTodos();
    }
  });
</script>

{#if todo}
  <div>{todo.title}</div>
{/if}
```

### 4. Testing

**Before Committing**:
```bash
npm run check  # Type checking (MUST PASS)
npm test       # All tests (MUST PASS)
```

**Test Types**:

1. **Unit/Component Tests** (Vitest):
   ```bash
   npm run test:unit        # Run unit tests
   npm run test:unit:ui     # Run with UI
   ```
   - Location: `src/**/*.{test,spec}.ts`
   - Component tests: `src/**/*.svelte.{test,spec}.ts`

2. **E2E Tests** (Playwright):
   ```bash
   npm run test:e2e         # Run E2E tests
   npm run test:e2e:ui      # Run with UI
   npm run test:h           # Run headed (visible browser)
   ```
   - Location: `e2e/*.spec.ts`
   - Authenticated tests use `playwright/.auth/user.json`

### 5. Committing Changes

**Commit Message Format**:
```
type: Short description

Longer description explaining:
- What changed
- Why it changed
- Any breaking changes

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

### 6. Logging

**Production Logging** (persisted to database):

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// Error (critical issues)
loggingStore.error('ComponentName', 'Error message', {
  error,
  context: 'additional context'
});

// Warning (important but non-critical)
loggingStore.warn('ComponentName', 'Warning message', {
  data: 'relevant data'
});

// Info (informational)
loggingStore.info('ComponentName', 'Info message', {
  action: 'user action'
});

// Debug (development only, NOT persisted)
loggingStore.debug('ComponentName', 'Debug message', {
  debugData: 'debug info'
});
```

**View Logs**: Navigate to `/[lang]/logs`

---

## Code Conventions

### TypeScript

- **Strict Mode**: Enabled
- **File Comments**: Add `/** @file path/to/file.ts */` at top
- **Type Imports**: Use `import type { ... }`
- **Null Safety**: Handle null/undefined explicitly

### Svelte 5 Runes

**Use Modern Svelte 5 Syntax**:

```typescript
// State
let count = $state(0);
let user = $state({ name: 'John', age: 30 });

// Derived state
const doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log(`Count is ${count}`);
});

// Props
let { title, description = 'Default' }: Props = $props();
```

**Avoid Legacy Syntax**:
- ❌ `let count = 0;` with `$:` reactive statements
- ❌ `export let prop;`
- ✅ Use runes instead

### File Naming

- **Components**: PascalCase (`TodoCard.svelte`)
- **Stores**: camelCase with `.svelte.ts` (`todos.svelte.ts`)
- **Utils**: camelCase (`.ts`)
- **Routes**: kebab-case or `[param]` syntax

### Imports

**Order**:
1. External packages
2. SvelteKit imports (`$app`, `$env`)
3. Internal imports (`$lib`)
4. Relative imports (`./`, `../`)

**Example**:
```typescript
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

import { request } from '$lib/graphql/client';
import { GET_TODOS } from '$lib/graphql/documents';
import type { GetTodosQuery } from '$lib/graphql/generated';

import type { TodosState } from './types';
```

### Error Handling

**Always Handle Errors**:

```typescript
try {
  const data = await request(QUERY, variables);
  // Success path
} catch (error) {
  // User-friendly error message
  let message = 'Something went wrong';

  if (error instanceof Error) {
    if (error.message.includes('Not authenticated')) {
      message = 'Please sign in';
    } else if (error.message.includes('access-denied')) {
      message = 'Access denied';
    } else {
      message = error.message;
    }
  }

  // Log error
  console.error('Operation failed:', error);

  // Update state
  state.error = message;

  // Optional: Show toast
  errorSuccessStore.showError(message);
}
```

### Styling

- **TailwindCSS**: Use utility classes
- **Component Variants**: Use `tailwind-variants` or `clsx`
- **Dark Mode**: Use Tailwind's dark mode classes
- **Responsive**: Mobile-first approach

**Example**:
```svelte
<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
  <h2 class="text-lg font-semibold">Title</h2>
</div>
```

---

## Database & GraphQL

### Database Schema

**Core Tables**:

- **users**: User accounts (managed by Auth.js)
  - id, name, username, email, image

- **boards**: Kanban boards
  - id, name, alias, user_id, sort_order, settings, github

- **lists**: Columns within boards
  - id, name, board_id, sort_order

- **todos**: Individual tasks
  - id, title, content, list_id, assigned_to
  - due_on, has_time, priority, completed_at
  - sort_order, min_hours, max_hours, actual_hours
  - github_issue_number, github_issue_id, github_synced_at

- **comments**: Comments on todos
  - id, todo_id, user_id, content

- **uploads**: File attachments
  - id, todo_id, url

- **labels**: Custom labels
  - id, user_id, name, color

- **todo_labels**: Label assignments
  - todo_id, label_id

- **board_members**: Board collaborators
  - id, board_id, user_id, role (owner, editor, viewer)

- **board_invitations**: Pending invitations
  - id, board_id, inviter_id, invitee_email, status

- **notifications**: User notifications
  - id, user_id, type, todo_id, read_at

- **activity_logs**: Activity audit trail
  - id, user_id, todo_id, action, changes

- **logs**: Production application logs
  - id, user_id, level, component, message, metadata

- **notes**: Personal notes
  - id, user_id, title, content

**Tracker Tables** (time tracking integration):
- tracker_sessions, tracker_apps, tracker_categories, tracker_keywords, tracker_category_apps, tracker_daily_stats, tracker_category_stats

### GraphQL Patterns

**Fragments** (reusable field sets):

```graphql
fragment TodoFields on todos {
  id
  title
  content
  list {
    id
    name
    board {
      id
      name
    }
  }
}
```

**Queries**:

```graphql
query GetTodos($where: todos_bool_exp) {
  todos(where: $where, order_by: { sort_order: asc }) {
    ...TodoFields
  }
}
```

**Mutations**:

```graphql
mutation CreateTodo($object: todos_insert_input!) {
  insert_todos_one(object: $object) {
    ...TodoFields
  }
}
```

**Subscriptions** (not currently used, but supported):

```graphql
subscription TodosUpdated($where: todos_bool_exp) {
  todos(where: $where) {
    ...TodoFields
  }
}
```

### Hasura Permissions

**Role-Based Access Control**:

Tables have permissions defined in `hasura/metadata/databases/default/tables/*.yaml`

**Example** (`public_todos.yaml`):
- **user role**: Can only access todos in their boards or shared boards
- **select**: Filter by board membership
- **insert**: Can create todos in accessible boards
- **update**: Can update own todos
- **delete**: Can delete own todos

### Auto-Generated Aliases

**PostgreSQL Functions**:

- `generate_board_alias()`: Creates URL-friendly board aliases
- `generate_todo_alias()`: Creates URL-friendly todo aliases
- `generate_username()`: Creates unique usernames from email/name

**Trigger on Insert**:
```sql
CREATE TRIGGER set_board_alias
  BEFORE INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION generate_board_alias();
```

---

## Testing Strategy

### E2E Tests (Playwright)

**Location**: `e2e/*.spec.ts`

**Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/en/test-user/test-board');
    await page.click('[data-testid="add-todo"]');
    await expect(page.locator('.todo-card')).toBeVisible();
  });
});
```

**Authentication**:
- Tests use `test@test.com` test user
- Auth state stored in `playwright/.auth/user.json`
- Setup in `e2e/auth.setup.ts`

**Best Practices**:
- Use `data-testid` attributes
- Test user flows, not implementation
- Use `page.waitForLoadState()` after navigation
- Clean up data in `afterEach` hooks

### Unit Tests (Vitest)

**Location**: `src/**/*.{test,spec}.ts`

**Structure**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTodosStore } from './todos.svelte';

describe('todosStore', () => {
  let store;

  beforeEach(() => {
    store = createTodosStore();
  });

  it('should load todos', async () => {
    await store.loadTodos();
    expect(store.todos).toBeDefined();
  });
});
```

### Component Tests (Vitest + Browser Mode)

**Location**: `src/**/*.svelte.{test,spec}.ts`

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import TodoCard from './TodoCard.svelte';

describe('TodoCard', () => {
  it('should render todo title', () => {
    render(TodoCard, {
      props: {
        todo: { id: '1', title: 'Test Todo' }
      }
    });

    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });
});
```

---

## Common Patterns

### Optimistic Updates

Update UI immediately, revert on error:

```typescript
async function updateTodo(id: string, updates: Partial<Todo>) {
  // Save original
  const originalTodo = state.todos.find(t => t.id === id);

  // Optimistic update
  state.todos = state.todos.map(t =>
    t.id === id ? { ...t, ...updates } : t
  );

  try {
    await request(UPDATE_TODO, { id, updates });
    return { success: true, message: 'Updated' };
  } catch (error) {
    // Revert on error
    if (originalTodo) {
      state.todos = state.todos.map(t =>
        t.id === id ? originalTodo : t
      );
    }
    return { success: false, message: error.message };
  }
}
```

### Toast Notifications

```typescript
import { errorSuccessStore } from '$lib/stores/errorSuccess.svelte';

// Success
errorSuccessStore.showSuccess('Todo created!');

// Error
errorSuccessStore.showError('Failed to create todo');
```

### Loading States

```svelte
<script lang="ts">
  import { todosStore } from '$lib/stores/todos.svelte';
</script>

{#if todosStore.loading}
  <LoadingSpinner />
{:else if todosStore.error}
  <ErrorMessage message={todosStore.error} />
{:else}
  {#each todosStore.todos as todo}
    <TodoCard {todo} />
  {/each}
{/if}
```

### Form Validation

Use Zod schemas (in `src/lib/schemas/`):

```typescript
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  content: z.string().optional(),
  due_on: z.string().datetime().optional()
});

// Validate
const result = todoSchema.safeParse(formData);
if (!result.success) {
  // Handle errors: result.error.issues
}
```

### Authentication Guards

**Server-side** (`+page.server.ts`):
```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session) {
    throw redirect(302, '/signin');
  }
  return { user: session.user };
};
```

**Client-side**:
```svelte
<script lang="ts">
  import { page } from '$app/stores';

  $: if (!$page.data.session) {
    goto('/signin');
  }
</script>
```

### Internationalization

```typescript
import { t } from '$lib/i18n';

// In component
const title = $t('todo.title');
const description = $t('todo.description', { count: 5 });
```

Translation files in `src/lib/locales/en.json`, `src/lib/locales/et.json`

---

## Troubleshooting

### Common Issues

**1. GraphQL Errors**

```
Error: Not authenticated
```
- Check `localStorage` for auth session
- Verify JWT token at `/api/auth/token`
- Ensure Hasura permissions are correct

**2. Type Errors After Schema Changes**

```bash
# Regenerate types
npm run generate
```

**3. Migration Conflicts**

```bash
cd hasura
hasura migrate squash --from <version>
```

**4. Docker Issues**

```bash
# Reset Hasura + PostgreSQL
cd hasura
docker-compose down -v
docker-compose up -d

# Reapply migrations
hasura migrate apply --all-databases
hasura metadata apply
```

**5. Test Failures**

```bash
# Clear test database
cd hasura
docker-compose down -v
docker-compose up -d

# Run tests with headed browser
npm run test:h
```

### Debug Tools

**1. Hasura Console**
```bash
cd hasura
hasura console
```
- GraphQL API explorer
- Database browser
- Permission tester

**2. Browser DevTools**
- Network tab: Check GraphQL requests
- Application tab: Check localStorage/sessionStorage
- Console: Check for errors

**3. Production Logs**
- Navigate to `/[lang]/logs`
- Filter by level, component, date
- View stack traces and metadata

**4. MCP Servers** (for Claude Code)
- Playwright: Browser testing, console logs
- Sequential Thinking: Complex problem solving
- Filesystem: Bulk operations

---

## Additional Notes

### When to Use Each Tool

**Stores** (`.svelte.ts`):
- State management
- Business logic
- API calls
- Complex computations

**Components** (`.svelte`):
- UI rendering
- User interactions
- Local UI state
- Event handling

**Server Routes** (`+page.server.ts`):
- SSR data fetching
- Authentication checks
- Server-side redirects

**API Routes** (`api/*/+server.ts`):
- File uploads
- External API calls
- Webhooks
- Custom endpoints

### Performance Considerations

**Lazy Loading**:
```typescript
const module = await import('./heavy-module');
```

**Code Splitting**:
- Routes are automatically code-split
- Use dynamic imports for large components

**Database Queries**:
- Use `limit` and `offset` for pagination
- Only fetch required fields
- Use Hasura caching headers

**Optimistic Updates**:
- Instant UI feedback
- Reduces perceived latency
- Always include rollback logic

### Security

**XSS Prevention**:
- Svelte auto-escapes HTML
- Use `{@html}` sparingly, sanitize content

**CSRF Protection**:
- Auth.js handles CSRF tokens
- SvelteKit includes CSRF protection

**SQL Injection**:
- Hasura uses prepared statements
- Never build raw SQL from user input

**Authentication**:
- JWT tokens in HTTP-only cookies (set by Auth.js)
- Token refresh on expiry
- Server-side session validation

### Deployment

**Build**:
```bash
npm run build
npm run preview
```

**Environment Variables**:
- Set all `.env` variables in production
- Use secret management (Vercel, AWS Secrets Manager, etc.)

**Database**:
- Run migrations on deployment
- Use connection pooling (PgBouncer)
- Enable SSL for PostgreSQL

**Monitoring**:
- Production logs in database
- Error tracking (Sentry, etc.)
- Analytics (@vercel/analytics, @vercel/speed-insights)

---

## Version Information

- **Svelte**: 5.x (with runes)
- **SvelteKit**: 2.x
- **TypeScript**: 5.x
- **Node.js**: 18+ (see `.nvmrc`)
- **Hasura**: Latest (check `hasura/docker-compose.yml`)
- **PostgreSQL**: 14+

---

## Contributing Guidelines for AI Assistants

### Before Making Changes

1. **Read this document thoroughly**
2. **Understand the existing patterns** (check similar files)
3. **Check `.claude/todo/` for context** on ongoing work
4. **Review recent commits** for code style

### Making Changes

1. **Follow established patterns** (stores, components, tests)
2. **Keep files small** (200-300 lines max)
3. **Add TypeScript types** for everything
4. **Write tests** for new features
5. **Update documentation** if needed

### After Making Changes

1. **Run type checking**: `npm run check` (MUST PASS)
2. **Run tests**: `npm test` (MUST PASS)
3. **Test manually** in browser
4. **Verify database changes** in Hasura Console
5. **Write clear commit message**

### Quality Checklist

- [ ] TypeScript types defined
- [ ] Error handling included
- [ ] Loading states handled
- [ ] Browser guards (`if (!browser)`)
- [ ] Optimistic updates (where applicable)
- [ ] Tests added/updated
- [ ] Accessible UI (WCAG compliant)
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] i18n translations (if user-facing)

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run check            # Type check (MUST PASS before commit)
npm test                 # Run all tests (MUST PASS before commit)

# Database
cd hasura
hasura console           # Open Hasura Console
hasura migrate apply --all-databases
hasura metadata apply

# GraphQL
npm run generate         # Generate TypeScript types from schema

# Testing
npm run test:unit        # Unit/component tests
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E with UI

# Build
npm run build            # Production build
npm run preview          # Preview production build
```

### Key Files

- **GraphQL**: `src/lib/graphql/documents.ts` - Add queries/mutations here
- **Types**: `src/lib/graphql/generated/graphql.ts` - Auto-generated types
- **Auth**: `src/hooks.server.ts` - Auth.js configuration
- **Database**: `hasura/metadata/databases/default/tables/` - Permissions & relationships
- **Env**: `.env` - Environment variables
- **Config**: `codegen.ts` - GraphQL codegen configuration

### Important Patterns

- **State**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Stores**: Factory pattern with singleton export
- **Mutations**: Return `{ success, message, data? }`
- **Errors**: Always handle and display user-friendly messages
- **Loading**: Show loading states, handle errors
- **Browser**: Check `if (!browser)` before client-side APIs

---

**Last Updated**: 2025-11-15
**Maintained by**: AI assistants working on this codebase

For questions or clarifications, refer to the README.md or check the `.claude/todo/` directory for ongoing work context.
