alter table "public"."tracker_keywords"
  add constraint "tracker_keywords_category_id_fkey"
  foreign key ("category_id")
  references "public"."tracker_categories"
  ("id") on update cascade on delete cascade;
