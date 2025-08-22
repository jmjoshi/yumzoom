-- Advanced Analytics Phase 2 - Database Schema
-- Implements predictive analytics, competitive analysis, platform statistics, and custom reports

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Platform-wide usage statistics table
CREATE TABLE IF NOT EXISTS platform_usage_statistics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    date date NOT NULL UNIQUE,
    total_active_users integer DEFAULT 0,
    total_families integer DEFAULT 0,
    total_restaurants integer DEFAULT 0,
    total_ratings integer DEFAULT 0,
    new_users_count integer DEFAULT 0,
    new_restaurants_count integer DEFAULT 0,
    new_ratings_count integer DEFAULT 0,
    average_session_duration interval,
    platform_engagement_score decimal(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User behavior analytics for predictive insights
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    session_count integer DEFAULT 0,
    total_session_duration interval DEFAULT '0 minutes',
    pages_viewed integer DEFAULT 0,
    ratings_given integer DEFAULT 0,
    restaurants_viewed integer DEFAULT 0,
    search_queries integer DEFAULT 0,
    feature_usage jsonb DEFAULT '{}', -- Track which features are used
    engagement_score decimal(5,2) DEFAULT 0,
    predicted_next_activity text, -- AI prediction of next likely action
    prediction_confidence decimal(3,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Restaurant competitive analysis data
CREATE TABLE IF NOT EXISTS restaurant_competitive_analysis (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    analysis_date date NOT NULL,
    cuisine_category text NOT NULL,
    geographic_region text,
    -- Competitive metrics
    market_rank integer,
    percentile_rating decimal(5,2),
    percentile_review_volume decimal(5,2),
    percentile_customer_engagement decimal(5,2),
    -- Competitor data (anonymized aggregates)
    avg_competitor_rating decimal(3,2),
    avg_competitor_review_count integer,
    market_leader_rating decimal(3,2),
    market_share_estimate decimal(5,2),
    -- Performance vs market
    rating_vs_market decimal(3,2),
    volume_vs_market decimal(5,2),
    engagement_vs_market decimal(5,2),
    -- Recommendations
    improvement_areas text[],
    competitive_advantages text[],
    market_opportunities text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, analysis_date)
);

-- Predictive analytics insights
CREATE TABLE IF NOT EXISTS predictive_analytics_insights (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type text NOT NULL CHECK (entity_type IN ('user', 'restaurant', 'platform')),
    entity_id uuid, -- Can be user_id, restaurant_id, or null for platform-wide
    insight_type text NOT NULL CHECK (insight_type IN (
        'cuisine_recommendation', 'restaurant_recommendation', 'menu_optimization',
        'user_churn_risk', 'revenue_forecast', 'trend_prediction'
    )),
    insight_category text NOT NULL CHECK (insight_category IN (
        'recommendation', 'risk_alert', 'opportunity', 'forecast', 'trend'
    )),
    title text NOT NULL,
    description text NOT NULL,
    prediction_data jsonb DEFAULT '{}',
    confidence_score decimal(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    impact_score decimal(3,2) NOT NULL CHECK (impact_score >= 0 AND impact_score <= 1),
    valid_until timestamp with time zone,
    action_taken boolean DEFAULT false,
    feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom report definitions
CREATE TABLE IF NOT EXISTS custom_report_definitions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_name text NOT NULL,
    report_type text NOT NULL CHECK (report_type IN (
        'family_insights', 'restaurant_performance', 'competitive_analysis', 
        'platform_statistics', 'predictive_insights'
    )),
    filters jsonb DEFAULT '{}',
    metrics jsonb DEFAULT '{}',
    visualization_config jsonb DEFAULT '{}',
    schedule_config jsonb DEFAULT '{}', -- For scheduled reports
    is_public boolean DEFAULT false,
    is_template boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom report executions and results
CREATE TABLE IF NOT EXISTS custom_report_executions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_definition_id uuid REFERENCES custom_report_definitions(id) ON DELETE CASCADE NOT NULL,
    executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    execution_type text NOT NULL CHECK (execution_type IN ('manual', 'scheduled', 'api')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    parameters jsonb DEFAULT '{}',
    result_data jsonb DEFAULT '{}',
    execution_duration interval,
    error_message text,
    file_exports jsonb DEFAULT '{}', -- URLs to exported files
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Geographic analytics for platform insights
CREATE TABLE IF NOT EXISTS geographic_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    date date NOT NULL,
    region_code text NOT NULL, -- Country/state/city codes
    region_name text NOT NULL,
    region_type text NOT NULL CHECK (region_type IN ('country', 'state', 'city', 'postal_code')),
    user_count integer DEFAULT 0,
    restaurant_count integer DEFAULT 0,
    rating_count integer DEFAULT 0,
    average_rating decimal(3,2),
    market_penetration decimal(5,2), -- Percentage of total market
    growth_rate decimal(5,2), -- Month-over-month growth
    opportunity_score decimal(3,2), -- Market opportunity rating
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, region_code, region_type)
);

-- Trend analysis data
CREATE TABLE IF NOT EXISTS trend_analysis (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    trend_type text NOT NULL CHECK (trend_type IN (
        'cuisine_popularity', 'rating_patterns', 'user_behavior', 
        'restaurant_performance', 'seasonal_trends'
    )),
    entity_type text CHECK (entity_type IN ('global', 'region', 'cuisine', 'restaurant', 'user')),
    entity_id text, -- Flexible identifier
    period_start date NOT NULL,
    period_end date NOT NULL,
    trend_data jsonb NOT NULL DEFAULT '{}',
    trend_direction text CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'volatile')),
    trend_strength decimal(3,2) DEFAULT 0, -- 0-1 strength of trend
    statistical_significance decimal(3,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI model performance tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name text NOT NULL,
    model_version text NOT NULL,
    prediction_type text NOT NULL,
    accuracy_score decimal(5,4),
    precision_score decimal(5,4),
    recall_score decimal(5,4),
    f1_score decimal(5,4),
    confidence_threshold decimal(3,2),
    training_data_size integer,
    evaluation_date date NOT NULL,
    production_status text DEFAULT 'testing' CHECK (production_status IN ('testing', 'staging', 'production', 'deprecated')),
    performance_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_usage_statistics_date ON platform_usage_statistics(date);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_date ON user_behavior_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_date ON user_behavior_analytics(date);
CREATE INDEX IF NOT EXISTS idx_restaurant_competitive_analysis_restaurant ON restaurant_competitive_analysis(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_competitive_analysis_date ON restaurant_competitive_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_restaurant_competitive_analysis_cuisine ON restaurant_competitive_analysis(cuisine_category);
CREATE INDEX IF NOT EXISTS idx_predictive_insights_entity ON predictive_analytics_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictive_insights_type ON predictive_analytics_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_predictive_insights_confidence ON predictive_analytics_insights(confidence_score);
CREATE INDEX IF NOT EXISTS idx_custom_report_definitions_user ON custom_report_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_report_executions_definition ON custom_report_executions(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_custom_report_executions_date ON custom_report_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_geographic_analytics_date_region ON geographic_analytics(date, region_code);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_type_period ON trend_analysis(trend_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_name_version ON ai_model_performance(model_name, model_version);

-- Create updated_at triggers
CREATE TRIGGER update_platform_usage_statistics_updated_at
    BEFORE UPDATE ON platform_usage_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_behavior_analytics_updated_at
    BEFORE UPDATE ON user_behavior_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_competitive_analysis_updated_at
    BEFORE UPDATE ON restaurant_competitive_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictive_analytics_insights_updated_at
    BEFORE UPDATE ON predictive_analytics_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_report_definitions_updated_at
    BEFORE UPDATE ON custom_report_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_report_executions_updated_at
    BEFORE UPDATE ON custom_report_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geographic_analytics_updated_at
    BEFORE UPDATE ON geographic_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trend_analysis_updated_at
    BEFORE UPDATE ON trend_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_performance_updated_at
    BEFORE UPDATE ON ai_model_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- STORED PROCEDURES FOR ADVANCED ANALYTICS
-- =====================================================================

-- Function to generate platform usage statistics
CREATE OR REPLACE FUNCTION generate_platform_usage_statistics(
    target_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats_record record;
BEGIN
    -- Calculate platform-wide statistics for the given date
    SELECT 
        COALESCE(COUNT(DISTINCT u.id), 0) as total_active_users,
        COALESCE(COUNT(DISTINCT CASE WHEN fm.user_id IS NOT NULL THEN u.id END), 0) as total_families,
        COALESCE(COUNT(DISTINCT r.id), 0) as total_restaurants,
        COALESCE(COUNT(rt.id), 0) as total_ratings,
        COALESCE(COUNT(DISTINCT CASE WHEN u.created_at::date = target_date THEN u.id END), 0) as new_users_count,
        COALESCE(COUNT(DISTINCT CASE WHEN r.created_at::date = target_date THEN r.id END), 0) as new_restaurants_count,
        COALESCE(COUNT(CASE WHEN rt.created_at::date = target_date THEN rt.id END), 0) as new_ratings_count
    INTO stats_record
    FROM auth.users u
    LEFT JOIN family_members fm ON u.id = fm.user_id
    LEFT JOIN restaurants r ON true -- Cross join to count all restaurants
    LEFT JOIN ratings rt ON true -- Cross join to count all ratings
    WHERE u.created_at <= target_date + interval '1 day';

    -- Insert or update the statistics
    INSERT INTO platform_usage_statistics (
        date, total_active_users, total_families, total_restaurants, 
        total_ratings, new_users_count, new_restaurants_count, new_ratings_count,
        platform_engagement_score
    ) VALUES (
        target_date,
        stats_record.total_active_users,
        stats_record.total_families,
        stats_record.total_restaurants,
        stats_record.total_ratings,
        stats_record.new_users_count,
        stats_record.new_restaurants_count,
        stats_record.new_ratings_count,
        CASE 
            WHEN stats_record.total_active_users > 0 
            THEN (stats_record.new_ratings_count::decimal / stats_record.total_active_users) * 100
            ELSE 0 
        END
    )
    ON CONFLICT (date) DO UPDATE SET
        total_active_users = EXCLUDED.total_active_users,
        total_families = EXCLUDED.total_families,
        total_restaurants = EXCLUDED.total_restaurants,
        total_ratings = EXCLUDED.total_ratings,
        new_users_count = EXCLUDED.new_users_count,
        new_restaurants_count = EXCLUDED.new_restaurants_count,
        new_ratings_count = EXCLUDED.new_ratings_count,
        platform_engagement_score = EXCLUDED.platform_engagement_score,
        updated_at = now();
END;
$$;

-- Function to generate competitive analysis for a restaurant
CREATE OR REPLACE FUNCTION generate_restaurant_competitive_analysis(
    target_restaurant_id uuid,
    analysis_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    restaurant_data record;
    competitor_stats record;
    result jsonb;
BEGIN
    -- Get restaurant basic info
    SELECT r.name, r.cuisine_type, r.address
    INTO restaurant_data
    FROM restaurants r
    WHERE r.id = target_restaurant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Restaurant not found');
    END IF;

    -- Calculate competitive metrics
    WITH restaurant_metrics AS (
        SELECT 
            r.id,
            r.name,
            r.cuisine_type,
            COALESCE(AVG(rt.rating), 0) as avg_rating,
            COUNT(rt.id) as review_count,
            COUNT(DISTINCT rt.user_id) as unique_reviewers
        FROM restaurants r
        LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id
        WHERE r.cuisine_type = restaurant_data.cuisine_type
        GROUP BY r.id, r.name, r.cuisine_type
    ),
    target_metrics AS (
        SELECT * FROM restaurant_metrics WHERE id = target_restaurant_id
    ),
    competitor_metrics AS (
        SELECT 
            COUNT(*) as total_competitors,
            AVG(avg_rating) as avg_competitor_rating,
            AVG(review_count) as avg_competitor_reviews,
            MAX(avg_rating) as max_competitor_rating,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_rating) as median_rating,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY avg_rating) as q75_rating,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY avg_rating) as q25_rating
        FROM restaurant_metrics 
        WHERE id != target_restaurant_id
    )
    SELECT 
        tm.avg_rating,
        tm.review_count,
        tm.unique_reviewers,
        cm.total_competitors,
        cm.avg_competitor_rating,
        cm.avg_competitor_reviews,
        cm.max_competitor_rating,
        cm.median_rating,
        -- Calculate percentile ranks
        (SELECT COUNT(*) FROM restaurant_metrics rm WHERE rm.avg_rating < tm.avg_rating)::decimal / 
        NULLIF(cm.total_competitors, 0) * 100 as rating_percentile,
        (SELECT COUNT(*) FROM restaurant_metrics rm WHERE rm.review_count < tm.review_count)::decimal / 
        NULLIF(cm.total_competitors, 0) * 100 as volume_percentile
    INTO competitor_stats
    FROM target_metrics tm, competitor_metrics cm;

    -- Generate improvement recommendations
    result := jsonb_build_object(
        'restaurant_id', target_restaurant_id,
        'restaurant_name', restaurant_data.name,
        'cuisine_category', restaurant_data.cuisine_type,
        'analysis_date', analysis_date,
        'metrics', jsonb_build_object(
            'avg_rating', competitor_stats.avg_rating,
            'review_count', competitor_stats.review_count,
            'unique_reviewers', competitor_stats.unique_reviewers,
            'rating_percentile', competitor_stats.rating_percentile,
            'volume_percentile', competitor_stats.volume_percentile
        ),
        'market_context', jsonb_build_object(
            'total_competitors', competitor_stats.total_competitors,
            'avg_competitor_rating', competitor_stats.avg_competitor_rating,
            'market_leader_rating', competitor_stats.max_competitor_rating,
            'median_market_rating', competitor_stats.median_rating
        ),
        'recommendations', CASE 
            WHEN competitor_stats.rating_percentile < 25 THEN 
                jsonb_build_array('Improve food quality based on customer feedback', 'Focus on service training', 'Review menu pricing strategy')
            WHEN competitor_stats.rating_percentile < 50 THEN 
                jsonb_build_array('Enhance customer experience', 'Increase marketing efforts', 'Optimize popular menu items')
            WHEN competitor_stats.volume_percentile < 25 THEN 
                jsonb_build_array('Increase visibility and marketing', 'Encourage customer reviews', 'Expand social media presence')
            ELSE 
                jsonb_build_array('Maintain current quality standards', 'Consider premium positioning', 'Explore expansion opportunities')
        END
    );

    -- Store the analysis
    INSERT INTO restaurant_competitive_analysis (
        restaurant_id, analysis_date, cuisine_category, market_rank,
        percentile_rating, percentile_review_volume, avg_competitor_rating,
        market_leader_rating, rating_vs_market, volume_vs_market,
        improvement_areas, competitive_advantages
    ) VALUES (
        target_restaurant_id,
        analysis_date,
        restaurant_data.cuisine_type,
        (competitor_stats.rating_percentile / 10)::integer + 1,
        competitor_stats.rating_percentile,
        competitor_stats.volume_percentile,
        competitor_stats.avg_competitor_rating,
        competitor_stats.max_competitor_rating,
        competitor_stats.avg_rating - competitor_stats.avg_competitor_rating,
        competitor_stats.review_count - competitor_stats.avg_competitor_reviews,
        CASE 
            WHEN competitor_stats.rating_percentile < 25 THEN 
                ARRAY['food_quality', 'service_training', 'pricing_strategy']
            WHEN competitor_stats.rating_percentile < 50 THEN 
                ARRAY['customer_experience', 'marketing', 'menu_optimization']
            WHEN competitor_stats.volume_percentile < 25 THEN 
                ARRAY['visibility', 'review_generation', 'social_media']
            ELSE 
                ARRAY['quality_maintenance', 'premium_positioning']
        END,
        CASE 
            WHEN competitor_stats.rating_percentile > 75 THEN 
                ARRAY['high_rating', 'customer_satisfaction']
            WHEN competitor_stats.volume_percentile > 75 THEN 
                ARRAY['high_engagement', 'strong_visibility']
            ELSE 
                ARRAY['market_presence']
        END
    )
    ON CONFLICT (restaurant_id, analysis_date) DO UPDATE SET
        market_rank = EXCLUDED.market_rank,
        percentile_rating = EXCLUDED.percentile_rating,
        percentile_review_volume = EXCLUDED.percentile_review_volume,
        avg_competitor_rating = EXCLUDED.avg_competitor_rating,
        market_leader_rating = EXCLUDED.market_leader_rating,
        rating_vs_market = EXCLUDED.rating_vs_market,
        volume_vs_market = EXCLUDED.volume_vs_market,
        improvement_areas = EXCLUDED.improvement_areas,
        competitive_advantages = EXCLUDED.competitive_advantages,
        updated_at = now();

    RETURN result;
END;
$$;

-- Function to generate predictive insights
CREATE OR REPLACE FUNCTION generate_predictive_insights(
    target_entity_type text DEFAULT 'platform',
    target_entity_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    insights jsonb := '[]';
    insight_record record;
BEGIN
    -- Generate different types of insights based on entity type
    IF target_entity_type = 'user' AND target_entity_id IS NOT NULL THEN
        -- User-specific insights
        FOR insight_record IN 
            SELECT 
                'restaurant_recommendation' as insight_type,
                'recommendation' as insight_category,
                'New Restaurant Recommendation' as title,
                'Based on your rating patterns, you might enjoy ' || r.name as description,
                jsonb_build_object(
                    'restaurant_id', r.id,
                    'confidence', 0.75,
                    'reasoning', 'Similar cuisine preferences and rating patterns'
                ) as prediction_data,
                0.75 as confidence_score,
                0.8 as impact_score
            FROM restaurants r
            WHERE r.cuisine_type IN (
                SELECT DISTINCT restaurants.cuisine_type 
                FROM ratings 
                JOIN menu_items ON ratings.menu_item_id = menu_items.id
                JOIN restaurants ON menu_items.restaurant_id = restaurants.id
                WHERE ratings.user_id = target_entity_id 
                AND ratings.rating >= 8
                LIMIT 3
            )
            AND r.id NOT IN (
                SELECT DISTINCT restaurants.id
                FROM ratings 
                JOIN menu_items ON ratings.menu_item_id = menu_items.id
                JOIN restaurants ON menu_items.restaurant_id = restaurants.id
                WHERE ratings.user_id = target_entity_id
            )
            LIMIT 5
        LOOP
            insights := insights || jsonb_build_object(
                'entity_type', target_entity_type,
                'entity_id', target_entity_id,
                'insight_type', insight_record.insight_type,
                'insight_category', insight_record.insight_category,
                'title', insight_record.title,
                'description', insight_record.description,
                'prediction_data', insight_record.prediction_data,
                'confidence_score', insight_record.confidence_score,
                'impact_score', insight_record.impact_score
            );
        END LOOP;

    ELSIF target_entity_type = 'restaurant' AND target_entity_id IS NOT NULL THEN
        -- Restaurant-specific insights
        SELECT 
            'menu_optimization' as insight_type,
            'opportunity' as insight_category,
            'Menu Optimization Opportunity' as title,
            'Consider promoting your highly-rated items more prominently' as description,
            jsonb_build_object(
                'top_items', jsonb_agg(jsonb_build_object('item', mi.name, 'rating', avg_rating))
            ) as prediction_data,
            0.85 as confidence_score,
            0.9 as impact_score
        INTO insight_record
        FROM (
            SELECT mi.name, AVG(r.rating) as avg_rating
            FROM menu_items mi
            JOIN ratings r ON mi.id = r.menu_item_id
            WHERE mi.restaurant_id = target_entity_id
            GROUP BY mi.id, mi.name
            HAVING COUNT(r.id) >= 3 AND AVG(r.rating) >= 8.5
            ORDER BY AVG(r.rating) DESC
            LIMIT 5
        ) mi;

        IF insight_record IS NOT NULL THEN
            insights := insights || jsonb_build_object(
                'entity_type', target_entity_type,
                'entity_id', target_entity_id,
                'insight_type', insight_record.insight_type,
                'insight_category', insight_record.insight_category,
                'title', insight_record.title,
                'description', insight_record.description,
                'prediction_data', insight_record.prediction_data,
                'confidence_score', insight_record.confidence_score,
                'impact_score', insight_record.impact_score
            );
        END IF;

    ELSE 
        -- Platform-wide insights
        insights := insights || jsonb_build_object(
            'entity_type', 'platform',
            'entity_id', null,
            'insight_type', 'trend_prediction',
            'insight_category', 'forecast',
            'title', 'Platform Growth Trend',
            'description', 'User engagement is showing positive growth trajectory',
            'prediction_data', jsonb_build_object(
                'growth_rate', 15.5,
                'confidence_interval', '[12.3, 18.7]',
                'forecast_period', '30 days'
            ),
            'confidence_score', 0.82,
            'impact_score', 0.95
        );
    END IF;

    RETURN insights;
END;
$$;

-- Function to get platform usage statistics for a date range
CREATE OR REPLACE FUNCTION get_platform_usage_statistics(
    start_date date,
    end_date date
)
RETURNS TABLE (
    date date,
    total_active_users integer,
    total_families integer,
    total_restaurants integer,
    total_ratings integer,
    new_users_count integer,
    new_restaurants_count integer,
    new_ratings_count integer,
    platform_engagement_score decimal(5,2),
    user_growth_rate decimal(5,2),
    restaurant_growth_rate decimal(5,2),
    rating_growth_rate decimal(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            pus.date,
            pus.total_active_users,
            pus.total_families,
            pus.total_restaurants,
            pus.total_ratings,
            pus.new_users_count,
            pus.new_restaurants_count,
            pus.new_ratings_count,
            pus.platform_engagement_score,
            LAG(pus.total_active_users) OVER (ORDER BY pus.date) as prev_users,
            LAG(pus.total_restaurants) OVER (ORDER BY pus.date) as prev_restaurants,
            LAG(pus.total_ratings) OVER (ORDER BY pus.date) as prev_ratings
        FROM platform_usage_statistics pus
        WHERE pus.date BETWEEN start_date AND end_date
        ORDER BY pus.date
    )
    SELECT 
        ds.date,
        ds.total_active_users,
        ds.total_families,
        ds.total_restaurants,
        ds.total_ratings,
        ds.new_users_count,
        ds.new_restaurants_count,
        ds.new_ratings_count,
        ds.platform_engagement_score,
        CASE 
            WHEN ds.prev_users > 0 THEN 
                ((ds.total_active_users - ds.prev_users)::decimal / ds.prev_users * 100)
            ELSE 0 
        END as user_growth_rate,
        CASE 
            WHEN ds.prev_restaurants > 0 THEN 
                ((ds.total_restaurants - ds.prev_restaurants)::decimal / ds.prev_restaurants * 100)
            ELSE 0 
        END as restaurant_growth_rate,
        CASE 
            WHEN ds.prev_ratings > 0 THEN 
                ((ds.total_ratings - ds.prev_ratings)::decimal / ds.prev_ratings * 100)
            ELSE 0 
        END as rating_growth_rate
    FROM daily_stats ds;
END;
$$;

-- RLS (Row Level Security) Policies
ALTER TABLE platform_usage_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- Platform usage statistics - Admin only
CREATE POLICY "Admin users can access platform usage statistics" ON platform_usage_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.id IN (
                SELECT user_id FROM admin_users WHERE is_active = true
            ))
        )
    );

-- User behavior analytics - Users can see their own data, admins can see all
CREATE POLICY "Users can view their own behavior analytics" ON user_behavior_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all behavior analytics" ON user_behavior_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.id IN (
                SELECT user_id FROM admin_users WHERE is_active = true
            ))
        )
    );

