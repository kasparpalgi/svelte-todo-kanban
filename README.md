# Svelte ToDo app (Kanban)

Modern Kanban ToDo app built according to requirements [requirements](docs/todolist-svelte.md).

## Install

1. `npm i` (or pnmp/yarn)
2. Rename `.env.example` to `.env` and update URL/password and do the same woth `hasura/.env.example`
3. Rename `hasura/config.example.yaml` to `hasura/config.yaml` and update the password. Needed for back-end development only with [Hasura CLI](https://hasura.io/docs/2.0/hasura-cli/overview) but highly suggested to install CLI and then in `hasura` folder you can run `hasura console` for web UI to manage back-end tables/relations, run test API queries and much more.
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