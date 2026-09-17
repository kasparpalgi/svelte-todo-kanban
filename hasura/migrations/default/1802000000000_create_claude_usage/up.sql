-- Claude usage per Claude Code session (#21/#24). One row per session_id,
-- upserted by the runner on ingest — dedupes re-runs of the same transcript.
CREATE TABLE "public"."claude_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL UNIQUE,
  "todo_id" uuid REFERENCES "public"."todos"("id") ON DELETE SET NULL,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "repo" text,
  "model" text NOT NULL,
  "input_tokens" bigint NOT NULL DEFAULT 0,
  "output_tokens" bigint NOT NULL DEFAULT 0,
  "cache_read_tokens" bigint NOT NULL DEFAULT 0,
  "cache_write_tokens" bigint NOT NULL DEFAULT 0,
  "usage_by_model" jsonb,
  "cost_usd" numeric NOT NULL DEFAULT 0,
  "started_at" timestamptz,
  "ended_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "claude_usage_user_id_idx" ON "public"."claude_usage" ("user_id");
CREATE INDEX "claude_usage_todo_id_idx" ON "public"."claude_usage" ("todo_id");
