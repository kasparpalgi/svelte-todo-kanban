-- Create logs table for application logging
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_user_id ON logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_logs_component ON logs(component);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- Add comment to table
COMMENT ON TABLE logs IS 'Application logs with structured data for debugging and monitoring';
