-- =====================================================
-- YumZoom Business Platform Features Schema
-- Implementation of restaurant subscription plans, advertising platform,
-- API platform, and advanced restaurant admin tools
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUBSCRIPTION PLANS AND MANAGEMENT
-- =====================================================

-- Subscription plan tiers for restaurants
CREATE TABLE subscription_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    price_monthly decimal(10,2) NOT NULL,
    price_yearly decimal(10,2),
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    limits jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurant subscriptions
CREATE TABLE restaurant_subscriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    subscription_plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'trial')),
    started_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    cancelled_at timestamp with time zone,
    trial_ends_at timestamp with time zone,
    auto_renew boolean NOT NULL DEFAULT true,
    payment_method_id text,
    billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscription usage tracking
CREATE TABLE subscription_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_subscription_id uuid REFERENCES restaurant_subscriptions(id) ON DELETE CASCADE NOT NULL,
    feature_name text NOT NULL,
    usage_count integer NOT NULL DEFAULT 0,
    usage_period text NOT NULL CHECK (usage_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_subscription_id, feature_name, period_start)
);

-- =====================================================
-- ADVERTISING PLATFORM
-- =====================================================

-- Advertisement campaigns
CREATE TABLE ad_campaigns (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    campaign_type text NOT NULL CHECK (campaign_type IN ('promoted_listing', 'targeted_recommendation', 'sponsored_content', 'banner_ad')),
    status text NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    budget_type text NOT NULL CHECK (budget_type IN ('daily', 'total')),
    budget_amount decimal(10,2) NOT NULL,
    spent_amount decimal(10,2) NOT NULL DEFAULT 0,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    targeting_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
    creative_assets jsonb NOT NULL DEFAULT '{}'::jsonb,
    performance_goals jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Advertisement impressions and clicks tracking
CREATE TABLE ad_interactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_campaign_id uuid REFERENCES ad_campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interaction_type text NOT NULL CHECK (interaction_type IN ('impression', 'click', 'conversion')),
    location_context text,
    device_type text,
    referrer_page text,
    interaction_data jsonb DEFAULT '{}'::jsonb,
    cost_per_interaction decimal(10,4),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Advertisement performance metrics (aggregated)
CREATE TABLE ad_performance_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_campaign_id uuid REFERENCES ad_campaigns(id) ON DELETE CASCADE NOT NULL,
    date_period date NOT NULL,
    impressions integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    conversions integer NOT NULL DEFAULT 0,
    cost decimal(10,2) NOT NULL DEFAULT 0,
    reach integer NOT NULL DEFAULT 0,
    engagement_rate decimal(5,4) DEFAULT 0,
    click_through_rate decimal(5,4) DEFAULT 0,
    conversion_rate decimal(5,4) DEFAULT 0,
    cost_per_click decimal(10,4) DEFAULT 0,
    cost_per_conversion decimal(10,4) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(ad_campaign_id, date_period)
);

-- =====================================================
-- API PLATFORM FOR THIRD-PARTY DEVELOPERS
-- =====================================================

-- API applications registered by developers
CREATE TABLE api_applications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    developer_email text NOT NULL,
    developer_organization text,
    app_type text NOT NULL CHECK (app_type IN ('web', 'mobile', 'backend', 'webhook')),
    status text NOT NULL CHECK (status IN ('pending', 'approved', 'suspended', 'revoked')),
    api_key text NOT NULL UNIQUE,
    api_secret text NOT NULL,
    webhook_url text,
    allowed_origins text[],
    rate_limit_per_hour integer NOT NULL DEFAULT 1000,
    rate_limit_per_day integer NOT NULL DEFAULT 10000,
    scopes text[] NOT NULL DEFAULT '{}',
    last_used_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- API usage tracking
CREATE TABLE api_usage_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    api_application_id uuid REFERENCES api_applications(id) ON DELETE CASCADE NOT NULL,
    endpoint text NOT NULL,
    method text NOT NULL,
    status_code integer NOT NULL,
    response_time_ms integer,
    request_size_bytes integer,
    response_size_bytes integer,
    user_agent text,
    ip_address inet,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- API rate limiting tracking
