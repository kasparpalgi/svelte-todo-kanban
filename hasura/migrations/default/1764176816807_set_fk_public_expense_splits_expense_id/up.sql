alter table "public"."expense_splits"
  add constraint "expense_splits_expense_id_fkey"
  foreign key ("expense_id")
  references "public"."expenses"
  ("id") on update cascade on delete cascade;
