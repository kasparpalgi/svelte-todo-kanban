ALTER TABLE accounts RENAME COLUMN provider_account_id TO "providerAccountId";
ALTER TABLE accounts RENAME COLUMN user_id TO "userId";

ALTER TABLE accounts DROP CONSTRAINT accounts_provider_provider_account_id_key;
ALTER TABLE accounts ADD CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId");

ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey;
ALTER TABLE accounts ADD CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions RENAME COLUMN session_token TO "sessionToken";
ALTER TABLE sessions RENAME COLUMN user_id TO "userId";

ALTER TABLE sessions DROP CONSTRAINT sessions_session_token_key;
ALTER TABLE sessions ADD CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken");

ALTER TABLE sessions DROP CONSTRAINT sessions_user_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