CREATE TABLE api_rate_limits (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    api_application_id uuid REFERENCES api_applications(id) ON DELETE CASCADE NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('hour', 'day')),
    period_start timestamp with time zone NOT NULL,
    request_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(api_application_id, period_type, period_start)
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    api_application_id uuid REFERENCES api_applications(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    webhook_url text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    http_status_code integer,
    response_body text,
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 3,
    next_retry_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- ADVANCED RESTAURANT ADMIN TOOLS
-- =====================================================

-- Restaurant admin tools access and permissions
CREATE TABLE restaurant_admin_access (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_owner_id uuid NOT NULL, -- References restaurant_owners table
    tool_name text NOT NULL,
    access_level text NOT NULL CHECK (access_level IN ('view', 'edit', 'admin', 'owner')),
    granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurant promotional content management
CREATE TABLE restaurant_promotions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    promotion_type text NOT NULL CHECK (promotion_type IN ('discount', 'special_menu', 'event', 'seasonal')),
    discount_percentage decimal(5,2),
    discount_amount decimal(10,2),
    promo_code text,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    max_uses integer,
    current_uses integer NOT NULL DEFAULT 0,
    target_audience jsonb DEFAULT '{}'::jsonb,
    terms_conditions text,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customer engagement tracking
CREATE TABLE customer_engagement_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('profile_view', 'menu_view', 'rating_submitted', 'review_written', 'photo_uploaded', 'promotion_viewed', 'promotion_used')),
    event_data jsonb DEFAULT '{}'::jsonb,
    session_id text,
    device_type text,
    referrer text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurant insights and recommendations
CREATE TABLE restaurant_insights (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    insight_type text NOT NULL CHECK (insight_type IN ('performance', 'customer_behavior', 'competitive', 'recommendation')),
    title text NOT NULL,
    description text,
    insight_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status text NOT NULL CHECK (status IN ('new', 'viewed', 'acted_upon', 'dismissed')),
    action_required boolean NOT NULL DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Subscription indexes
CREATE INDEX idx_restaurant_subscriptions_restaurant_id ON restaurant_subscriptions(restaurant_id);
CREATE INDEX idx_restaurant_subscriptions_status ON restaurant_subscriptions(status);
CREATE INDEX idx_restaurant_subscriptions_expires_at ON restaurant_subscriptions(expires_at);
CREATE INDEX idx_subscription_usage_restaurant_subscription_id ON subscription_usage(restaurant_subscription_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);

-- Advertising indexes
CREATE INDEX idx_ad_campaigns_restaurant_id ON ad_campaigns(restaurant_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX idx_ad_interactions_campaign_id ON ad_interactions(ad_campaign_id);
CREATE INDEX idx_ad_interactions_user_id ON ad_interactions(user_id);
CREATE INDEX idx_ad_interactions_created_at ON ad_interactions(created_at);
CREATE INDEX idx_ad_performance_metrics_campaign_id ON ad_performance_metrics(ad_campaign_id);
CREATE INDEX idx_ad_performance_metrics_date ON ad_performance_metrics(date_period);

-- API platform indexes
CREATE INDEX idx_api_applications_api_key ON api_applications(api_key);
CREATE INDEX idx_api_applications_status ON api_applications(status);
CREATE INDEX idx_api_usage_logs_application_id ON api_usage_logs(api_application_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_rate_limits_application_id ON api_rate_limits(api_application_id);
CREATE INDEX idx_webhook_deliveries_application_id ON webhook_deliveries(api_application_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);

-- Admin tools indexes
CREATE INDEX idx_restaurant_admin_access_owner_id ON restaurant_admin_access(restaurant_owner_id);
CREATE INDEX idx_restaurant_promotions_restaurant_id ON restaurant_promotions(restaurant_id);
CREATE INDEX idx_restaurant_promotions_active ON restaurant_promotions(is_active);
CREATE INDEX idx_customer_engagement_restaurant_id ON customer_engagement_events(restaurant_id);
CREATE INDEX idx_customer_engagement_user_id ON customer_engagement_events(user_id);
CREATE INDEX idx_customer_engagement_created_at ON customer_engagement_events(created_at);
CREATE INDEX idx_restaurant_insights_restaurant_id ON restaurant_insights(restaurant_id);
CREATE INDEX idx_restaurant_insights_status ON restaurant_insights(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurant_subscriptions_updated_at
    BEFORE UPDATE ON restaurant_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at
    BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ad_performance_metrics_updated_at
    BEFORE UPDATE ON ad_performance_metrics
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_api_applications_updated_at
    BEFORE UPDATE ON api_applications
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_api_rate_limits_updated_at
    BEFORE UPDATE ON api_rate_limits
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_webhook_deliveries_updated_at
    BEFORE UPDATE ON webhook_deliveries
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurant_admin_access_updated_at
    BEFORE UPDATE ON restaurant_admin_access
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurant_promotions_updated_at
    BEFORE UPDATE ON restaurant_promotions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurant_insights_updated_at
    BEFORE UPDATE ON restaurant_insights
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_insights ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (public read for active plans)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Restaurant subscriptions policies
CREATE POLICY "Restaurant owners can view their subscriptions" ON restaurant_subscriptions
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Subscription usage policies
CREATE POLICY "Restaurant owners can view their subscription usage" ON subscription_usage
    FOR SELECT USING (
        restaurant_subscription_id IN (
            SELECT rs.id FROM restaurant_subscriptions rs
            JOIN restaurant_owners ro ON rs.restaurant_id = ro.restaurant_id
            WHERE ro.user_id = auth.uid()
        )
    );

-- Ad campaigns policies
CREATE POLICY "Restaurant owners can manage their ad campaigns" ON ad_campaigns
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Ad interactions policies (platform admin only)
CREATE POLICY "Platform admins can view ad interactions" ON ad_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );

-- Ad performance metrics policies
CREATE POLICY "Restaurant owners can view their ad performance" ON ad_performance_metrics
    FOR SELECT USING (
        ad_campaign_id IN (
            SELECT ac.id FROM ad_campaigns ac
            JOIN restaurant_owners ro ON ac.restaurant_id = ro.restaurant_id
            WHERE ro.user_id = auth.uid()
        )
    );

-- API applications policies (platform admin only)
CREATE POLICY "Platform admins can manage API applications" ON api_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );

-- Restaurant admin access policies
CREATE POLICY "Restaurant owners can view their admin access" ON restaurant_admin_access
    FOR SELECT USING (
        restaurant_owner_id IN (
            SELECT id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Restaurant promotions policies
CREATE POLICY "Restaurant owners can manage their promotions" ON restaurant_promotions
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Customer engagement events policies
CREATE POLICY "Restaurant owners can view their customer engagement" ON customer_engagement_events
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- Restaurant insights policies
CREATE POLICY "Restaurant owners can view their insights" ON restaurant_insights
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =====================================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'Free Plan', 'Basic restaurant presence on YumZoom', 0.00, 0.00, 
 '["basic_profile", "respond_to_reviews", "view_basic_analytics"]'::jsonb,
 '{"monthly_responses": 10, "analytics_history_days": 30}'::jsonb),

('starter', 'Starter Plan', 'Enhanced features for growing restaurants', 29.99, 299.99,
 '["basic_profile", "respond_to_reviews", "view_analytics", "promotional_content", "customer_insights"]'::jsonb,
 '{"monthly_responses": 100, "analytics_history_days": 90, "monthly_promotions": 3}'::jsonb),

('professional', 'Professional Plan', 'Advanced tools for established restaurants', 79.99, 799.99,
 '["basic_profile", "respond_to_reviews", "advanced_analytics", "promotional_content", "customer_insights", "ad_campaigns", "priority_support"]'::jsonb,
 '{"monthly_responses": -1, "analytics_history_days": 365, "monthly_promotions": 10, "monthly_ad_budget": 500}'::jsonb),

('enterprise', 'Enterprise Plan', 'Complete restaurant management solution', 199.99, 1999.99,
 '["basic_profile", "respond_to_reviews", "advanced_analytics", "promotional_content", "customer_insights", "ad_campaigns", "api_access", "priority_support", "custom_integrations"]'::jsonb,
 '{"monthly_responses": -1, "analytics_history_days": -1, "monthly_promotions": -1, "monthly_ad_budget": -1}'::jsonb);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check subscription feature access
CREATE OR REPLACE FUNCTION check_subscription_feature_access(
    p_restaurant_id uuid,
    p_feature_name text
) RETURNS boolean AS $$
DECLARE
    v_has_access boolean := false;
    v_features jsonb;
BEGIN
    SELECT sp.features INTO v_features
    FROM restaurant_subscriptions rs
    JOIN subscription_plans sp ON rs.subscription_plan_id = sp.id
    WHERE rs.restaurant_id = p_restaurant_id 
    AND rs.status = 'active'
    AND rs.expires_at > now()
    ORDER BY sp.price_monthly DESC
    LIMIT 1;
    
    IF v_features IS NOT NULL THEN
        v_has_access := v_features ? p_feature_name;
    END IF;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription usage limits
CREATE OR REPLACE FUNCTION check_subscription_usage_limit(
    p_restaurant_id uuid,
    p_feature_name text,
    p_period text DEFAULT 'monthly'
) RETURNS boolean AS $$
DECLARE
    v_limit integer;
    v_current_usage integer := 0;
    v_period_start timestamp with time zone;
    v_period_end timestamp with time zone;
BEGIN
    -- Get the limit for this feature
    SELECT (sp.limits->>p_feature_name)::integer INTO v_limit
    FROM restaurant_subscriptions rs
    JOIN subscription_plans sp ON rs.subscription_plan_id = sp.id
    WHERE rs.restaurant_id = p_restaurant_id 
    AND rs.status = 'active'
    AND rs.expires_at > now()
    ORDER BY sp.price_monthly DESC
    LIMIT 1;
    
    -- If no limit (unlimited) or no subscription found
    IF v_limit IS NULL OR v_limit = -1 THEN
        RETURN true;
    END IF;
    
    -- Calculate period boundaries
    IF p_period = 'monthly' THEN
        v_period_start := date_trunc('month', now());
        v_period_end := v_period_start + interval '1 month';
    ELSIF p_period = 'daily' THEN
        v_period_start := date_trunc('day', now());
        v_period_end := v_period_start + interval '1 day';
    ELSE
        -- Default to monthly
        v_period_start := date_trunc('month', now());
        v_period_end := v_period_start + interval '1 month';
    END IF;
    
    -- Get current usage
    SELECT COALESCE(usage_count, 0) INTO v_current_usage
    FROM subscription_usage su
    JOIN restaurant_subscriptions rs ON su.restaurant_subscription_id = rs.id
    WHERE rs.restaurant_id = p_restaurant_id
    AND su.feature_name = p_feature_name
    AND su.period_start = v_period_start;
    
    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment subscription usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
    p_restaurant_id uuid,
    p_feature_name text,
    p_increment integer DEFAULT 1,
    p_period text DEFAULT 'monthly'
) RETURNS void AS $$
DECLARE
    v_subscription_id uuid;
    v_period_start timestamp with time zone;
    v_period_end timestamp with time zone;
BEGIN
    -- Get active subscription
    SELECT id INTO v_subscription_id
    FROM restaurant_subscriptions
    WHERE restaurant_id = p_restaurant_id 
    AND status = 'active'
    AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate period boundaries
    IF p_period = 'monthly' THEN
        v_period_start := date_trunc('month', now());
        v_period_end := v_period_start + interval '1 month';
    ELSIF p_period = 'daily' THEN
        v_period_start := date_trunc('day', now());
        v_period_end := v_period_start + interval '1 day';
    ELSE
        v_period_start := date_trunc('month', now());
        v_period_end := v_period_start + interval '1 month';
    END IF;
    
    -- Insert or update usage
    INSERT INTO subscription_usage (
        restaurant_subscription_id,
        feature_name,
        usage_count,
        usage_period,
        period_start,
        period_end
    ) VALUES (
        v_subscription_id,
        p_feature_name,
        p_increment,
        p_period,
        v_period_start,
        v_period_end
    )
    ON CONFLICT (restaurant_subscription_id, feature_name, period_start)
    DO UPDATE SET usage_count = subscription_usage.usage_count + p_increment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE subscription_plans IS 'Available subscription plans for restaurants';
COMMENT ON TABLE restaurant_subscriptions IS 'Active and past subscriptions for restaurants';
COMMENT ON TABLE subscription_usage IS 'Usage tracking for subscription features and limits';
COMMENT ON TABLE ad_campaigns IS 'Advertisement campaigns created by restaurants';
COMMENT ON TABLE ad_interactions IS 'User interactions with advertisements';
COMMENT ON TABLE ad_performance_metrics IS 'Aggregated advertising performance data';
COMMENT ON TABLE api_applications IS 'Third-party applications registered for API access';
COMMENT ON TABLE api_usage_logs IS 'API usage tracking and monitoring';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting tracking for API applications';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery status and logs';
COMMENT ON TABLE restaurant_admin_access IS 'Access control for restaurant admin tools';
COMMENT ON TABLE restaurant_promotions IS 'Promotional content and offers created by restaurants';
COMMENT ON TABLE customer_engagement_events IS 'Customer interaction tracking for restaurants';
COMMENT ON TABLE restaurant_insights IS 'AI-generated insights and recommendations for restaurants';
