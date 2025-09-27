alter table "public"."users" drop constraint "users_username_key";
alter table "public"."users" alter column "username" drop not null;
