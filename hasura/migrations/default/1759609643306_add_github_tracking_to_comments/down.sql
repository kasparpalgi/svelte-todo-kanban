-- Rollback: Remove GitHub tracking from comments table

-- Drop index
DROP INDEX IF EXISTS public.idx_comments_github_comment_id;

-- Drop columns
ALTER TABLE public.comments
  DROP COLUMN IF EXISTS github_synced_at,
  DROP COLUMN IF EXISTS github_comment_id;
