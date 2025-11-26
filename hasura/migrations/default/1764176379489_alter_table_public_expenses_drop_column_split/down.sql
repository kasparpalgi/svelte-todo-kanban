alter table "public"."expenses" alter column "split" drop not null;
alter table "public"."expenses" add column "split" jsonb;
