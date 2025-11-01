alter table "public"."tracker_category_apps"
  add constraint "tracker_category_apps_category_id_fkey"
  foreign key ("category_id")
  references "public"."tracker_categories"
  ("id") on update cascade on delete cascade;
