ALTER TABLE "public"."invoices"
  ADD COLUMN "custom_fields" jsonb NOT NULL DEFAULT '[]'::jsonb;
