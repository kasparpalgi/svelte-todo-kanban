DROP INDEX IF EXISTS idx_notifications_related_news_id;

DELETE FROM notifications WHERE type = 'news';

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('assigned', 'commented', 'edited', 'image_added', 'image_removed', 'comment_edited', 'comment_removed', 'priority_changed'));

ALTER TABLE notifications DROP COLUMN IF EXISTS related_news_id;
ALTER TABLE notifications ALTER COLUMN todo_id SET NOT NULL;

DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS news;
