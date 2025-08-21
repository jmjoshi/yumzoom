-- Enable pgcrypto extension for key generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a table to store API key metadata
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    key_hash TEXT NOT NULL
);

-- Function to create a new service key
CREATE OR REPLACE FUNCTION create_service_key(key_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_key TEXT;
    key_expiry TIMESTAMPTZ;
BEGIN
    -- Generate new key
    new_key := encode(gen_random_bytes(32), 'base64');
    key_expiry := NOW() + INTERVAL '90 days';
    
    -- Store key metadata
    INSERT INTO api_keys (name, expires_at, key_hash)
    VALUES (key_name, key_expiry, crypt(new_key, gen_salt('bf')));
    
    RETURN new_key;
END;
$$;

-- Function to revoke a service key
CREATE OR REPLACE FUNCTION revoke_service_key(key_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE api_keys
    SET revoked_at = NOW()
    WHERE name = key_name
    AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- Function to get service keys metadata
CREATE OR REPLACE FUNCTION get_service_keys()
RETURNS TABLE (
    name TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        name,
        created_at,
        expires_at,
        revoked_at IS NOT NULL as is_revoked
    FROM api_keys
    ORDER BY created_at DESC;
$$;

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service_role can access api_keys"
    ON api_keys
    FOR ALL
    USING (auth.role() = 'service_role');
