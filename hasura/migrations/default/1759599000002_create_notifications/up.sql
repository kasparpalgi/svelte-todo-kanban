-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('assigned', 'commented', 'edited', 'image_added', 'image_removed', 'comment_edited', 'comment_removed', 'priority_changed')),
  triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure we don't create duplicate notifications for the same action
  CONSTRAINT notifications_no_self_notify CHECK (user_id != triggered_by_user_id OR triggered_by_user_id IS NULL)
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_todo_id ON notifications(todo_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE PROCEDURE set_current_timestamp_updated_at();

COMMENT ON TABLE notifications IS 'Notifications for user actions on todos (assignments, comments, edits, etc.)';
COMMENT ON COLUMN notifications.type IS 'Type of notification: assigned, commented, edited, image_added, image_removed, comment_edited, comment_removed, priority_changed';
COMMENT ON COLUMN notifications.is_read IS 'Whether user has read this notification';
