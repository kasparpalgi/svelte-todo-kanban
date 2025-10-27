ALTER TABLE tracker_sessions 
ADD CONSTRAINT tracker_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
