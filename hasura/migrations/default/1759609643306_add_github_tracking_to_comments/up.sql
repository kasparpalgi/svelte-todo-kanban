-- Add GitHub comment tracking to comments table
ALTER TABLE public.comments
  ADD COLUMN github_comment_id BIGINT,
  ADD COLUMN github_synced_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.comments.github_comment_id IS 'GitHub comment ID (for API calls)';
COMMENT ON COLUMN public.comments.github_synced_at IS 'Last sync timestamp with GitHub';

-- Create index for faster lookups by GitHub comment ID
CREATE INDEX idx_comments_github_comment_id ON public.comments(github_comment_id)
  WHERE github_comment_id IS NOT NULL;
