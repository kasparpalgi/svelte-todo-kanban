CREATE TABLE IF NOT EXISTS "public"."uploads" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "todo_id" uuid NOT NULL, "url" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
