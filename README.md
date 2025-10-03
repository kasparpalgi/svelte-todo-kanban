# Svelte ToDo app (Kanban) |

Modern Kanban ToDo app built according to requirements [requirements](docs/todolist-svelte.md).

## Install

1. Pre-install optional suggestion (use the same Node/npm across devices): `nvm install && nvm use` & `npm ci` & `npm run i-npm` (or pnmp/yarn)
2. Install dependencies: `npm ci`. On Windows you may need to to `npm i` or even `npm install --maxsockets=1` as latest Tailwind may be conflicting with current latest Vite and types may be messed or another known issue is that it won't even run due to `shadcn` current latest version some conflicts I haven't dived in.
3. Rename `.env.example` to `.env` and update URL/password and do the same woth `hasura/.env.example`. Also, `.env.test.example` to `.env.test` (needed for Playwright testing Auth.js).
4. Set up backend.
   1. In `hasura` folder run `docker-compose up -d` to run [Hasura (enterprise-grade API engine)](https://hasura.io/)
   2. Rename `hasura/config.example.yaml` to `hasura/config.yaml` and update the password. 
   3. Install [Hasura CLI](https://hasura.io/docs/2.0/hasura-cli/install-hasura-cli/)
   4. Run `hasura migrate apply --all-databases` and `hasura metadata apply`
   5. If you want to test with some seed data, do `hasura seed apply` and if you have in your `.env` the `NODE_ENV` set to `development` then you are also able to access Auth.js built-in sign-in page at `/auth/signin` where you can login with `test@test.com` below in the test login section. It is also suggested to delete the test yser in production and do the testing with actually signed up accounts.
   6. You can run `hasura console` for web UI to manage back-end tables/relations, run test API queries and much more.
5. Always good idea to see if all works now: `npm run check` & `npm run test`

Fresh re-install Svelte: `npm run cu` (Unix-like), `npm run cw` (Windows).

## Dependencies & explanations

* [Auth.js](https://authjs.dev/) - for authentication. JWT token is used to make API requests from front-end so the app can be run with adapter 'static' that is needed for building Capacitor mobile app.
* [nodemailer](https://nodemailer.com/) - sending email. For production paid and more "reliable" in terms of not going to spam paid service with API access will be used.
* [@dnd-kit](https://dnd-kit-svelte.vercel.app/) - drag'n'drop (for Kanban)
* [shadcn-svelte](https://shadcn-svelte.com/) - set of beautifully-designed, accessible components. Adding components: `npx shadcn-svelte add <COMPONENT>`
* [lucide-svelte icons](https://lucide.dev/icons/)
* [svelte-tiptap](https://tiptap.dev/docs/editor) - Rich markdown editor
* PostgreSQL for DB. PostgreSQL functions are used where possible for speed and reliability.
* graphql & graphql-request - handling Hasura GraphQL API requests.
* Zod for form validation
* [sveltekit-i18n](https://github.com/sveltekit-i18n/lib) - straightforward sveltekit-i18n solution (tiny library with no external dependencies)

### Application architecture

The application is structured as a monorepo, containing the SvelteKit frontend, Hasura backend configuration, and testing suites all in one place.

*   **Frontend (SvelteKit):** The core of the application resides in the `src` directory.
    *   `src/routes`: Defines all application pages and API endpoints. See "routing" for more below.
    *   `src/lib/components`: Contains reusable Svelte components, organized by feature (`todo`, `listBoard`) and a general `ui` directory for components from mostly `shadcn-svelte`.
    *   `src/lib/stores`: Manages application state using Svelte stores, following a factory pattern to encapsulate state and business logic.
    *   `src/lib/graphql`: Holds the GraphQL client (`client.ts`), queries and mutations (`documents.ts`), and auto-generated types, ensuring a type-safe data layer.
*   **Backend (Hasura & SvelteKit):** A hybrid approach is used for the backend.
    *   `hasura/`: Contains the entire backend setup. Hasura provides the primary API for PostgreSQL database.
        *   `hasura/metadata`: Defines the GraphQL API, including table relationships and permissions.
        *   `hasura/seeds`: Optional test data.
    *   `src/routes/api`: SvelteKit server routes handle specific backend tasks that don't fit into the Hasura model, such as authentication with Auth.js and file uploads.
*   **Testing:**
    *   `e2e/`: End-to-end tests are written using Playwright.
    *   `*.spec.ts`: Unit and component tests are powered by Vitest.

##### Routing

App generates user-friendly URLs using automatically generated aliases:

- **Boards**: `/[lang]/[username]/[boardAlias]` - each board gets a unique, URL-friendly alias generated from its name
- **Todos**: `/[lang]/[username]/[boardAlias]/[todoAlias]` - todos have user-scoped aliases (unique per user)

**Alias Generation:**

Username for the user and aliases for the boards and todos are generated using PostgreSQL functions.

- Converts names to lowercase, URL-friendly format
- Replaces spaces with hyphens
- Removes special characters
- Handles duplicates by appending numbers (e.g., `my-board`, `my-board2`)
- **Boards**: Globally unique aliases across all users
- **Todos**: User-scoped uniqueness (multiple users can have the same alias)

Example URLs:
- `/en/john-w/work-projects`
- `/en/sarah/personal-tasks/shopping`

**Future Plans:**

1. Allow users to customize their username.
2. Enable shareable URLs: `/[username]/[boardAlias]/[todoAlias]`

### Description of features

*   **Kanban Board:** A fully interactive, drag-and-drop board for organising tasks into lists.
*   **Rich Task Details:** Tasks can be enhanced with priority levels and due dates.
*   **File Attachments:** Upload and attach relevant files.
*   **User Preferences:**
    *   **Dark Mode:**
    *   **Language Selection:**
*   **Modern UI/UX:**
    *   **Optimistic Updates:**
    *   **Responsive Design:**
    *   **Toast Notifications:** A centralized system provides clear, non-intrusive feedback for user actions.
*   **Developer Experience:**
    *   **GraphQL Codegen:** Automatically generates TypeScript types from GraphQL queries, ensuring a type-safe data layer and reducing bugs.
    *   **AI-powered Translations:** A utility script in the `scripts` folder helps automate the translation of locales using AI. Work in progress.

## Developing

Once installed, run:  `npm run dev -- --open`

### Stores

Stores are defined in `src/lib/stores/<name>.svelte.ts` files and follow a factory pattern (create...Store) to encapsulate state and logic:

* State - managed by a single `$state` rune object. This keeps all reactive state in one place. Global states: [states.svelte.ts](src/lib/stores/states.svelte.ts).
* Actions - async functions within the store that handle all interactions with API.
* Getters - public state is exposed via getters to prevent direct mutation from outside the store's defined actions.
* Derived state - $derived for computed values (e.g., sorting / filtering).

```svelte
/** @file src/lib/stores/someStore.svelte.ts */
import { browser } from '$app/environment';

function createSomeStore() {
	const state = $state({
		items: [],
		loading: false,
		error: null
	});

	// --- Actions ---
	async function loadItems() { /* ... */ }
	async function updateItem(id, data) { /* ... */ }

	// --- Derived State ---
	const sortedItems = $derived([...state.items].sort(/*...*/));

	// --- Public API ---
	return {
		get items() { return state.items; },
		get loading() { return state.loading; },
		get sortedItems() { return sortedItems; },
		loadItems,
		updateItem
	};
}

export const someStore = createSomeStore();
```

**Database Interaction**

DB operations are async & managed in stores. Use the `request` function from [client.ts](src/lib/graphql/client.ts) for all queries. GraphQL documents are imported from [documents.ts](src/lib/graphql/documents.ts). It is important to keep them all there as the codegen will then automatically generate all types.

**Environment Check**
Start actions (that fetches data or interacts with browser APIs) with a `if (!browser) return;` guard to prevent server-side execution errors!

**Loading/Error State** 
Set `state.loading = true` at the beginning of any data operations and `state.loading = false` in a finally block. Use `state.error` on failure.

**Action Return Value**
Actions that perform mutations should return a consistent result object: `{ success: boolean, message: string, data?: T }`.

**Optimistic Updates**
When you do mutations, modify the state immediately & roll back if the API call fails.

**Pattern**
- Find the item in the local state array
- Create a copy of the original item
- Apply the updates to the local state (the "optimistic" part)
- Execute the request call in a try/catch block
- Success? Update local item with data returned from API (ensure consistency)
- Failure? Revert the item in the local state to its original version and set the error message.

```ts
async function updateList(id, updates) {
	const listIndex = state.lists.findIndex((l) => l.id === id);
	if (listIndex === -1) return { success: false, message: 'Not found' };

	const originalList = { ...state.lists[listIndex] };

	// Optimistic update
	state.lists[listIndex] = { ...originalList, ...updates };

	try {
		const data = await request(UPDATE_LIST, { /*...*/ });
		const updatedList = data.update_lists?.returning?.[0];

		if (!updatedList) {
			// Revert on failed API op.
			state.lists[listIndex] = originalList;
			return { success: false, message: 'Failed to update' };
		}
		// Final update (with server data)
		state.lists[listIndex] = updatedList;
		return { success: true, data: updatedList };
	} catch (error) {
		// Revert on network/request error
		state.lists[listIndex] = originalList;
		return { success: false, message: error.message };
	}
}
```

**Using localStorage**
Use `localStorage` only for non-critical, persistent UI states. Store simple user preferences, like the ID of the last selected item, to improve the user experience across sessions also when mobe app will support offline in the next versions.

Obvious NB: don'y store sensitive info or large/complex data. DB is THE single source of truth for all app's data!!! And always wrap `localStorage` access in a if (browser) check.

Example (from loadBoards):

```ts
// Restore selectedBoard from localStorage
if (state.boards.length > 0) {
    const savedId = localStorage.getItem('selectedBoardId');
    const savedBoard = state.boards.find((b) => b.id === savedId);
    state.selectedBoard = savedBoard || state.boards[0];
}
```

### Routing

At the moment the whole authenticated action goes on in `src/routes/[lang]` but there's no real usage reason for changing language with URL not SEO perspective but as it felt easier to to change it later as app grows to `src/routes/(app)` than implement URL based localisation then I made it like this in the first place.

Next implementation plan in routing:
1. Generate (eg. with PostgreSQL function) automatic username to every user from first name, surname initial and if neccesary use also numbers. Eg. "Tom Woods" could be the first one "tom", many others "tom.w", "tom.p" etc. And then "tom1...9" etc. And let user to change it. Obviously unique.
2. Then we can have nice urls `/user/boardName/cardName` that can be shared

### Error & Success Handling

Use centralised error/success system:

Central state management in [errorSuccess.svelte.ts](src/lib/stores/errorSuccess.svelte.ts)

Display component [ErrorSuccess.svelte](src/lib/components/ui/ErrorSuccess.svelte) renders messages as toast notifications. It is added to the top level [+layout.svelte](src/routes/+layout.svelte) so there's nothing you need to do with it!

**Usage Patterns:**

Error Messages:

```typescript
displayMessage('Something went wrong', 3000); // or default 7000ms for longer messages
```

Success Messages:

```typescript
displayMessage('Operation completed successfully etc. bla bla', 3000, true); // longer than default 1.5sec success for longer success messages & true sets the 'success' as true that is false by default
```

### Localisation

There are some translations but the app is not fully translated due to time limitations. To use multilang:

1. Add your translations to [locales](src/lib/locales) folder
```json
{
    "parent": {
        "translation1": "Lorem",
        "translation2": "Ipsum"
	}
}
```
2. Import `import { t } from '$lib/i18n';`
3. Use eg. `$t('parent.translation')`

## Building

To create a production version of your app: `npm run build`

You can preview the production build with `npm run preview`.