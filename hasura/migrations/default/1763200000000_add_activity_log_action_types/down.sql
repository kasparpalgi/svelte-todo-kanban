-- Revert to original action types

-- Drop the extended constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_action_type_check;

-- Add back the original constraint
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
  'due_date_changed'
));
