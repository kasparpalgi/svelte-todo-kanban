alter table "public"."boards" alter column "alias" set not null;
alter table "public"."boards" add constraint "boards_alias_key" unique ("alias");
