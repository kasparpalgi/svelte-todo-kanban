CREATE TABLE "public"."invoice_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL,
  "todo_id" uuid,
  "title" text NOT NULL,
  "hours" numeric(10,2) NOT NULL DEFAULT 0,
  "hourly_rate" numeric(10,2) NOT NULL DEFAULT 0,
  "amount" numeric(10,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" ("invoice_id");
CREATE INDEX "idx_invoice_items_todo_id" ON "public"."invoice_items" ("todo_id");
