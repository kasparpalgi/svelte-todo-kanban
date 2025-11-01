alter table "public"."tracker_category_apps" alter column "app_id" drop not null;
alter table "public"."tracker_category_apps" add column "app_id" uuid;
