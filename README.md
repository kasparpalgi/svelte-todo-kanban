# Svelte ToDo app (Kanban) |

Modern Kanban ToDo app built with SvelteKit, Hasura GraphQL, and PostgreSQL.

## Quick Start

### Prerequisites
- Node.js 18+ (recommended: use `nvm`)
- Docker & Docker Compose (for Hasura)
- [Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/)
- **Claude Code with MCP servers** (see MCP Setup below)

### Installation

1. **Node & Dependencies**
   ```bash
   # Optional: Use same Node version across devices
   nvm install && nvm use
   
   # Install dependencies
   npm ci
   
   # Windows troubleshooting (if needed)
   npm install --maxsockets=1
   ```

2. **Environment Setup**
   ```bash
   # Copy and configure environment files
   cp .env.example .env
   cp hasura/.env.example hasura/.env
   cp .env.test.example .env.test
   
   # Edit .env files with your database credentials
   ```

3. **Backend Setup**
   ```bash
   # Start Hasura
   cd hasura
   docker-compose up -d
   
   # Configure Hasura
   cp config.example.yaml config.yaml
   # Edit config.yaml with your admin password
   
   # Apply migrations and metadata
   hasura migrate apply --all-databases
   hasura metadata apply
   
   # Optional: Load seed data (creates test@test.com user)
   hasura seed apply
   
   # Open Hasura Console
   hasura console
   # Console opens at http://localhost:9695
   ```

4. **Verify Installation**
   ```bash
   npm run check
   npm test
   ```

5. **Start Development**
   ```bash
   npm run dev
   # Opens at http://localhost:5173
   ```

---

## MCP Setup for Claude Code

MCP (Model Context Protocol) servers enhance Claude Code with browser automation, database access, and advanced problem-solving capabilities.

### One-Time Setup

**Required MCP Servers:**

```bash
# 1. Playwright - Browser testing & console logs
claude mcp add playwright -- npx @playwright/mcp@latest

# 2. Sequential Thinking - Complex problem solving
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# 3. Filesystem - Direct file operations (RECOMMENDED)
# Windows:
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem C:/git/svelte-todo-kanban

# macOS/Linux:
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/svelte-todo-kanban
```

**Optional MCP Servers:**

```bash
# Context7 - Latest framework documentation
claude mcp add --transport http context7 https://mcp.context7.com/mcp/

# GitHub - Version control operations
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

### Verify MCP Configuration

```bash
claude mcp list

