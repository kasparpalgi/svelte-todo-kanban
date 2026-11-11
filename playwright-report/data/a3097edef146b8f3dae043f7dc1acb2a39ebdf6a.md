# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: unauthenticated.spec.ts >> Unauthenticated user flow >> should enable email sign-in button when email is filled
- Location: e2e/unauthenticated.spec.ts:22:2

# Error details

```
Error: locator.fill: Error: strict mode violation: getByRole('textbox') resolved to 2 elements:
    1) <input value="" id="email" required="" type="email" placeholder="" data-slot="input" class="border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground shadow-xs flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-…/> aka locator('#email')
    2) <input value="" required="" id="password" placeholder="" type="password" data-slot="input" class="border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground shadow-xs flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]…/> aka locator('#password')

Call log:
  - waiting for getByRole('textbox')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e7]:
    - generic:
      - paragraph
    - combobox [ref=e8]:
      - option "Eesti" [selected]
      - option "English"
      - option "Čeština"
  - generic [ref=e9]:
    - button [ref=e10] [cursor=pointer]:
      - img "Google" [ref=e11]
    - generic [ref=e13]:
      - textbox [ref=e15]
      - textbox [ref=e17]
      - button [ref=e18] [cursor=pointer]
    - button [ref=e20] [cursor=pointer]
    - button [ref=e22] [cursor=pointer]
```

# Test source

```ts
  1  | /** @file e2e/unauthenticated.spec.ts */
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test.describe('Unauthenticated user flow', () => {
  5  | 	test('should show login form on homepage', async ({ page }) => {
  6  | 		await page.goto('/');
  7  | 
  8  | 		await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
  9  | 	});
  10 | 
  11 | 	test('should display all login options', async ({ page }) => {
  12 | 		await page.goto('/signin');
  13 | 		await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  14 | 		await expect(page.getByRole('textbox')).toBeVisible();
  15 | 
  16 | 		const testButton = page.getByText(/test login/i);
  17 | 		if (await testButton.isVisible()) {
  18 | 			await expect(testButton).toBeVisible();
  19 | 		}
  20 | 	});
  21 | 
  22 | 	test('should enable email sign-in button when email is filled', async ({ page }) => {
  23 | 		await page.goto('/signin');
  24 | 
  25 | 		const emailInput = page.getByRole('textbox');
  26 | 		const emailButton = page.getByRole('button', { name: /sign in with email/i });
  27 | 
> 28 | 		await emailInput.fill('user@example.com');
     |                    ^ Error: locator.fill: Error: strict mode violation: getByRole('textbox') resolved to 2 elements:
  29 | 		await expect(emailButton).toBeEnabled();
  30 | 	});
  31 | });
```