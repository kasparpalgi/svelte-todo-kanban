alter table "public"."lists" alter column "user_id" drop not null;
alter table "public"."lists" add column "user_id" uuid;
