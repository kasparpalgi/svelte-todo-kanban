CREATE TABLE "public"."tracker_keywords" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "board_id" uuid NOT NULL, "keyword" text NOT NULL, "case_sensitive" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") );
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_tracker_keywords_updated_at"
BEFORE UPDATE ON "public"."tracker_keywords"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_tracker_keywords_updated_at" ON "public"."tracker_keywords"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