# Should show (✓ Connected):
# - playwright
# - sequential-thinking
# - filesystem
# - context7 (if installed)
```

### MCP Usage in Development

Once configured, MCP servers are automatically available in all Claude Code sessions:

- **Playwright**: Test features in browser, capture console logs, take UI snapshots
- **Sequential Thinking**: Plan complex features, analyze architecture decisions
- **Filesystem**: Bulk file operations, project-wide refactoring
- **Context7**: Get latest SvelteKit/Svelte 5 documentation

**Example workflow:**
```bash
# In Claude Code, you can now say:
"Use Playwright to test the drag-and-drop at localhost:5173"
"Use sequential thinking to plan the real-time collaboration feature"
"Use filesystem to rename all .svelte files to use new naming convention"
```

---

## Tech Stack

**Frontend**: Svelte 5, SvelteKit, TypeScript, Tailwind CSS, shadcn-svelte  
**Backend**: Hasura GraphQL, PostgreSQL  
**Auth**: Auth.js with JWT tokens  
**Rich Text**: svelte-tiptap (Markdown support planned)  
**Testing**: Playwright (E2E), Vitest (unit/component)  
**i18n**: sveltekit-i18n

---

## Project Structure

```
src/
├── routes/
│   ├── [lang]/              # Language-based routing
│   └── api/                 # Auth & file uploads
├── lib/
│   ├── components/
│   │   ├── todo/            # Todo components
│   │   ├── listBoard/       # Board/list components
│   │   └── ui/              # Shared UI (shadcn)
│   ├── stores/              # State management
│   ├── graphql/
│   │   ├── client.ts        # GraphQL client
│   │   ├── documents.ts     # All queries/mutations
│   │   └── generated.ts     # Auto-generated types
│   └── locales/             # i18n translations
hasura/
├── metadata/                # GraphQL schema, permissions
├── migrations/              # Database migrations
└── seeds/                   # Test data
tests/
└── e2e/                     # Playwright tests
```

---

## Key Features

- **Kanban Board**: Drag-and-drop task management
- **Rich Tasks**: Priority levels, due dates, markdown descriptions
- **File Attachments**: Upload files to tasks
- **User Preferences**: Dark mode, language selection
- **Optimistic Updates**: Instant UI feedback
- **Production Logging**: Comprehensive logging with database persistence
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript + GraphQL codegen
- **Sharing & Collaboration**: Board invitations with role-based access

---

## Development Workflow

### State Management (Stores)

Stores follow a factory pattern in `src/lib/stores/*.svelte.ts`:

```typescript
function createStore() {
  const state = $state({
    items: [],
    loading: false,
    error: null
  });

  async function loadItems() {
    if (!browser) return; // Always check browser
    state.loading = true;
    try {
      const data = await request(GET_ITEMS, {});
      state.items = data.items || [];
    } catch (error) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  }

  return {
    get items() { return state.items; },
    get loading() { return state.loading; },
    loadItems
  };
}

export const store = createStore();
```

**Key Rules:**
- Single `$state` object for all reactive state
- Always check `if (!browser)` before browser APIs
- Use `finally` for loading state
- Return `{ success, message, data? }` from mutations
- Use optimistic updates for instant UI feedback

### GraphQL Workflow

1. Add query/mutation to `src/lib/graphql/documents.ts`
2. Run `npm run generate` to generate types
3. Import types from `src/lib/graphql/generated.ts`
4. Use `request()` from `src/lib/graphql/client.ts`

```typescript
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated';

const data: GetBoardsQuery = await request(GET_BOARDS, { user_id });
```

### Database Verification

```bash
# Open Hasura Console
cd hasura
hasura console

# Console features:
# - Data tab: Browse tables, run SQL
# - API tab: Test GraphQL queries
# - Events tab: Check triggers
```

### Logging System

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';

// Production logs (auto-saved to DB)
loggingStore.error('Component', 'Error msg', { error });
loggingStore.warn('Component', 'Warning', { context });
loggingStore.info('Component', 'Info', { data });

// Dev only (not persisted)
loggingStore.debug('Component', 'Debug', { data });
```

View logs at: `/[lang]/logs`

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run check            # Type checking
npm test                 # Run tests
npm run generate         # Generate GraphQL types

# Backend (from hasura/ directory)
hasura console           # Open Hasura Console
hasura metadata apply    # Apply metadata changes
hasura migrate apply --all-databases
hasura migrate create "migration_name" --from-server

# MCP
claude mcp list          # List configured servers
claude mcp add           # Add new server
claude mcp remove        # Remove server

# Clean install
npm run cu               # Unix-like systems
npm run cw               # Windows
```

---

## Testing

### Test Credentials (Development Only)

When `NODE_ENV=development`:
- Email: `test@test.com`
- Access: `/auth/signin`
- **Delete in production!**

### Running Tests

```bash
# All tests
npm test

# E2E only
npm run test:e2e

# Unit/Component only
npm run test:unit

# With UI
npm run test:e2e -- --ui
```

---

## URL Structure

SEO-friendly URLs with auto-generated aliases:

- **Boards**: `/[lang]/[username]/[boardAlias]`
- **Todos**: `/[lang]/[username]/[boardAlias]/[todoAlias]`

**Examples:**
- `/en/john-w/work-projects`
- `/en/sarah/personal-tasks/shopping`

Aliases are auto-generated by PostgreSQL functions:
- Lowercase, hyphenated format
- Duplicate handling with numbers (`my-board`, `my-board-2`)
- **Boards**: Globally unique
- **Todos**: User-scoped unique

**Planned**: Custom usernames, shareable URLs without `/[lang]`

---

## Invitation Flow

1. User sends invitation → Creates `board_invitations` row (status='pending')
2. Invitee logs in → Bell icon shows notification count
3. Invitee clicks bell → Views pending invitations
4. Invitee accepts → Creates `board_members` row, updates status
5. Board appears in BoardSwitcher with "Shared" badge

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Dependencies Explained

- **Auth.js**: Authentication with JWT tokens (supports static adapter for mobile)
- **nodemailer**: Email sending (production: use paid service API)
- **@neodrag/svelte**: Drag-and-drop for Kanban
- **shadcn-svelte**: Accessible UI components (`npx shadcn-svelte add <component>`)
- **lucide-svelte**: Icon library
- **svelte-tiptap**: Rich markdown editor
- **graphql-request**: GraphQL client for Hasura
- **Zod**: Form validation
- **sveltekit-i18n**: Lightweight i18n (zero dependencies)

---

## Contributing

### Before Committing

```bash
npm run check           # Must pass
npm test                # Must pass
```

### Development Guidelines

1. **Use MCP tools for verification**:
   - Playwright for browser testing
   - Sequential Thinking for complex planning
   - Hasura Console for database verification

2. **Follow store patterns**:
   - Factory pattern with `$state`
   - Browser guards on all actions
   - Optimistic updates for mutations

3. **Write tests**:
   - Unit tests for stores
   - Component tests for UI
   - E2E tests for workflows

4. **Document changes**:
   - Update task files in `todo/` folder
   - Document MCP verification performed
   - Note test coverage

---

## Troubleshooting

### Windows Installation Issues

If you encounter dependency conflicts:
```bash
npm install --maxsockets=1
```

### Hasura Connection Issues

Check `.env` and `hasura/.env` files have correct credentials.

### MCP Server Not Connected

```bash
# Check status
claude mcp list

# Reconnect
claude mcp remove <server-name>
claude mcp add <server-name> -- <command>
```

---

## License

[Your License Here]

## Support

For issues or questions, please open an issue on GitHub.