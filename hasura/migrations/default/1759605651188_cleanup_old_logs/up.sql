-- Function to delete logs older than retention period (30 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INT DEFAULT 30)
RETURNS TABLE (deleted_count BIGINT) AS $$
DECLARE
  rows_deleted BIGINT;
BEGIN
  DELETE FROM logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup job comment (to be run by cron or external scheduler)
COMMENT ON FUNCTION cleanup_old_logs IS 'Deletes logs older than specified retention period (default 30 days). Should be called by external cron job daily.';
