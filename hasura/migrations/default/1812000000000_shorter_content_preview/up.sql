-- #222: 150 characters render the same card face as 300 on every tekdok card
-- (the face shows ~50 plain-text characters), at half the bytes.
CREATE OR REPLACE FUNCTION public.todo_content_preview(todo_row public.todos)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT left(todo_row.content, 150)
$$;
