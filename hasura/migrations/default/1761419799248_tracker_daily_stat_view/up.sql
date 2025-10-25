DROP VIEW IF EXISTS tracker_daily_stats;
CREATE VIEW tracker_daily_stats AS
SELECT 
    s.user_id,
    DATE(start_time) as date,
    a.name as app_name,
    a.category,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_seconds,
    ROUND(SUM(duration_seconds)::numeric / 3600, 2) as total_hours
FROM tracker_sessions s
JOIN tracker_apps a ON s.app_id = a.id
GROUP BY s.user_id, DATE(start_time), a.name, a.category
ORDER BY date DESC, total_seconds DESC;

DROP VIEW IF EXISTS tracker_category_stats;
CREATE VIEW tracker_category_stats AS
SELECT 
    s.user_id,
    DATE(start_time) as date,
    a.category,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_seconds,
    ROUND(SUM(duration_seconds)::numeric / 3600, 2) as total_hours
FROM tracker_sessions s
JOIN tracker_apps a ON s.app_id = a.id
GROUP BY s.user_id, DATE(start_time), a.category
ORDER BY date DESC, total_seconds DESC;
