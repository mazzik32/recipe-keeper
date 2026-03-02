-- Create table to log API requests for rate limiting
CREATE TABLE rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- e.g., the IP address
    route_group TEXT NOT NULL, -- e.g., 'auth', 'api'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups and cleanup
CREATE INDEX idx_rate_limit_logs_lookup ON rate_limit_logs(identifier, route_group, created_at);
CREATE INDEX idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);

-- Function to atomically check and enforce rate limit
-- Returns TRUE if allowed (request logged), FALSE if blocked (limit exceeded)
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_route_group TEXT,
    p_max_requests INTEGER,
    p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_requests INTEGER;
    window_start TIMESTAMPTZ;
BEGIN
    window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    -- Count existing requests in the time window
    SELECT COUNT(*) 
    INTO current_requests
    FROM rate_limit_logs
    WHERE identifier = p_identifier 
      AND route_group = p_route_group 
      AND created_at >= window_start;

    -- If limit exceeded, deny
    IF current_requests >= p_max_requests THEN
        RETURN FALSE;
    END IF;

    -- Otherwise, log the new request and allow
    INSERT INTO rate_limit_logs (identifier, route_group) 
    VALUES (p_identifier, p_route_group);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit logs (can be called periodically, e.g., via pg_cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs(p_retention_minutes INTEGER DEFAULT 60) 
RETURNS VOID AS $$
BEGIN
    DELETE FROM rate_limit_logs 
    WHERE created_at < NOW() - (p_retention_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
