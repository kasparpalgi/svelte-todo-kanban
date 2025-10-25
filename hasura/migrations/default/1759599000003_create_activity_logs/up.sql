-- Create activity_logs table for complete audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'completed', 'uncompleted', 'assigned', 'unassigned', 'commented', 'comment_edited', 'comment_deleted', 'image_added', 'image_removed', 'priority_changed', 'due_date_changed')),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_todo_id ON activity_logs(todo_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_todo_created ON activity_logs(todo_id, created_at DESC);

COMMENT ON TABLE activity_logs IS 'Complete audit trail of all user actions on todos';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action performed: created, updated, deleted, completed, uncompleted, assigned, unassigned, commented, etc.';
COMMENT ON COLUMN activity_logs.changes IS 'JSON object with all field changes for complex actions';
