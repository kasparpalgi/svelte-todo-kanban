-- #211: the board loads a light card fragment. The card face shows ~50 plain-text
-- characters of the body, so it reads this preview instead of the whole content.
CREATE OR REPLACE FUNCTION public.todo_content_preview(todo_row public.todos)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT left(todo_row.content, 300)
$$;

-- An edited comment must move comments.updated_at, or the board fingerprint (which
-- reads max(comments.updated_at)) never sees the edit.
DROP TRIGGER IF EXISTS set_public_comments_updated_at ON public.comments;
CREATE TRIGGER set_public_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
