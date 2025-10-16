alter table "public"."todos" add constraint "priority" check (priority::text = ANY (
  ARRAY[
    'low'::character varying::text,
    'medium'::character varying::text,
    'high'::character varying::text,
    NULL::text
  ]
));
