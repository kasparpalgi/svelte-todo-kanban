CREATE TABLE IF NOT EXISTS "public"."notes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "board_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL DEFAULT 'Untitled Note',
  "content" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "notes_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE,
  CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE TRIGGER "set_public_notes_updated_at"
BEFORE UPDATE ON "public"."notes"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_notes_updated_at" ON "public"."notes"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE INDEX IF NOT EXISTS "notes_board_id_idx" ON "public"."notes" ("board_id");
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "public"."notes" ("user_id");
CREATE INDEX IF NOT EXISTS "notes_sort_order_idx" ON "public"."notes" ("sort_order");
