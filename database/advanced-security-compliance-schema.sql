-- Advanced Security & Compliance Schema
-- This schema implements tables for two-factor authentication, compliance, and security monitoring

-- Two-Factor Authentication
CREATE TABLE user_two_factor_auth (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret_encrypted text NOT NULL,
  backup_codes text[] DEFAULT '{}',
  is_enabled boolean DEFAULT false,
  setup_at timestamptz DEFAULT now(),
  enabled_at timestamptz,
  disabled_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Consent Records (GDPR/CCPA)
CREATE TABLE user_consent_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'functional')),
  granted boolean NOT NULL,
  granted_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now()
);

-- Data Export Requests
CREATE TABLE data_export_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('gdpr', 'ccpa', 'general')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  download_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Data Deletion Requests
CREATE TABLE data_deletion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('gdpr', 'ccpa', 'general')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  retention_period integer DEFAULT 30, -- days
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Privacy Settings
CREATE TABLE user_privacy_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data_processing boolean DEFAULT true,
  marketing boolean DEFAULT false,
  analytics boolean DEFAULT false,
  profile_visibility text DEFAULT 'friends' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  activity_tracking boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  data_retention text DEFAULT 'standard' CHECK (data_retention IN ('standard', 'minimal', 'extended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Security Events Log
CREATE TABLE security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('auth', 'database', 'api', 'network', 'compliance')),
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  session_id text,
  details jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Security Alerts
CREATE TABLE security_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id text NOT NULL UNIQUE,
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blocked IPs
CREATE TABLE blocked_ips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address inet NOT NULL UNIQUE,
  reason text NOT NULL,
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API Key Management
CREATE TABLE api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  name text NOT NULL,
  scopes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  rate_limit_per_hour integer DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT api_keys_owner_check CHECK (
    (user_id IS NOT NULL AND restaurant_id IS NULL) OR
    (user_id IS NULL AND restaurant_id IS NOT NULL)
  )
);

-- Encryption Keys Management
CREATE TABLE encryption_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id text NOT NULL UNIQUE,
  algorithm text NOT NULL DEFAULT 'aes-256-gcm',
  key_size integer NOT NULL DEFAULT 256,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  rotated_at timestamptz,
  expires_at timestamptz
);

-- Security Audit Log
CREATE TABLE security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- Session Management
CREATE TABLE user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token_hash text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Login Attempts Tracking
CREATE TABLE login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean NOT NULL,
  failure_reason text,
  two_factor_used boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

-- Security Configuration
CREATE TABLE security_configuration (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX idx_user_two_factor_auth_user_id ON user_two_factor_auth(user_id);
CREATE INDEX idx_user_consent_records_user_id ON user_consent_records(user_id);
CREATE INDEX idx_user_consent_records_type ON user_consent_records(consent_type);
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_active ON blocked_ips(is_active);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_restaurant_id ON api_keys(restaurant_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- Row Level Security Policies

-- Two-Factor Authentication - Users can only access their own
ALTER TABLE user_two_factor_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own 2FA" ON user_two_factor_auth
  FOR ALL USING (auth.uid() = user_id);

-- User Consent Records - Users can only access their own
ALTER TABLE user_consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own consent records" ON user_consent_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consent records" ON user_consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data Export Requests - Users can only access their own
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own export requests" ON data_export_requests
  FOR ALL USING (auth.uid() = user_id);

-- Data Deletion Requests - Users can only access their own
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own deletion requests" ON data_deletion_requests
  FOR ALL USING (auth.uid() = user_id);

-- User Privacy Settings - Users can only access their own
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own privacy settings" ON user_privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Security Events - Admin only
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can view security events" ON security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Security Alerts - Admin only
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage security alerts" ON security_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Blocked IPs - Admin only
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage blocked IPs" ON blocked_ips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- API Keys - Users can only manage their own
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM restaurant_owners ro
      WHERE ro.user_id = auth.uid() AND ro.restaurant_id = api_keys.restaurant_id
    )
  );

-- User Sessions - Users can only access their own
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Login Attempts - Admin only
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can view login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Functions for Security Operations

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type text,
  p_action text,
  p_status text,
  p_severity text DEFAULT 'medium',
  p_user_id uuid DEFAULT null,
  p_ip_address inet DEFAULT null,
  p_user_agent text DEFAULT null,
  p_session_id text DEFAULT null,
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO security_events (
    event_type, action, status, severity, user_id, 
    ip_address, user_agent, session_id, details
  ) VALUES (
    p_event_type, p_action, p_status, p_severity, p_user_id,
    p_ip_address, p_user_agent, p_session_id, p_details
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alerts
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_id text,
  p_alert_type text,
  p_message text,
  p_severity text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO security_alerts (
    alert_id, alert_type, message, severity, metadata
  ) VALUES (
    p_alert_id, p_alert_type, p_message, p_severity, p_metadata
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old security events (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_security_events(retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  PERFORM log_security_event(
    'database',
    'security_events_cleanup',
    'success',
    'low',
    null,
    null,
    null,
    null,
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block suspicious IPs
CREATE OR REPLACE FUNCTION block_suspicious_ip(
  p_ip_address inet,
  p_reason text,
  p_blocked_by uuid DEFAULT null,
  p_expires_hours integer DEFAULT 24
) RETURNS uuid AS $$
DECLARE
  block_id uuid;
BEGIN
  INSERT INTO blocked_ips (
    ip_address, reason, blocked_by, expires_at
  ) VALUES (
    p_ip_address, p_reason, p_blocked_by, 
    NOW() + INTERVAL '1 hour' * p_expires_hours
  ) RETURNING id INTO block_id;
  
  -- Log the IP blocking
  PERFORM log_security_event(
    'network',
    'ip_blocked',
    'success',
    'high',
    p_blocked_by,
    p_ip_address,
    null,
    null,
    jsonb_build_object('reason', p_reason, 'expires_hours', p_expires_hours)
  );
  
  RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address inet)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips 
    WHERE ip_address = p_ip_address 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic security logging

-- Trigger function for login attempts
CREATE OR REPLACE FUNCTION log_login_attempt_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (
    COALESCE(NEW.email, OLD.email),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    CASE WHEN TG_OP = 'INSERT' THEN true ELSE false END,
    CASE WHEN TG_OP = 'UPDATE' THEN 'Login failed' ELSE null END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Scheduled cleanup job (requires pg_cron extension)
-- SELECT cron.schedule('security-cleanup', '0 2 * * *', 'SELECT cleanup_old_security_events(90);');

-- Insert default security configuration
INSERT INTO security_configuration (config_key, config_value, description) VALUES
  ('two_factor_enforcement', '{"enabled": false, "grace_period_days": 30}', 'Two-factor authentication enforcement settings'),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": true}', 'Password complexity requirements'),
  ('session_timeout', '{"timeout_minutes": 60, "absolute_timeout_hours": 24}', 'Session timeout settings'),
  ('rate_limiting', '{"login_attempts": 5, "api_requests_per_hour": 1000, "window_minutes": 15}', 'Rate limiting configuration'),
  ('ip_blocking', '{"auto_block_enabled": true, "threshold_failures": 10, "block_duration_hours": 24}', 'Automatic IP blocking settings'),
  ('compliance_settings', '{"gdpr_enabled": true, "ccpa_enabled": true, "data_retention_days": 2555}', 'Data compliance settings'),
  ('security_monitoring', '{"threat_detection_enabled": true, "alert_thresholds": {"critical": 1, "high": 5, "medium": 20}}', 'Security monitoring configuration');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
