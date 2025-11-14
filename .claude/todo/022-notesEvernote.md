## Original Requirement
Add to project/board page view somewhere multilingual button "Notes" and then open a new Evernote like view where user can see, add, edit and delete rich text editable (see how card is rich text editable and re-use that rich text editor) content.

It is a bigger task so break it into smaller tasks and create todo plan first. Then implement the first task.

---

## Analysis

**Affected Areas:**
- Board page: `src/routes/[lang]/[username]/[board]/+page.svelte`
- Rich text editor: `src/lib/components/editor/RichTextEditor.svelte` (reusable)
- Database: New `notes` table in Hasura
- Stores: New `notes.svelte.ts` store
- Components: New notes UI components

**MCP Needed:** Playwright for browser testing

**Current Architecture:**
- Using TipTap editor with StarterKit, Link, TaskList extensions
- Store pattern: Factory function with `$state`, `$derived`, browser guards, optimistic updates
- Database: Hasura GraphQL with PostgreSQL
- i18n: Multilingual support via `$t()` function

---

## Implementation Plan

### Task 1: Database Layer ✓ (Current)
**Files to create/modify:**
- Create migration: `hasura/migrations/default/{timestamp}_create_notes_table/up.sql`
- Create rollback: `hasura/migrations/default/{timestamp}_create_notes_table/down.sql`
- Create metadata: `hasura/metadata/databases/default/tables/public_notes.yaml`

