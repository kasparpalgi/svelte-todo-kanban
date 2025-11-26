CREATE TABLE "public"."expense_splits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "expense_id" uuid NOT NULL, "user_id" uuid NOT NULL, "amount" numeric NOT NULL, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
