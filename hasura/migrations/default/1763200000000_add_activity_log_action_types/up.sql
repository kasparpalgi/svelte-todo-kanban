-- Add new action types to activity_logs table

-- Drop the existing constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_type_check;

-- Add the new constraint with additional action types
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_action_type_check
CHECK (action_type IN (
  'created',
  'updated',
  'deleted',
  'completed',
  'uncompleted',
  'assigned',
  'unassigned',
  'commented',
  'comment_edited',
  'comment_deleted',
  'image_added',
  'image_removed',
  'priority_changed',
  'due_date_changed',
  'list_moved',
  'title_changed',
  'content_updated',
  'hours_changed'
));

COMMENT ON CONSTRAINT activity_logs_action_type_check ON activity_logs IS 'Valid action types including list moves, title changes, content updates, and time tracking changes';
