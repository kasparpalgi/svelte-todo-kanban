-- Tracker Schema - Uses tracker_* prefix to avoid conflicts with auth tables

-- Create tracker app names table
CREATE TABLE IF NOT EXISTS tracker_apps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'Other',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tracker sessions table (won't conflict with auth.js sessions)
CREATE TABLE IF NOT EXISTS tracker_sessions (
    id SERIAL PRIMARY KEY,
    app_id INTEGER NOT NULL REFERENCES tracker_apps(id) ON DELETE CASCADE,
    window_title TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_app_id ON tracker_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_start_time ON tracker_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_end_time ON tracker_sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_tracker_apps_category ON tracker_apps(category);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracker_sessions_updated_at 
BEFORE UPDATE ON tracker_sessions
FOR EACH ROW EXECUTE FUNCTION update_tracker_updated_at();

-- Analytics view: daily summary
CREATE OR REPLACE VIEW tracker_daily_stats AS
SELECT 
    DATE(start_time) as date,
    a.name as app_name,
    a.category,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_seconds,
    ROUND(SUM(duration_seconds)::numeric / 3600, 2) as total_hours
FROM tracker_sessions s
JOIN tracker_apps a ON s.app_id = a.id
GROUP BY DATE(start_time), a.name, a.category
ORDER BY date DESC, total_seconds DESC;

-- Analytics view: category summary
CREATE OR REPLACE VIEW tracker_category_stats AS
SELECT 
    DATE(start_time) as date,
    a.category,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_seconds,
    ROUND(SUM(duration_seconds)::numeric / 3600, 2) as total_hours
FROM tracker_sessions s
JOIN tracker_apps a ON s.app_id = a.id
GROUP BY DATE(start_time), a.category
ORDER BY date DESC, total_seconds DESC;
