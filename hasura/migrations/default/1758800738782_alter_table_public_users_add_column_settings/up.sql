alter table "public"."users" add column "settings" jsonb
 null default '{"defaultView": "kanban"}';
