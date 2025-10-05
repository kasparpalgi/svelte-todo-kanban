-- Rollback: Remove GitHub tracking from todos table

-- Drop indexes
DROP INDEX IF EXISTS public.idx_todos_github_issue_number;
DROP INDEX IF EXISTS public.idx_todos_github_issue_id;

-- Drop columns
ALTER TABLE public.todos
  DROP COLUMN IF EXISTS github_url,
  DROP COLUMN IF EXISTS github_synced_at,
  DROP COLUMN IF EXISTS github_issue_id,
  DROP COLUMN IF EXISTS github_issue_number;
