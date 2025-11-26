alter table "public"."expense_splits"
  add constraint "expense_splits_user_id_fkey"
  foreign key ("user_id")
  references "public"."users"
  ("id") on update restrict on delete restrict;
