-- Multi-user assignment: a todo can be assigned to many users.
-- todo_assignees holds the COMPLETE set of assignees. todos.assigned_to is kept
-- as the "primary" assignee (one of the rows here) for backward compatibility
-- (GitHub webhook single-notify, existing activity logs). The app maintains the
-- invariant that assigned_to, when set, always matches a row in this table.
CREATE TABLE public.todo_assignees (
  todo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (todo_id, user_id),
  FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Indexes for query performance
CREATE INDEX idx_todo_assignees_todo_id ON public.todo_assignees(todo_id);
CREATE INDEX idx_todo_assignees_user_id ON public.todo_assignees(user_id);

COMMENT ON TABLE public.todo_assignees IS 'Users assigned to todos (many-to-many). todos.assigned_to holds the primary assignee.';

-- Backfill: every existing single assignee becomes a row here.
INSERT INTO public.todo_assignees (todo_id, user_id)
SELECT id, assigned_to
FROM public.todos
WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;
