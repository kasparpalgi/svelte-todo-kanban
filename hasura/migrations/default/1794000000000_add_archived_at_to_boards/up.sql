alter table "public"."boards" add column "archived_at" timestamptz null;

create index "idx_boards_archived_at" on "public"."boards" ("archived_at");
