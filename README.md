# Svelte ToDo app (Kanban)

Modern Kanban ToDo app built according to requirements [requirements](docs/todolist-svelte.md).

## Install

1. `npm i` (or pnmp/yarn)
2. Rename `.env.example` to `.env` and update URL/password and do the same woth `hasura/.env.example`. Also, `.env.test.example` to `.env.test` (needed for Playwright testing Auth.js).
3. Set up backend.
   1. In `hasura` folder run `docker-compose up -d` to run [Hasura (enterprise-grade API engine)](https://hasura.io/)
   2. Rename `hasura/config.example.yaml` to `hasura/config.yaml` and update the password. 
   3. Install [Hasura CLI](https://hasura.io/docs/2.0/hasura-cli/install-hasura-cli/)
   4. Run `hasura migrate apply --all-databases` and `hasura metadata apply`
   5. If you want to test with some seed data, do `hasura seed apply` and if you have in your `.env` the `NODE_ENV` set to `development` then you are also able to access Auth.js built-in sign-in page at `/auth/signin` where you can login with `test@test.com` below in the test login section. It is also suggested to delete the test yser in production and do the testing with actually signed up accounts.
   6. You can run `hasura console` for web UI to manage back-end tables/relations, run test API queries and much more.
4. Always good idea to see if all works now: `npm run test`

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

## Building

To create a production version of your app: `npm run build`

You can preview the production build with `npm run preview`.