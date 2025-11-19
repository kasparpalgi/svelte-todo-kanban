-- Drop triggers
DROP TRIGGER IF EXISTS set_public_invoice_items_updated_at ON "public"."invoice_items";
DROP TRIGGER IF EXISTS set_public_invoices_updated_at ON "public"."invoices";

-- Drop tables
DROP TABLE IF EXISTS "public"."invoice_items";
DROP TABLE IF EXISTS "public"."invoices";

-- Remove columns from users table
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "invoice_from_details";

-- Remove columns from boards table
ALTER TABLE "public"."boards" DROP COLUMN IF EXISTS "customer_invoice_details";

-- Remove column from todos table
ALTER TABLE "public"."todos" DROP COLUMN IF EXISTS "invoiced_hours";
