CREATE OR REPLACE FUNCTION public.set_todo_alias()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.alias := generate_unique_alias_for_user_todo(NEW.title, NEW.user_id);
  RETURN NEW;
END;
$function$;
