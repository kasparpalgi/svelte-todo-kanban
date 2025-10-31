alter table "public"."tracker_categories"
  add constraint "tracker_categories_parent_id_fkey"
  foreign key ("parent_id")
  references "public"."tracker_categories"
  ("id") on update cascade on delete cascade;
