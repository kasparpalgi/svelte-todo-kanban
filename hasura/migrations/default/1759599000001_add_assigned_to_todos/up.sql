-- Add assigned_to column to todos table
ALTER TABLE todos ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);

-- Comment
COMMENT ON COLUMN todos.assigned_to IS 'User this todo is assigned to (null if unassigned)';
