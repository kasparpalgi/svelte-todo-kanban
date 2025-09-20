alter table "public"."todos"
  add constraint "todos_list_id_fkey"
  foreign key ("list_id")
  references "public"."lists"
  ("id") on update cascade on delete cascade;
