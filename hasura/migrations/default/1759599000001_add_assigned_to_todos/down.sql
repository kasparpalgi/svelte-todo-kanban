-- Drop the index and column
DROP INDEX IF EXISTS idx_todos_assigned_to;
ALTER TABLE todos DROP COLUMN IF EXISTS assigned_to;
