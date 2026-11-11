CREATE OR REPLACE FUNCTION public.todo_content_preview(todo_row public.todos)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT left(todo_row.content, 300)
$$;
