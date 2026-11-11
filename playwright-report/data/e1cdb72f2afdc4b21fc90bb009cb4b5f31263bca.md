# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Authenticated user flow >> should handle keyboard shortcuts
- Location: e2e/authenticated.spec.ts:54:2

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/enter task title/i)

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - navigation [ref=e6]:
      - button [ref=e7] [cursor=pointer]:
        - heading "ToDzz" [level=1] [ref=e11]
      - generic [ref=e12]:
        - button [ref=e13]:
          - button [ref=e14] [cursor=pointer]
        - generic [ref=e15]:
          - button "Test's board" [ref=e17] [cursor=pointer]
          - button [ref=e20]:
            - button "Ava menüü" [ref=e21] [cursor=pointer]
  - main [ref=e22]:
    - generic [ref=e23]:
      - generic [ref=e25]:
        - heading "Test's board" [level=1] [ref=e26]
        - generic [ref=e28]:
          - button "Lists" [ref=e29] [cursor=pointer]
          - button "Filter" [ref=e31] [cursor=pointer]
          - button "Märkmed" [ref=e33] [cursor=pointer]
          - button "Logid" [ref=e35] [cursor=pointer]
      - generic [ref=e37]:
        - generic [ref=e43]:
          - generic [ref=e44]: Uus list
          - button "Loo list" [ref=e47] [cursor=pointer]
        - button "Mobiili kiirlisamine (link avaekraanile lisamiseks)" [ref=e49] [cursor=pointer]
```

# Test source

```ts
  1  | /** @file e2e/authenticated.spec.ts */
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Authenticated user flow', () => {
  5  | 	test('should access todos', async ({ page }) => {
  6  | 		await page.goto('/');
  7  | 		await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
  8  | 		await expect(page.getByPlaceholder(/enter task title/i)).toBeVisible();
  9  | 	});
  10 | 
  11 | 	test('should create new todo item', async ({ page }) => {
  12 | 		await page.goto('/');
  13 | 
  14 | 		const taskInput = page.getByPlaceholder(/enter task title/i);
  15 | 		const addButton = page.getByRole('button', { name: /add/i });
  16 | 		const testTodoTitle = 'E2E test todo';
  17 | 		await taskInput.fill(testTodoTitle);
  18 | 		await addButton.click();
  19 | 
  20 | 		const todoContainer = page.locator('div[class*="grid-cols-1"]');
  21 | 		await expect(todoContainer.getByText(testTodoTitle).first()).toBeVisible();
  22 | 	});
  23 | 
  24 | 	test('should toggle between list/kanban', async ({ page }) => {
  25 | 		await page.goto('/');
  26 | 
  27 | 		const listButton = page.getByRole('button', { name: /list/i });
  28 | 		const kanbanButton = page.getByRole('button', { name: /kanban/i });
  29 | 
  30 | 		await expect(kanbanButton).toHaveClass(/bg-primary/);
  31 | 		await listButton.click();
  32 | 		await expect(listButton).toHaveClass(/bg-primary/);
  33 | 		await kanbanButton.click();
  34 | 		await expect(kanbanButton).toHaveClass(/bg-primary/);
  35 | 	});
  36 | 
  37 | 	test('should display quick add form', async ({ page }) => {
  38 | 		await page.goto('/');
  39 | 
  40 | 		await expect(page.getByText(/add new task/i)).toBeVisible();
  41 | 		await expect(page.getByText(/what.*accomplish/i)).toBeVisible();
  42 | 
  43 | 		const taskInput = page.getByPlaceholder(/enter task title/i);
  44 | 		const addButton = page.getByRole('button', { name: /add/i });
  45 | 
  46 | 		await expect(addButton).toBeDisabled();
  47 | 		await taskInput.fill('Test task');
  48 | 		await expect(addButton).toBeEnabled();
  49 | 
  50 | 		await taskInput.fill('');
  51 | 		await expect(addButton).toBeDisabled();
  52 | 	});
  53 | 
  54 | 	test('should handle keyboard shortcuts', async ({ page }) => {
  55 | 		await page.goto('/');
  56 | 
  57 | 		const taskInput = page.getByPlaceholder(/enter task title/i);
  58 | 
> 59 | 		await taskInput.fill('Keyboard shortcut todo');
     |                   ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  60 | 		await taskInput.press('Enter');
  61 | 
  62 | 		const todoContainer = page.locator('div[class*="grid-cols-1"]');
  63 | 		await expect(todoContainer.getByText('Keyboard shortcut todo').first()).toBeVisible();
  64 | 
  65 | 		await expect(taskInput).toHaveValue('');
  66 | 	});
  67 | 
  68 | 	test('should show error handling', async ({ page }) => {
  69 | 		await page.goto('/');
  70 | 
  71 | 		const errorContainer = page.locator('.border-destructive');
  72 | 
  73 | 		// TODO: trigger error condition
  74 | 	});
  75 | 
  76 | 	test('should persist view mode preference', async ({ page }) => {
  77 | 		await page.goto('/');
  78 | 
  79 | 		const listButton = page.getByRole('button', { name: /list/i });
  80 | 		await listButton.click();
  81 | 		await page.reload();
  82 | 		await expect(listButton).toHaveClass(/bg-primary/);
  83 | 	});
  84 | });
  85 | 
```