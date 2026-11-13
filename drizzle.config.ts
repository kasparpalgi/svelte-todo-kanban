// D1 schema → SQL migrations (#232): `npx drizzle-kit generate --name <change>`, then
// `npx wrangler d1 migrations apply todzz --remote` (and `--env staging` for todzz-staging).
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema/index.ts',
	out: './drizzle'
});