**Schema:**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Hasura Setup:**
- Apply migration
- Configure permissions (users can manage their board's notes)
- Set up relationships (board, user)

---

### Task 2: GraphQL Layer
**Files to modify:**
- `src/lib/graphql/documents.ts` - Add queries/mutations
- Run `npm run generate` to update `src/lib/graphql/generated.ts`

**Operations:**
```graphql
# Fragment
NOTE_FRAGMENT

# Queries
GET_NOTES (by board_id)
GET_NOTE (by id)

# Mutations
CREATE_NOTE
UPDATE_NOTE
DELETE_NOTE
UPDATE_NOTE_ORDER
```

---

### Task 3: Store Layer
**Files to create:**
- `src/lib/stores/notes.svelte.ts`

**Methods:**
```typescript
- loadNotes(boardId: string)
- createNote(boardId: string, title?: string)
- updateNote(id: string, updates: { title?, content? })
- deleteNote(id: string)
- reorderNotes(boardId: string, noteIds: string[])
```

**Features:**
- Optimistic updates
- Browser guards
- Error handling
- Sort by sort_order
- Return `{ success, message, data? }`

---

### Task 4: UI Components
**Files to create:**
- `src/lib/components/notes/NotesButton.svelte` - Button for board page
- `src/lib/components/notes/NotesView.svelte` - Main notes modal/view
- `src/lib/components/notes/NotesList.svelte` - List of notes (sidebar)
- `src/lib/components/notes/NoteEditor.svelte` - Individual note editor
- `src/lib/components/notes/NoteItem.svelte` - Note list item

**UI Design:**
- Modal/sheet overlay (similar to shadcn Sheet component)
- Left sidebar: List of notes (scrollable)
- Right panel: Rich text editor (using existing RichTextEditor.svelte)
- Top bar: Close button, note title input
- Bottom bar: Delete button, timestamps

---

### Task 5: Integration
**Files to modify:**
- `src/routes/[lang]/[username]/[board]/+page.svelte` - Add Notes button

**Integration Points:**
- Add "Notes" button near board settings/GitHub buttons
- Wire up store to components
- Handle modal open/close state
- Load notes when board loads

---

### Task 6: i18n Translations
**Files to modify:**
- `src/lib/locales/en.json`
- `src/lib/locales/et.json` (Estonian)

**Keys to add:**
```json
{
  "notes": {
    "title": "Notes",
    "newNote": "New Note",
    "untitled": "Untitled Note",
    "deleteConfirm": "Delete this note?",
    "noNotes": "No notes yet",
    "searchPlaceholder": "Search notes..."
  }
}
```

---

### Task 7: Testing
**Tests to write:**
- Unit: `tests/unit/stores/notes.test.ts`
- Component: `tests/unit/components/notes/*.test.ts`
- E2E: `tests/e2e/notes.spec.ts`

**Test Coverage:**
- Store CRUD operations
- Optimistic updates rollback on error
- Component rendering
- Rich text editor integration
- Modal open/close
- Note sorting/reordering

**Quality Checks:**
- `npm run check` (TypeScript + Svelte)
- `npm test` (Vitest + Playwright)

---

### Task 8: Documentation & Cleanup
- Remove debug console.logs
- Use loggingStore for production logs
- Update this task file with results
- Document any gotchas or special considerations

---

## Changes

### Task 1: Database Layer ✓ COMPLETED

**Files Created:**
1. `hasura/migrations/default/1763151675451_create_notes_table/up.sql` - Migration to create notes table
2. `hasura/migrations/default/1763151675451_create_notes_table/down.sql` - Rollback migration
3. `hasura/metadata/databases/default/tables/public_notes.yaml` - Metadata with permissions and relationships

**Files Modified:**
1. `hasura/metadata/databases/default/tables/tables.yaml` - Added notes table reference

**Database Schema:**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Permissions:**
- Users can create/read/update/delete notes for boards they own or are members of
- Public boards allow read-only access to notes
- user_id is automatically set to the authenticated user

**Indexes:**
- `notes_board_id_idx` - For efficient board queries
- `notes_user_id_idx` - For user queries
- `notes_sort_order_idx` - For sorting

**Manual Steps Required:**
Since Hasura CLI and Docker are not available in this environment, please apply the migration manually:
```bash
cd hasura
hasura migrate apply --database-name default
hasura metadata apply
hasura metadata reload
```

---

### Task 2: GraphQL Layer ✓ COMPLETED

**Files Modified:**
1. `src/lib/graphql/documents.ts` - Added notes fragment, queries, and mutations

**Operations Added:**

**Fragment:**
- `NOTE_FRAGMENT` - Complete note fields with user and board relationships

**Queries:**
- `GET_NOTES` - Query notes with filtering, ordering, pagination
- `GET_NOTE` - Query single note by ID

**Mutations:**
- `CREATE_NOTE` - Create new note
- `UPDATE_NOTE` - Update single note
- `UPDATE_NOTES` - Batch update notes (for reordering)
- `DELETE_NOTE` - Delete note

**Manual Steps Required:**
Since Hasura is not running in this environment, please generate the TypeScript types manually:
```bash
# After Hasura is running with the migration applied:
npm run generate
```

This will:
1. Connect to Hasura GraphQL endpoint
2. Generate TypeScript types from the schema
3. Update `src/lib/graphql/generated.ts` with note types

---

### Task 3: Store Layer ✓ COMPLETED

**Files Created:**
1. `src/lib/stores/notes.svelte.ts` - Notes store with full CRUD operations

**Store Features:**

**State Management:**
- `notes` - Array of note objects
- `loading` - Loading state
- `error` - Error message
- `currentBoardId` - Currently loaded board ID

**Methods:**
- `loadNotes(boardId)` - Load all notes for a board
- `createNote(boardId, title?, content?)` - Create new note with auto-incrementing sort_order
- `updateNote(id, updates)` - Update note title and/or content with optimistic updates
- `deleteNote(id)` - Delete note with optimistic updates
- `reorderNotes(noteIds[])` - Batch update sort_order for drag-and-drop
- `clearError()` - Clear error state
- `reset()` - Reset store to initial state

**Derived State:**
- `sortedNotes` - Auto-sorted by sort_order then created_at

**Patterns Implemented:**
- ✅ Browser guards on all async operations
- ✅ Optimistic updates with rollback on error
- ✅ Immutable getters to prevent external mutation
- ✅ Consistent error handling
- ✅ StoreResult return type for mutations
- ✅ Follows factory pattern from other stores

**Notes:**
- Uses temporary type definitions until `npm run generate` is run
- Types will be automatically replaced when generated types are available
- All operations return `{ success, message, data? }` for consistent error handling

---

---

## Verification
- [ ] Playwright MCP: Browser tested, console verified
- [ ] Hasura Console: DB changes verified
- [ ] Tests written and passing
- [ ] `npm run check` passed
- [ ] `npm test` passed

---

## Test Coverage
(To be filled in after testing)

---

## Results
(To be filled in after completion)