# Project Context

## Overview
Modern Kanban ToDo application with drag-and-drop functionality, rich task management, file attachments, and real-time optimistic updates. Built as a monorepo with SvelteKit frontend and Hasura backend.

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

## Critical Rules

### 1. Browser Safety
```typescript
// ALWAYS check before browser APIs
if (!browser) return;

// Examples
if (browser) {
  localStorage.setItem('key', 'value');
  window.addEventListener('resize', handler);
}
```

### 2. GraphQL Operations
- Use `request()` from `client.ts` exclusively
- Add all queries/mutations to `documents.ts`
- Run `npm run generate` after schema changes
- Import and use generated types

### 3. State Management
- Follow factory pattern for all stores
- Use single `$state` object
- Expose via getters
- Check `states.svelte.ts` for global state

### 4. Mutations
- ALWAYS use optimistic update pattern
- Store original for rollback
- Return consistent result objects
- Handle both API and network errors

### 5. Security
- Never store sensitive data in localStorage
- Database is single source of truth
- Use JWT tokens for API authentication
- Validate all user inputs with Zod

### 6. User Feedback
- Use `displayMessage()` for all user-facing feedback
- Set appropriate durations
- Provide actionable error messages

## Development Commands

```bash
# Development
npm run dev              # Start dev server with --open
npm run dev -- --open    # Explicit open browser

# Code Quality
npm run check            # Type checking
npm run test             # Run all tests
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

## Environment Setup

1. Copy `.env.example` → `.env` (update URL/password)
2. Copy `hasura/.env.example` → `hasura/.env`
3. Copy `.env.test.example` → `.env.test` (for Playwright)
4. Update `hasura/config.example.yaml` → `hasura/config.yaml`

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

## Common Patterns

### Creating a New Store
1. Create `src/lib/stores/featureStore.svelte.ts`
2. Follow factory pattern with `$state`, actions, derived, getters
3. Add browser guards to all actions
4. Implement optimistic updates for mutations
5. Use `displayMessage()` for user feedback

### Adding a GraphQL Operation
1. Add to `src/lib/graphql/documents.ts`
2. Run `npm run generate`
3. Import generated types
4. Use `request()` in store actions

### Adding a Component
1. Place in appropriate directory (`todo/`, `listBoard/`, `ui/`)
2. Import from stores for state
3. Use `$t()` for translatable text
4. Follow Tailwind utility classes (no custom CSS compilation)

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