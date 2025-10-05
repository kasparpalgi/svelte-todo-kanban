-- Add GitHub issue tracking to todos table
ALTER TABLE public.todos
  ADD COLUMN github_issue_number INTEGER,
  ADD COLUMN github_issue_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ,
  ADD COLUMN github_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.todos.github_issue_number IS 'GitHub issue number (human-readable, e.g., 42)';
COMMENT ON COLUMN public.todos.github_issue_id IS 'GitHub internal issue ID (immutable, for API calls)';
COMMENT ON COLUMN public.todos.github_synced_at IS 'Last sync timestamp with GitHub';
COMMENT ON COLUMN public.todos.github_url IS 'Direct URL to GitHub issue';

-- Create index for faster lookups by GitHub issue ID
CREATE INDEX idx_todos_github_issue_id ON public.todos(github_issue_id)
  WHERE github_issue_id IS NOT NULL;

-- Create index for faster lookups by issue number
CREATE INDEX idx_todos_github_issue_number ON public.todos(github_issue_number)
  WHERE github_issue_number IS NOT NULL;
