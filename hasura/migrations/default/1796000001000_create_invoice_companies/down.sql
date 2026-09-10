ALTER TABLE "public"."clients" DROP COLUMN IF EXISTS "linked_user_id";
ALTER TABLE "public"."invoices" DROP COLUMN IF EXISTS "company_id";
DROP TABLE IF EXISTS "public"."invoice_companies";
