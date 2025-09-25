# Svelte ToDo app (Kanban)

Modern Kanban ToDo app built according to requirements [requirements](docs/todolist-svelte.md).

## Install

1. Pre-install optional suggestion (use the same Node/npm across devices): `nvm install && nvm use` & `npm ci` & `npm run i-npm` (or pnmp/yarn)
2. Install dependencies: `npm ci`
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
* PostgreSQL for DB. PostgreSQL functions are used where possible for speed and reliability.
* graphql & graphql-request - handling Hasura GraphQL API requests.
* Zod for form validation
* [sveltekit-i18n](https://github.com/sveltekit-i18n/lib) - straightforward sveltekit-i18n solution (tiny library with no external dependencies)

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

## Building

To create a production version of your app: `npm run build`

You can preview the production build with `npm run preview`.