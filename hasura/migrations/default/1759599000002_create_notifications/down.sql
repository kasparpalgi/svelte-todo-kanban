-- Drop notifications table and related indexes
DROP TRIGGER IF EXISTS set_notifications_updated_at ON notifications;
DROP TABLE IF EXISTS notifications;
