CREATE TABLE "public"."clients" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "company_name" text,
  "email" text,
  "phone" text,
  "address" text,
  "vat_number" text,
  "currency" text NOT NULL DEFAULT 'EUR',
  "default_rate" numeric(10,2),
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX "idx_clients_user_id" ON "public"."clients" ("user_id");
