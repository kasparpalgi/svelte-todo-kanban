ALTER TABLE tracker_apps 
ADD CONSTRAINT tracker_apps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
