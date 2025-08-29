-- Feature Flags System Schema
-- This schema provides a comprehensive feature flag system for YumZoom

-- Feature flags table - stores all feature flags and their states
CREATE TABLE feature_flags (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE, -- Unique identifier for the feature (e.g., 'social_features', 'gamification')
    display_name text NOT NULL, -- Human-readable name (e.g., 'Social Features', 'Gamification System')
    description text, -- Detailed description of what the feature does
    category text NOT NULL DEFAULT 'general', -- Category for organization (e.g., 'social', 'gamification', 'analytics')
    is_enabled boolean NOT NULL DEFAULT false, -- Whether the feature is currently enabled
    rollout_percentage integer NOT NULL DEFAULT 100, -- Percentage of users who should see this feature (0-100)
    target_audience jsonb DEFAULT '{}', -- JSON object defining target audience criteria
    dependencies text[], -- Array of feature names this feature depends on
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Feature flag overrides - allows per-user overrides
CREATE TABLE feature_flag_overrides (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_enabled boolean NOT NULL, -- Override value for this specific user
    reason text, -- Reason for the override
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamp with time zone, -- Optional expiration date for temporary overrides

    UNIQUE(feature_flag_id, user_id)
);

-- Feature flag usage tracking - tracks when features are accessed
CREATE TABLE feature_flag_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL, -- Action performed (e.g., 'viewed', 'used', 'interacted')
    metadata jsonb DEFAULT '{}', -- Additional context about the usage
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Feature flag audit log - tracks all changes to feature flags
CREATE TABLE feature_flag_audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    action text NOT NULL, -- 'created', 'updated', 'deleted', 'enabled', 'disabled'
    old_values jsonb, -- Previous state of the feature flag
    new_values jsonb, -- New state of the feature flag
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text, -- Reason for the change
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flag_overrides_user ON feature_flag_overrides(user_id);
CREATE INDEX idx_feature_flag_overrides_feature ON feature_flag_overrides(feature_flag_id);
CREATE INDEX idx_feature_flag_usage_feature ON feature_flag_usage(feature_flag_id);
CREATE INDEX idx_feature_flag_usage_user ON feature_flag_usage(user_id);
CREATE INDEX idx_feature_flag_usage_created ON feature_flag_usage(created_at);
CREATE INDEX idx_feature_flag_audit_feature ON feature_flag_audit_log(feature_flag_id);
CREATE INDEX idx_feature_flag_audit_created ON feature_flag_audit_log(created_at);

-- Function to check if a feature is enabled for a user
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_feature_name text,
    p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    feature_record feature_flags%ROWTYPE;
    override_record feature_flag_overrides%ROWTYPE;
    user_rollout_hash integer;
    is_in_rollout boolean := false;
BEGIN
    -- Get the feature flag
    SELECT * INTO feature_record
    FROM feature_flags
    WHERE name = p_feature_name;

    -- If feature doesn't exist, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- If feature is disabled globally, return false
    IF NOT feature_record.is_enabled THEN
        RETURN false;
    END IF;

    -- Check for user-specific override
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO override_record
        FROM feature_flag_overrides
        WHERE feature_flag_id = feature_record.id
        AND user_id = p_user_id
        AND (expires_at IS NULL OR expires_at > NOW());

        -- If override exists, use it
        IF FOUND THEN
            RETURN override_record.is_enabled;
        END IF;

        -- Check rollout percentage using user ID hash
        user_rollout_hash := abs(hashtext(p_user_id::text)) % 100;
        is_in_rollout := user_rollout_hash < feature_record.rollout_percentage;
    ELSE
        -- For anonymous users, check if rollout percentage includes them
        is_in_rollout := feature_record.rollout_percentage > 0;
    END IF;

    RETURN is_in_rollout;
END;
$$ LANGUAGE plpgsql;

-- Function to get all enabled features for a user
CREATE OR REPLACE FUNCTION get_enabled_features(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    name text,
    display_name text,
    category text,
    is_override boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ff.name,
        ff.display_name,
        ff.category,
        CASE WHEN ffo.id IS NOT NULL THEN true ELSE false END as is_override
    FROM feature_flags ff
    LEFT JOIN feature_flag_overrides ffo ON ff.id = ffo.feature_flag_id
        AND ffo.user_id = p_user_id
        AND (ffo.expires_at IS NULL OR ffo.expires_at > NOW())
    WHERE ff.is_enabled = true
    AND (
        ffo.is_enabled = true OR
        (ffo.id IS NULL AND (
            p_user_id IS NULL AND ff.rollout_percentage > 0 OR
            p_user_id IS NOT NULL AND (abs(hashtext(p_user_id::text)) % 100) < ff.rollout_percentage
        ))
    )
    ORDER BY ff.category, ff.display_name;
END;
$$ LANGUAGE plpgsql;

-- Function to create a feature flag
CREATE OR REPLACE FUNCTION create_feature_flag(
    p_name text,
    p_display_name text,
    p_description text DEFAULT NULL,
    p_category text DEFAULT 'general',
    p_is_enabled boolean DEFAULT false,
    p_rollout_percentage integer DEFAULT 100,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_feature_id uuid;
BEGIN
    INSERT INTO feature_flags (
        name,
        display_name,
        description,
        category,
        is_enabled,
        rollout_percentage,
        created_by
    ) VALUES (
        p_name,
        p_display_name,
        p_description,
        p_category,
        p_is_enabled,
        p_rollout_percentage,
        p_created_by
    ) RETURNING id INTO new_feature_id;

    -- Log the creation
    INSERT INTO feature_flag_audit_log (
        feature_flag_id,
        action,
        new_values,
        changed_by,
        reason
    ) VALUES (
        new_feature_id,
        'created',
        jsonb_build_object(
            'name', p_name,
            'display_name', p_display_name,
            'description', p_description,
            'category', p_category,
            'is_enabled', p_is_enabled,
            'rollout_percentage', p_rollout_percentage
        ),
        p_created_by,
        'Feature flag created'
    );

    RETURN new_feature_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update a feature flag
CREATE OR REPLACE FUNCTION update_feature_flag(
    p_feature_id uuid,
    p_name text DEFAULT NULL,
    p_display_name text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_is_enabled boolean DEFAULT NULL,
    p_rollout_percentage integer DEFAULT NULL,
    p_updated_by uuid DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    old_values jsonb;
    new_values jsonb;
BEGIN
    -- Get current values for audit log
    SELECT jsonb_build_object(
        'name', name,
        'display_name', display_name,
        'description', description,
        'category', category,
        'is_enabled', is_enabled,
        'rollout_percentage', rollout_percentage
    ) INTO old_values
    FROM feature_flags
    WHERE id = p_feature_id;

    -- Update the feature flag
    UPDATE feature_flags
    SET
        name = COALESCE(p_name, name),
        display_name = COALESCE(p_display_name, display_name),
        description = COALESCE(p_description, description),
        category = COALESCE(p_category, category),
        is_enabled = COALESCE(p_is_enabled, is_enabled),
        rollout_percentage = COALESCE(p_rollout_percentage, rollout_percentage),
        updated_at = NOW(),
        updated_by = p_updated_by
    WHERE id = p_feature_id;

    -- Get new values for audit log
    SELECT jsonb_build_object(
        'name', name,
        'display_name', display_name,
        'description', description,
        'category', category,
        'is_enabled', is_enabled,
        'rollout_percentage', rollout_percentage
    ) INTO new_values
    FROM feature_flags
    WHERE id = p_feature_id;

    -- Log the update
    INSERT INTO feature_flag_audit_log (
        feature_flag_id,
        action,
        old_values,
        new_values,
        changed_by,
        reason
    ) VALUES (
        p_feature_id,
        'updated',
        old_values,
        new_values,
        p_updated_by,
        COALESCE(p_reason, 'Feature flag updated')
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_feature_name text,
    p_user_id uuid DEFAULT NULL,
    p_action text DEFAULT 'used',
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
    feature_id uuid;
BEGIN
    -- Get feature ID
    SELECT id INTO feature_id
    FROM feature_flags
    WHERE name = p_feature_name;

    -- Only track if feature exists
    IF FOUND THEN
        INSERT INTO feature_flag_usage (
            feature_flag_id,
            user_id,
            action,
            metadata
        ) VALUES (
            feature_id,
            p_user_id,
            p_action,
            p_metadata
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit_log ENABLE ROW LEVEL SECURITY;

-- Feature flags - Admin only for management
CREATE POLICY "Admins can manage feature flags" ON feature_flags
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Feature flag overrides - Users can view their own, admins can manage all
CREATE POLICY "Users can view their own overrides" ON feature_flag_overrides
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all overrides" ON feature_flag_overrides
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Feature flag usage - Users can view their own, admins can view all
CREATE POLICY "Users can view their own usage" ON feature_flag_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON feature_flag_usage
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Feature flag audit log - Admin only
CREATE POLICY "Admins can view audit log" ON feature_flag_audit_log
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Add updated_at triggers
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert some default feature flags
INSERT INTO feature_flags (name, display_name, description, category, is_enabled, rollout_percentage) VALUES
('social_features', 'Social Features', 'Family connections, recommendations, and social interactions', 'social', false, 0),
('gamification', 'Gamification System', 'Points, badges, achievements, and leaderboards', 'gamification', false, 0),
('advanced_analytics', 'Advanced Analytics', 'Detailed analytics and reporting features', 'analytics', false, 0),
('content_versioning', 'Content Versioning', 'Version control for restaurants and menu items', 'content', true, 100),
('accessibility_features', 'Accessibility Features', 'Enhanced accessibility support and features', 'accessibility', true, 100),
('future_tech', 'Future Technology', 'AR, VR, AI, and emerging technology features', 'future', false, 0),
('moderation_tools', 'Moderation Tools', 'Content moderation and safety features', 'moderation', true, 100),
('business_platform', 'Business Platform', 'Restaurant owner dashboard and business tools', 'business', true, 100);

COMMENT ON TABLE feature_flags IS 'Central feature flag management system for YumZoom';
COMMENT ON TABLE feature_flag_overrides IS 'User-specific feature flag overrides';
COMMENT ON TABLE feature_flag_usage IS 'Tracks feature usage and interactions';
COMMENT ON TABLE feature_flag_audit_log IS 'Audit trail for all feature flag changes';
