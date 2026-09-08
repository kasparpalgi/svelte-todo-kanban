drop index "public"."idx_boards_archived_at";

alter table "public"."boards" drop column "archived_at";