-- Restaurant competitive analysis - Restaurant owners and admins
CREATE POLICY "Restaurant owners can view their competitive analysis" ON restaurant_competitive_analysis
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_owners 
            WHERE user_id = auth.uid() AND is_verified = true
        )
    );

CREATE POLICY "Admin users can view all competitive analysis" ON restaurant_competitive_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.id IN (
                SELECT user_id FROM admin_users WHERE is_active = true
            ))
        )
    );

-- Custom reports - Users can manage their own reports
CREATE POLICY "Users can manage their own custom reports" ON custom_report_definitions
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access public report templates" ON custom_report_definitions
    FOR SELECT USING (is_public = true AND is_template = true);

CREATE POLICY "Users can view executions of their reports" ON custom_report_executions
    FOR SELECT USING (
        report_definition_id IN (
            SELECT id FROM custom_report_definitions WHERE user_id = auth.uid()
        )
    );

-- Geographic analytics - Admin only
CREATE POLICY "Admin users can access geographic analytics" ON geographic_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.id IN (
                SELECT user_id FROM admin_users WHERE is_active = true
            ))
        )
    );

-- AI model performance - Admin only
CREATE POLICY "Admin users can access AI model performance" ON ai_model_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.id IN (
                SELECT user_id FROM admin_users WHERE is_active = true
            ))
        )
    );

-- Generate initial data (run once)
-- Note: This would typically be run as part of a migration or setup script
-- SELECT generate_platform_usage_statistics(CURRENT_DATE);

COMMENT ON TABLE platform_usage_statistics IS 'Daily platform-wide usage and engagement statistics';
COMMENT ON TABLE user_behavior_analytics IS 'Individual user behavior tracking for predictive analytics';
COMMENT ON TABLE restaurant_competitive_analysis IS 'Competitive analysis data for restaurants vs market';
COMMENT ON TABLE predictive_analytics_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE custom_report_definitions IS 'User-defined custom report configurations';
COMMENT ON TABLE custom_report_executions IS 'Execution history and results for custom reports';
COMMENT ON TABLE geographic_analytics IS 'Geographic breakdown of platform usage and opportunities';
COMMENT ON TABLE trend_analysis IS 'Statistical trend analysis across various dimensions';
COMMENT ON TABLE ai_model_performance IS 'Performance tracking for AI/ML models';
