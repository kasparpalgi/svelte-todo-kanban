CREATE TABLE IF NOT EXISTS "public"."note_uploads" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "note_id" uuid NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "note_uploads_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "note_uploads_note_id_idx" ON "public"."note_uploads" ("note_id");
