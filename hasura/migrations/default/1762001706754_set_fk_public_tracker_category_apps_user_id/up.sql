alter table "public"."tracker_category_apps"
  add constraint "tracker_category_apps_user_id_fkey"
  foreign key ("user_id")
  references "public"."users"
  ("id") on update cascade on delete cascade;
