-- Table to track IP addresses for anonymous account creation
CREATE TABLE anonymous_ip_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index the IP address to make lookups fast
CREATE INDEX idx_anonymous_ip_logs_ip ON anonymous_ip_logs(ip_address);
CREATE INDEX idx_anonymous_ip_logs_created_at ON anonymous_ip_logs(created_at DESC);

-- Function to check and increment the IP count (Max 3 per IP)
CREATE OR REPLACE FUNCTION increment_anonymous_ip_count(client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Count existing anonymous accounts from this IP (since ever, or we could limit by time)
    SELECT COUNT(*) INTO current_count
    FROM anonymous_ip_logs
    WHERE ip_address = client_ip;

    -- If there are 3 or more records, deny the creation
    IF current_count >= 3 THEN
        RETURN FALSE;
    END IF;

    -- Otherwise, log it and allow
    INSERT INTO anonymous_ip_logs (ip_address) VALUES (client_ip);
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
