alter table "public"."tracker_category_apps"
  add constraint "tracker_category_apps_app_id_fkey"
  foreign key ("app_id")
  references "public"."tracker_apps"
  ("id") on update cascade on delete cascade;
