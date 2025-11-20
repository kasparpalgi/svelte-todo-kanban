-- Drop indexes
DROP INDEX IF EXISTS public.idx_todo_subscribers_user_id;
DROP INDEX IF EXISTS public.idx_todo_subscribers_todo_id;

-- Drop table
DROP TABLE IF EXISTS public.todo_subscribers;
