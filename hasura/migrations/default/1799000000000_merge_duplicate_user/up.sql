-- Merge duplicate Kaspar user accounts
-- Gmail user (3dd76df3, kaspar.lemmo@gmail.com) had all boards but wrong email
-- e-stonia user (87130678, kaspar@e-stonia.co.uk) is the intended primary account
-- This migration moves all data from Gmail user to e-stonia user, then deletes Gmail user

DO $$
DECLARE
  old_id uuid := '3dd76df3-322a-481f-b7a6-67adf68e7b08';  -- kaspar.lemmo@gmail.com
  new_id uuid := '87130678-bfc1-421d-9c40-7724a3cb13cb';  -- kaspar@e-stonia.co.uk
BEGIN

  -- Transfer owned boards
  UPDATE boards SET user_id = new_id WHERE user_id = old_id;

  -- Transfer board memberships
  UPDATE board_members SET user_id = new_id WHERE user_id = old_id;

  -- Transfer todos (creator)
  UPDATE todos SET user_id = new_id WHERE user_id = old_id;

  -- Transfer todos (assigned_to)
  UPDATE todos SET assigned_to = new_id WHERE assigned_to = old_id;

  -- Transfer todo_assignees
  UPDATE todo_assignees SET user_id = new_id WHERE user_id = old_id;

  -- Transfer comments
  UPDATE comments SET user_id = new_id WHERE user_id = old_id;

  -- Transfer activity_logs
  UPDATE activity_logs SET user_id = new_id WHERE user_id = old_id;

  -- Transfer notifications
  UPDATE notifications SET user_id = new_id WHERE user_id = old_id;

  -- Transfer logs
  UPDATE logs SET user_id = new_id WHERE user_id = old_id;

  -- Transfer notes
  UPDATE notes SET user_id = new_id WHERE user_id = old_id;

  -- Transfer board_invitations (as inviter)
  UPDATE board_invitations SET inviter_id = new_id WHERE inviter_id = old_id;

  -- Transfer tracker data
  UPDATE tracker_sessions SET user_id = new_id WHERE user_id = old_id;
  UPDATE tracker_apps SET user_id = new_id WHERE user_id = old_id;
  UPDATE tracker_categories SET user_id = new_id WHERE user_id = old_id;
  UPDATE tracker_category_apps SET user_id = new_id WHERE user_id = old_id;
  -- tracker_category_stats and tracker_daily_stats are views; their underlying data migrates via tracker_sessions

  -- Transfer other user-owned data
  UPDATE clients SET user_id = new_id WHERE user_id = old_id;
  UPDATE invoices SET user_id = new_id WHERE user_id = old_id;
  UPDATE invoice_companies SET user_id = new_id WHERE user_id = old_id;
  UPDATE podcasts SET user_id = new_id WHERE user_id = old_id;
  UPDATE push_subscriptions SET user_id = new_id WHERE user_id = old_id;
  UPDATE expense_splits SET user_id = new_id WHERE user_id = old_id;
  UPDATE expenses SET created_by = new_id WHERE created_by = old_id;
  UPDATE url_shortcuts SET user_id = new_id WHERE user_id = old_id;
  UPDATE todo_subscribers SET user_id = new_id WHERE user_id = old_id;

  -- Transfer the Gmail Google OAuth account to e-stonia user
  -- (so logging in with Gmail Google also works)
  UPDATE accounts SET "userId" = new_id WHERE "userId" = old_id;

  -- Delete sessions for old user (JWT strategy, so these are unused but clean up anyway)
  DELETE FROM sessions WHERE "userId" = old_id;

  -- Delete the now-empty Gmail user (must happen before updating username to 'kaspar')
  DELETE FROM users WHERE id = old_id;

  -- Update e-stonia user profile (username 'kaspar' is now available after old user deleted)
  UPDATE users SET
    name = 'Kaspar Palgi',
    username = 'kaspar',
    image = 'https://i.imgur.com/b9hxDbH.png'
  WHERE id = new_id;

END $$;
