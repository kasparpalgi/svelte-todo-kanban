# Project Context

## Overview
Modern Kanban ToDo application with drag-and-drop functionality, rich task management, file attachments, and real-time optimistic updates. Built as a monorepo with SvelteKit frontend and Hasura backend.

## MANDATORY TESTING & DEBUGGING REQUIREMENTS

**CRITICAL: Claude Code MUST always write tests AND verify functionality before finalizing!**

### Development Workflow (NEVER SKIP THESE)

1. **Plan & Understand**
   - Read relevant files to understand context
   - Create task file in `todo/` folder with original requirement at top
   - Document implementation plan

2. **Implement with Debug Logging**
   - Add structured console.logs during development
   - Use consistent prefixes for easy filtering
   - Log function entry/exit, state changes, API responses
   
3. **Verify Functionality**
   - Run dev server and manually test the feature
   - Check browser console for debug logs
   - Verify all paths work (success, error, edge cases)
   - For server-side code, check terminal output

4. **Write Comprehensive Tests**
   - Unit tests for stores/utilities
   - Component tests for UI
   - E2E tests for user workflows
   - Mock external dependencies (API, localStorage)

5. **Quality Gates**
   - Run `npm run check` - MUST pass (no type errors)
   - Run `npm test` - MUST pass (all tests green)
   - Verify test coverage is adequate

6. **Clean Up**
   - Remove or comment out debug console.logs
   - Keep only production-relevant logging (use `loggingStore`)
   - Remove temporary code/comments
   - Final code review

7. **Document**
   - Update task file with test results
   - Document test coverage percentage
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

#### 3. E2E Tests for User Workflows
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

## Implementation Plan
1. [Step 1 with file references]
2. [Step 2 with file references]
3. [Testing strategy]

## Implementation Details
### Changes Made
- `src/lib/stores/feature.svelte.ts`: [description]
- `src/lib/components/Feature.svelte`: [description]

### Debug Logging Added
- [List key console.logs added for verification]

## Testing
### Manual Testing
- [ ] Tested in browser - feature works as expected
- [ ] Checked console logs - no errors
- [ ] Tested edge cases: [list]
- [ ] Server logs verified (if applicable)

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

### Quality Gates
- [ ] `npm run check` - passed ✓ (no type errors)
- [ ] `npm test` - passed ✓ (all tests green)

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

## Next Steps
- [Future improvements or related tasks]
```

### Debugging Checklist Before Finalizing

```markdown
- [ ] Feature works in browser (manually tested)
- [ ] Console logs show expected behavior
- [ ] All console.logs are structured with [Component.method] format
- [ ] No errors in browser console
- [ ] Server logs show correct flow (if applicable)
- [ ] All tests written and passing
- [ ] Type check passes (`npm run check`)
- [ ] Test suite passes (`npm test`)
- [ ] Debug console.logs removed/commented
- [ ] Production logging uses loggingStore
- [ ] Task file updated with results
```

### Advanced: MCP Server for Browser Console Access

**Optional but powerful**: Set up Playwright MCP server to let Claude Code directly access browser console.

```bash
# Install Playwright MCP
npm install -g @playwright/mcp

# Configure in Claude Code (add to Claude.md or prompt)
"Use Playwright MCP to access browser console when debugging"
```

**Available MCP Tools:**
- `browser_navigate`: Open pages in browser
- `browser_console_messages`: Read console logs
- `browser_snapshot`: Capture page state
- `browser_execute`: Run JavaScript in browser

**When to Use:**
- Complex UI debugging
- Visual regression testing
- Interactive feature verification
- When console logs aren't enough

---

## Tech Stack
[Rest of your existing content...]