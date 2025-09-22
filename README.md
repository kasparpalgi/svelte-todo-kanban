# Svelte ToDo app (Kanban)

Modern Kanban ToDo app built according to requirements [requirements](docs/todolist-svelte.md).

## Install

1. `npm i` (or pnmp/yarn)
2. Rename `.env.example` to `.env` and update URL/password and do the same woth `hasura/.env.example`
3. Set up backend.
   1. Rename `hasura/config.example.yaml` to `hasura/config.yaml` and update the password. 
   2. Install [Hasura CLI](https://hasura.io/docs/2.0/hasura-cli/install-hasura-cli/)
   3. Run `hasura migrate apply --all-databases` and `hasura metadata apply`
   4. If you want to test with some seed data, do `hasura seed apply` and if you have in your `.env` the `NODE_ENV` set to `development` then you are also able to access Auth.js built-in sign-in page at `/auth/signin` where you can login with `test@test.com` below in the test login section. It is also suggested to delete the test yser in production and do the testing with actually signed up accounts.
   5. You can run `hasura console` for web UI to manage back-end tables/relations, run test API queries and much more.
4. in `hasura` folder run `docker-compose up -d` to run [Hasura (enterprise-grade API engine)](https://hasura.io/)

Fresh re-install Svelte: `npm run cu` (Unix-like), `npm run cw` (Windows).

## Dependencies

* [Auth.js](https://authjs.dev/) - for authentication
* [nodemailer](https://nodemailer.com/) - sending email
* [@dnd-kit](https://dnd-kit-svelte.vercel.app/) - drag'n'drop (for Kanban)
* [shadcn-svelte](https://shadcn-svelte.com/) - set of beautifully-designed, accessible components. Adding components: `npx shadcn-svelte add <COMPONENT>`
* [lucide-svelte icons](https://lucide.dev/icons/)
* PostgreSQL for DB
* graphql & graphql-request - handling Hasura GraphQL API requests from SvelteKit REST API endpoints

## Developing

Once installed, run:  `npm run dev -- --open`

## Building

To create a production version of your app: `npm run build`

You can preview the production build with `npm run preview`.