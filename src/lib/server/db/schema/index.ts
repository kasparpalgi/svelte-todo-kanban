/** @file src/lib/server/db/schema/index.ts */
// The D1 schema (#232). Change a table here, then `npx drizzle-kit generate` and
// `npx wrangler d1 migrations apply <db> --remote`. Nothing reads D1 yet (#233).
export * from './users';
export * from './boards';
export * from './cards';
export * from './activity';
export * from './notes';
export * from './money';
export * from './extras';
