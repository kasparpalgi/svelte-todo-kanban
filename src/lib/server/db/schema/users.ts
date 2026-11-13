/** @file src/lib/server/db/schema/users.ts */
// Users and sign-in. Column names in `users`, `accounts` and `verification_tokens` are
// the ones `@auth/d1-adapter` writes. No `sessions` table: sessions are JWTs.
import { sql } from 'drizzle-orm';
import {
	check,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { bool, createdAt, id, json, updatedAt } from './columns';

export const users = sqliteTable(
	'users',
	{
		id: id(),
		name: text(),
		email: text().unique(),
		emailVerified: text(),
		image: text(),
		created_at: createdAt(),
		updated_at: updatedAt(),
		locale: text().notNull().default('et'),
		dark_mode: bool().notNull().default(true),
		// No server secrets: those live in `user_secrets`. Only `tokens.groq` (the browser's own key).
		settings: json<Record<string, unknown>>().notNull().default({ defaultView: 'kanban' }),
		username: text().notNull().unique(),
		default_labels: json<unknown[]>().default([]),
		password: text(),
		invoice_from_details: json(),
		plan: text().notNull().default('free'),
		plan_expires_at: text(),
		stripe_customer_id: text(),
		claude_plan: text(),
		claude_plan_monthly: real(),
		claude_plan_currency: text().default('EUR')
	},
	(t) => [
		check('users_plan_check', sql`${t.plan} IN ('free', 'paid')`),
		check('users_claude_plan_check', sql`${t.claude_plan} IN ('api', 'pro', 'max5x', 'max20x')`)
	]
);

/** Server-only secrets, one row per integration: `github`, `google_calendar`, `openai`,
 * `r2`. In Postgres they sit in `users.settings.tokens` (guarded in code since #230); here a
 * settings save can't touch them (#193). The browser's own `groq` key stays in `settings`. */
export const user_secrets = sqliteTable(
	'user_secrets',
	{
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		// The token object as stored today, e.g. `{ encrypted, username, connectedAt }`.
		value: json<Record<string, unknown>>().notNull(),
		updated_at: updatedAt()
	},
	(t) => [primaryKey({ columns: [t.user_id, t.name] })]
);

export const accounts = sqliteTable(
	'accounts',
	{
		id: id(),
		userId: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text().notNull(),
		provider: text().notNull(),
		providerAccountId: text().notNull(),
		refresh_token: text(),
		access_token: text(),
		expires_at: integer(),
		token_type: text(),
		scope: text(),
		id_token: text(),
		session_state: text(),
		// Written by @auth/d1-adapter's linkAccount; null for OAuth 2 providers.
		oauth_token: text(),
		oauth_token_secret: text(),
		created_at: createdAt(),
		updated_at: updatedAt()
	},
	(t) => [uniqueIndex('accounts_provider_account_key').on(t.provider, t.providerAccountId)]
);

export const verification_tokens = sqliteTable(
	'verification_tokens',
	{
		identifier: text().notNull(),
		token: text().notNull(),
		expires: text().notNull(),
		created_at: createdAt()
	},
	(t) => [primaryKey({ columns: [t.identifier, t.token] })]
);
