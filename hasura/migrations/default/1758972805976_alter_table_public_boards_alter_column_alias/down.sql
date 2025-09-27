alter table "public"."boards" drop constraint "boards_alias_key";
alter table "public"."boards" alter column "alias" drop not null;
