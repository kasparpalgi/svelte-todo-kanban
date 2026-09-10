CREATE TABLE "public"."invoice_companies" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "address" text,
  "vat_number" text,
  "vat_rate" numeric(5,2) NOT NULL DEFAULT 0,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "idx_invoice_companies_user_id" ON "public"."invoice_companies" ("user_id");

ALTER TABLE "public"."invoices"
  ADD COLUMN "company_id" uuid REFERENCES "public"."invoice_companies"("id") ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX "idx_invoices_company_id" ON "public"."invoices" ("company_id");

ALTER TABLE "public"."clients"
  ADD COLUMN "linked_user_id" uuid REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX "idx_clients_linked_user_id" ON "public"."clients" ("linked_user_id");
