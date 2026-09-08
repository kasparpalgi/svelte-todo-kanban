DROP TABLE IF EXISTS "public"."invoice_items";
DROP TABLE IF EXISTS "public"."invoices";

CREATE TABLE "public"."invoices" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "board_id" uuid NOT NULL,
  "invoice_number" text NOT NULL,
  "issued_date" date NOT NULL DEFAULT CURRENT_DATE,
  "due_date" date,
  "currency" text NOT NULL DEFAULT 'EUR',
  "hourly_rate" numeric(10,2) NOT NULL DEFAULT 0,
  "total_hours" numeric(10,2) NOT NULL DEFAULT 0,
  "total_amount" numeric(10,2) NOT NULL DEFAULT 0,
  "notes" text,
  "status" text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "idx_invoices_user_id" ON "public"."invoices" ("user_id");
CREATE INDEX "idx_invoices_client_id" ON "public"."invoices" ("client_id");
CREATE INDEX "idx_invoices_board_id" ON "public"."invoices" ("board_id");
CREATE UNIQUE INDEX "idx_invoices_invoice_number_user" ON "public"."invoices" ("user_id", "invoice_number");
