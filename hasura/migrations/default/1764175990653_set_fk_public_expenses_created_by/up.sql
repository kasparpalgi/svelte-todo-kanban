alter table "public"."expenses"
  add constraint "expenses_created_by_fkey"
  foreign key ("created_by")
  references "public"."users"
  ("id") on update restrict on delete restrict;
