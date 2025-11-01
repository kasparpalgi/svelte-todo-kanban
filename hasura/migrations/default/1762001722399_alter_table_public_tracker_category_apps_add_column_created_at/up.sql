alter table "public"."tracker_category_apps" add column "created_at" timestamptz
 not null default now();
