alter table "public"."tracker_categories"
  add constraint "tracker_categories_user_id_fkey"
  foreign key ("user_id")
  references "public"."users"
  ("id") on update cascade on delete cascade;
