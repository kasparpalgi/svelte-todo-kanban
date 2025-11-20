-- Create todo_subscribers table
CREATE TABLE public.todo_subscribers (
  todo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (todo_id, user_id),
  FOREIGN KEY (todo_id) REFERENCES public.todos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_todo_subscribers_todo_id ON public.todo_subscribers(todo_id);
CREATE INDEX idx_todo_subscribers_user_id ON public.todo_subscribers(user_id);

-- Add comment
COMMENT ON TABLE public.todo_subscribers IS 'Users subscribed to todos for notifications';
