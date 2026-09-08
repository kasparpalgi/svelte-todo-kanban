ALTER TABLE "public"."boards" ADD COLUMN "client_id" uuid NULL;

ALTER TABLE "public"."boards"
  ADD CONSTRAINT "fk_boards_client_id"
  FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX "idx_boards_client_id" ON "public"."boards" ("client_id");
