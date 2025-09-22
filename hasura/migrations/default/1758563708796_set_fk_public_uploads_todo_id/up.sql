alter table "public"."uploads"
  add constraint "uploads_todo_id_fkey"
  foreign key ("todo_id")
  references "public"."todos"
  ("id") on update cascade on delete cascade;
