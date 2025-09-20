# Svelte ToDo app (Kanban)

## Install

1. `npm i` (or pnmp/yarn)
2. Rename `.env.example` to `.env` and update URL/password and do the same woth `hasura/.env.example`
3. Rename `hasura/config.example.yaml` to `hasura/config.yaml` and update the password. Needed for back-end development only with [Hasura CLI](https://hasura.io/docs/2.0/hasura-cli/overview) but highly suggested to install CLI and then in `hasura` folder you can run `hasura console` for web UI to manage back-end tables/relations, run test API queries and much more.
4. in `hasura` folder run `docker-compose up -d` to run [Hasura (enterprise-grade API engine)](https://hasura.io/)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
