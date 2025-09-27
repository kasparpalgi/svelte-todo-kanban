alter table "public"."users" alter column "username" set not null;
alter table "public"."users" add constraint "users_username_key" unique ("username");
