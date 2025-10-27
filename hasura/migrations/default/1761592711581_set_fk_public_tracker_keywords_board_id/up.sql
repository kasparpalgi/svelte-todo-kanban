alter table "public"."tracker_keywords"
  add constraint "tracker_keywords_board_id_fkey"
  foreign key ("board_id")
  references "public"."boards"
  ("id") on update cascade on delete cascade;
