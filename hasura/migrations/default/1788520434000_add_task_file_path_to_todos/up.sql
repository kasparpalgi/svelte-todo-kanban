ALTER TABLE public.todos
  ADD COLUMN task_file_path TEXT;

COMMENT ON COLUMN public.todos.task_file_path IS 'GitHub path of the task file (e.g. doc/todo/001-fixLogin.md or doc/todo/001-fixLogin-TODO.md)';
