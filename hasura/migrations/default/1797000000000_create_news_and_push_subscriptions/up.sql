-- News broadcasts (admin -> all users) and Web Push subscriptions

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE news IS 'News items broadcast by admins (from ADMIN_EMAILS) to all users';

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

COMMENT ON TABLE push_subscriptions IS 'Web Push (VAPID) subscriptions per user/device';

-- Allow notifications to carry a broadcast news item, not tied to a todo
ALTER TABLE notifications ALTER COLUMN todo_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN related_news_id UUID REFERENCES news(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('assigned', 'commented', 'edited', 'image_added', 'image_removed', 'comment_edited', 'comment_removed', 'priority_changed', 'news'));

CREATE INDEX idx_notifications_related_news_id ON notifications(related_news_id);
