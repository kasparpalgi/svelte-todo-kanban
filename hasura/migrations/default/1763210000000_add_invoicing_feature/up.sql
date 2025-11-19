-- Add invoiced_hours field to todos table
ALTER TABLE "public"."todos" ADD COLUMN "invoiced_hours" numeric DEFAULT 0;
COMMENT ON COLUMN "public"."todos"."invoiced_hours" IS 'Hours that have been invoiced for this todo';

-- Add customer_invoice_details to boards table (using jsonb for flexibility)
ALTER TABLE "public"."boards" ADD COLUMN "customer_invoice_details" jsonb;
COMMENT ON COLUMN "public"."boards"."customer_invoice_details" IS 'Customer invoice details: company_name, code, vat, address, contact_details, hourly_rate';

-- Add invoice_from_details to users table (using jsonb for flexibility)
ALTER TABLE "public"."users" ADD COLUMN "invoice_from_details" jsonb;
COMMENT ON COLUMN "public"."users"."invoice_from_details" IS 'Invoice from details: company_name, code, vat, address, contact_details';

-- Create invoices table
CREATE TABLE "public"."invoices" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "invoice_number" text NOT NULL,
    "board_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "invoice_date" date NOT NULL DEFAULT CURRENT_DATE,
    "due_date" date,
    "status" text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    "customer_details" jsonb NOT NULL,
    "invoice_from_details" jsonb NOT NULL,
    "subtotal" numeric NOT NULL DEFAULT 0,
    "tax_rate" numeric DEFAULT 0,
    "tax_amount" numeric DEFAULT 0,
    "total" numeric NOT NULL DEFAULT 0,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "invoices_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "invoices_board_id_idx" ON "public"."invoices" ("board_id");
CREATE INDEX "invoices_user_id_idx" ON "public"."invoices" ("user_id");
CREATE INDEX "invoices_invoice_number_idx" ON "public"."invoices" ("invoice_number");
CREATE INDEX "invoices_status_idx" ON "public"."invoices" ("status");
CREATE UNIQUE INDEX "invoices_invoice_number_user_id_key" ON "public"."invoices" ("invoice_number", "user_id");

COMMENT ON TABLE "public"."invoices" IS 'Invoices for boards';
COMMENT ON COLUMN "public"."invoices"."invoice_number" IS 'Human-readable invoice number';
COMMENT ON COLUMN "public"."invoices"."customer_details" IS 'Customer details at time of invoice creation';
COMMENT ON COLUMN "public"."invoices"."invoice_from_details" IS 'Invoice from details at time of invoice creation';

-- Create invoice_items table
CREATE TABLE "public"."invoice_items" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "invoice_id" uuid NOT NULL,
    "todo_id" uuid,
    "description" text NOT NULL,
    "hours" numeric NOT NULL DEFAULT 0,
    "rate" numeric NOT NULL DEFAULT 0,
    "amount" numeric NOT NULL DEFAULT 0,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "invoice_items_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX "invoice_items_invoice_id_idx" ON "public"."invoice_items" ("invoice_id");
CREATE INDEX "invoice_items_todo_id_idx" ON "public"."invoice_items" ("todo_id");

COMMENT ON TABLE "public"."invoice_items" IS 'Line items for invoices (both todo items and custom rows)';
COMMENT ON COLUMN "public"."invoice_items"."todo_id" IS 'Reference to todo if this is a todo item (null for custom rows)';
COMMENT ON COLUMN "public"."invoice_items"."description" IS 'Item description (todo title for todo items, custom text for custom rows)';

-- Create trigger to update updated_at on invoices
CREATE TRIGGER set_public_invoices_updated_at
    BEFORE UPDATE ON "public"."invoices"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Create trigger to update updated_at on invoice_items
CREATE TRIGGER set_public_invoice_items_updated_at
    BEFORE UPDATE ON "public"."invoice_items"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();
