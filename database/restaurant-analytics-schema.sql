-- Restaurant Analytics Database Schema
-- Enhanced analytics tables and views for restaurant owners

-- Create restaurant analytics summary table for performance optimization
CREATE TABLE restaurant_analytics_summary (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_ratings bigint DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    total_reviews bigint DEFAULT 0,
    total_responses bigint DEFAULT 0,
    response_rate numeric(5,2) DEFAULT 0,
    unique_customers bigint DEFAULT 0,
    new_customers bigint DEFAULT 0,
    returning_customers bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, period_type, period_start)
);

-- Create menu item analytics table
CREATE TABLE menu_item_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_ratings bigint DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    rating_trend text DEFAULT 'stable' CHECK (rating_trend IN ('improving', 'declining', 'stable')),
    total_reviews bigint DEFAULT 0,
    popularity_rank integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(menu_item_id, period_type, period_start)
);

-- Create customer feedback aggregation table
CREATE TABLE customer_feedback_summary (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    sentiment_score numeric(3,2), -- Average sentiment score -1 to 1
    common_keywords jsonb, -- Array of common keywords from reviews
    positive_mentions bigint DEFAULT 0,
    negative_mentions bigint DEFAULT 0,
    neutral_mentions bigint DEFAULT 0,
    top_praised_aspects jsonb, -- Service, food, ambiance, etc.
    improvement_areas jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, period_type, period_start)
);

-- Create indexes for better performance
CREATE INDEX idx_restaurant_analytics_summary_restaurant_period ON restaurant_analytics_summary(restaurant_id, period_type, period_start);
CREATE INDEX idx_menu_item_analytics_restaurant_period ON menu_item_analytics(restaurant_id, period_type, period_start);
CREATE INDEX idx_menu_item_analytics_item_period ON menu_item_analytics(menu_item_id, period_type, period_start);
CREATE INDEX idx_customer_feedback_summary_restaurant_period ON customer_feedback_summary(restaurant_id, period_type, period_start);

-- Add updated_at triggers
CREATE TRIGGER update_restaurant_analytics_summary_updated_at
    BEFORE UPDATE ON restaurant_analytics_summary
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_menu_item_analytics_updated_at
    BEFORE UPDATE ON menu_item_analytics
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_feedback_summary_updated_at
    BEFORE UPDATE ON customer_feedback_summary
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security
ALTER TABLE restaurant_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback_summary ENABLE ROW LEVEL SECURITY;

-- Policies for restaurant analytics
CREATE POLICY "Restaurant owners can view their analytics" ON restaurant_analytics_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.restaurant_id = restaurant_analytics_summary.restaurant_id
            AND ro.user_id = auth.uid()
            AND ro.verification_status = 'verified'
        )
    );

CREATE POLICY "Admins can view all restaurant analytics" ON restaurant_analytics_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.first_name || ' ' || user_profiles.last_name) = 'Admin User'
        )
    );

-- Similar policies for menu item analytics
CREATE POLICY "Restaurant owners can view their menu analytics" ON menu_item_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.restaurant_id = menu_item_analytics.restaurant_id
            AND ro.user_id = auth.uid()
            AND ro.verification_status = 'verified'
        )
    );

CREATE POLICY "Admins can view all menu analytics" ON menu_item_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.first_name || ' ' || user_profiles.last_name) = 'Admin User'
        )
    );

-- Policies for customer feedback
CREATE POLICY "Restaurant owners can view their feedback" ON customer_feedback_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.restaurant_id = customer_feedback_summary.restaurant_id
            AND ro.user_id = auth.uid()
            AND ro.verification_status = 'verified'
        )
    );

CREATE POLICY "Admins can view all feedback" ON customer_feedback_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.first_name || ' ' || user_profiles.last_name) = 'Admin User'
        )
    );

-- Function to get restaurant performance dashboard data
CREATE OR REPLACE FUNCTION get_restaurant_performance_dashboard(
    owner_user_id uuid,
    target_restaurant_id uuid DEFAULT NULL,
    time_period text DEFAULT 'month'
)
RETURNS TABLE (
    restaurant_id uuid,
    restaurant_name text,
    current_period jsonb,
    previous_period jsonb,
    period_comparison jsonb,
    top_menu_items jsonb,
    recent_reviews jsonb,
    rating_distribution jsonb,
    customer_insights jsonb
) AS $$
DECLARE
    period_days integer;
    current_start date;
    current_end date;
    previous_start date;
    previous_end date;
BEGIN
    -- Calculate date ranges based on time period
    CASE time_period
        WHEN 'week' THEN
            period_days := 7;
            current_end := CURRENT_DATE;
            current_start := current_end - INTERVAL '7 days';
            previous_end := current_start;
            previous_start := previous_end - INTERVAL '7 days';
        WHEN 'month' THEN
            period_days := 30;
            current_end := CURRENT_DATE;
            current_start := current_end - INTERVAL '30 days';
            previous_end := current_start;
            previous_start := previous_end - INTERVAL '30 days';
        WHEN 'quarter' THEN
            period_days := 90;
            current_end := CURRENT_DATE;
            current_start := current_end - INTERVAL '90 days';
            previous_end := current_start;
            previous_start := previous_end - INTERVAL '90 days';
        ELSE
            period_days := 30;
            current_end := CURRENT_DATE;
            current_start := current_end - INTERVAL '30 days';
            previous_end := current_start;
            previous_start := previous_end - INTERVAL '30 days';
    END CASE;

    RETURN QUERY
    WITH restaurant_data AS (
        SELECT ro.restaurant_id, r.name as restaurant_name
        FROM restaurant_owners ro
        JOIN restaurants r ON ro.restaurant_id = r.id
        WHERE ro.user_id = owner_user_id
        AND ro.verification_status = 'verified'
        AND (target_restaurant_id IS NULL OR ro.restaurant_id = target_restaurant_id)
    ),
    current_metrics AS (
        SELECT 
            rd.restaurant_id,
            COUNT(rt.id) as total_ratings,
            ROUND(AVG(rt.rating), 2) as avg_rating,
            COUNT(DISTINCT rt.user_id) as unique_customers,
            COUNT(DISTINCT CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN rt.id END) as total_reviews,
            COUNT(rr.id) as total_responses
        FROM restaurant_data rd
        LEFT JOIN menu_items mi ON rd.restaurant_id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= current_start AND rt.created_at <= current_end
        LEFT JOIN review_responses rr ON rt.id = rr.rating_id
        GROUP BY rd.restaurant_id
    ),
    previous_metrics AS (
        SELECT 
            rd.restaurant_id,
            COUNT(rt.id) as total_ratings,
            ROUND(AVG(rt.rating), 2) as avg_rating,
            COUNT(DISTINCT rt.user_id) as unique_customers,
            COUNT(DISTINCT CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN rt.id END) as total_reviews,
            COUNT(rr.id) as total_responses
        FROM restaurant_data rd
        LEFT JOIN menu_items mi ON rd.restaurant_id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= previous_start AND rt.created_at <= previous_end
        LEFT JOIN review_responses rr ON rt.id = rr.rating_id
        GROUP BY rd.restaurant_id
    ),
    top_menu_performance AS (
        SELECT 
            rd.restaurant_id,
            jsonb_agg(
                jsonb_build_object(
                    'item_id', mi.id,
                    'item_name', mi.name,
                    'avg_rating', ROUND(AVG(rt.rating), 2),
                    'total_ratings', COUNT(rt.id),
                    'price', mi.price
                ) ORDER BY AVG(rt.rating) DESC, COUNT(rt.id) DESC
            ) FILTER (WHERE mi.id IS NOT NULL) as menu_items
        FROM restaurant_data rd
        LEFT JOIN menu_items mi ON rd.restaurant_id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= current_start
        GROUP BY rd.restaurant_id
    ),
    recent_review_data AS (
        SELECT 
            rd.restaurant_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', rt.id,
                    'rating', rt.rating,
                    'review_text', COALESCE(rt.review_text, ''),
                    'customer_name', up.first_name || ' ' || up.last_name,
                    'created_at', rt.created_at,
                    'menu_item', mi.name,
                    'has_response', CASE WHEN rr.id IS NOT NULL THEN true ELSE false END
                ) ORDER BY rt.created_at DESC
            ) FILTER (WHERE rt.id IS NOT NULL) as reviews
        FROM restaurant_data rd
        LEFT JOIN menu_items mi ON rd.restaurant_id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= current_start
        LEFT JOIN user_profiles up ON rt.user_id = up.id
        LEFT JOIN review_responses rr ON rt.id = rr.rating_id
        GROUP BY rd.restaurant_id
    ),
    rating_dist AS (
        SELECT 
            rd.restaurant_id,
            jsonb_build_object(
                '1_star', COUNT(CASE WHEN rt.rating = 1 THEN 1 END),
                '2_star', COUNT(CASE WHEN rt.rating = 2 THEN 1 END),
                '3_star', COUNT(CASE WHEN rt.rating = 3 THEN 1 END),
                '4_star', COUNT(CASE WHEN rt.rating = 4 THEN 1 END),
                '5_star', COUNT(CASE WHEN rt.rating = 5 THEN 1 END),
                '6_star', COUNT(CASE WHEN rt.rating = 6 THEN 1 END),
                '7_star', COUNT(CASE WHEN rt.rating = 7 THEN 1 END),
                '8_star', COUNT(CASE WHEN rt.rating = 8 THEN 1 END),
                '9_star', COUNT(CASE WHEN rt.rating = 9 THEN 1 END),
                '10_star', COUNT(CASE WHEN rt.rating = 10 THEN 1 END)
            ) as distribution
        FROM restaurant_data rd
        LEFT JOIN menu_items mi ON rd.restaurant_id = mi.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= current_start
        GROUP BY rd.restaurant_id
    )
    SELECT 
        rd.restaurant_id,
        rd.restaurant_name,
        jsonb_build_object(
            'total_ratings', COALESCE(cm.total_ratings, 0),
            'average_rating', COALESCE(cm.avg_rating, 0),
            'unique_customers', COALESCE(cm.unique_customers, 0),
            'total_reviews', COALESCE(cm.total_reviews, 0),
            'total_responses', COALESCE(cm.total_responses, 0),
            'response_rate', CASE 
                WHEN COALESCE(cm.total_reviews, 0) > 0 
                THEN ROUND((COALESCE(cm.total_responses, 0)::numeric / cm.total_reviews) * 100, 2)
                ELSE 0 
            END
        ) as current_period,
        jsonb_build_object(
            'total_ratings', COALESCE(pm.total_ratings, 0),
            'average_rating', COALESCE(pm.avg_rating, 0),
            'unique_customers', COALESCE(pm.unique_customers, 0),
            'total_reviews', COALESCE(pm.total_reviews, 0),
            'total_responses', COALESCE(pm.total_responses, 0)
        ) as previous_period,
        jsonb_build_object(
            'ratings_change', COALESCE(cm.total_ratings, 0) - COALESCE(pm.total_ratings, 0),
            'rating_change', COALESCE(cm.avg_rating, 0) - COALESCE(pm.avg_rating, 0),
            'customers_change', COALESCE(cm.unique_customers, 0) - COALESCE(pm.unique_customers, 0)
        ) as period_comparison,
        COALESCE(tmp.menu_items, '[]'::jsonb) as top_menu_items,
        COALESCE(rrd.reviews, '[]'::jsonb) as recent_reviews,
        COALESCE(rdist.distribution, '{}'::jsonb) as rating_distribution,
        jsonb_build_object(
            'customer_retention', CASE 
                WHEN COALESCE(cm.unique_customers, 0) > 0 
                THEN ROUND(((COALESCE(cm.unique_customers, 0) - COALESCE(pm.unique_customers, 0))::numeric / cm.unique_customers) * 100, 2)
                ELSE 0 
            END,
            'avg_rating_trend', CASE 
                WHEN COALESCE(cm.avg_rating, 0) > COALESCE(pm.avg_rating, 0) THEN 'improving'
                WHEN COALESCE(cm.avg_rating, 0) < COALESCE(pm.avg_rating, 0) THEN 'declining'
                ELSE 'stable'
            END
        ) as customer_insights
    FROM restaurant_data rd
    LEFT JOIN current_metrics cm ON rd.restaurant_id = cm.restaurant_id
    LEFT JOIN previous_metrics pm ON rd.restaurant_id = pm.restaurant_id
    LEFT JOIN top_menu_performance tmp ON rd.restaurant_id = tmp.restaurant_id
    LEFT JOIN recent_review_data rrd ON rd.restaurant_id = rrd.restaurant_id
    LEFT JOIN rating_dist rdist ON rd.restaurant_id = rdist.restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get menu item performance analysis
CREATE OR REPLACE FUNCTION get_menu_item_performance(
    owner_user_id uuid,
    target_restaurant_id uuid,
    time_period text DEFAULT 'month'
)
RETURNS TABLE (
    menu_item_id uuid,
    menu_item_name text,
    category text,
    price numeric,
    total_ratings bigint,
    average_rating numeric,
    rating_trend text,
    performance_score numeric,
    recommendations text[]
) AS $$
DECLARE
    period_days integer;
    period_start date;
    period_end date;
BEGIN
    -- Calculate date range
    CASE time_period
        WHEN 'week' THEN
            period_days := 7;
        WHEN 'month' THEN
            period_days := 30;
        WHEN 'quarter' THEN
            period_days := 90;
        ELSE
            period_days := 30;
    END CASE;
    
    period_end := CURRENT_DATE;
    period_start := period_end - (period_days || ' days')::interval;

    RETURN QUERY
    WITH menu_performance AS (
        SELECT 
            mi.id as menu_item_id,
            mi.name as menu_item_name,
            mi.category,
            mi.price,
            COUNT(rt.id) as total_ratings,
            ROUND(AVG(rt.rating), 2) as average_rating,
            -- Calculate trend by comparing recent vs older ratings
            CASE 
                WHEN AVG(CASE WHEN rt.created_at >= (CURRENT_DATE - (period_days/2 || ' days')::interval) THEN rt.rating END) >
                     AVG(CASE WHEN rt.created_at < (CURRENT_DATE - (period_days/2 || ' days')::interval) THEN rt.rating END) + 0.5
                THEN 'improving'
                WHEN AVG(CASE WHEN rt.created_at >= (CURRENT_DATE - (period_days/2 || ' days')::interval) THEN rt.rating END) <
                     AVG(CASE WHEN rt.created_at < (CURRENT_DATE - (period_days/2 || ' days')::interval) THEN rt.rating END) - 0.5
                THEN 'declining'
                ELSE 'stable'
            END as rating_trend
        FROM menu_items mi
        JOIN restaurant_owners ro ON mi.restaurant_id = ro.restaurant_id
        LEFT JOIN ratings rt ON mi.id = rt.menu_item_id AND rt.created_at >= period_start
        WHERE ro.user_id = owner_user_id
        AND ro.verification_status = 'verified'
        AND mi.restaurant_id = target_restaurant_id
        GROUP BY mi.id, mi.name, mi.category, mi.price
    )
    SELECT 
        mp.menu_item_id,
        mp.menu_item_name,
        mp.category,
        mp.price,
        mp.total_ratings,
        mp.average_rating,
        mp.rating_trend,
        -- Performance score (0-100) based on rating and volume
        CASE 
            WHEN mp.total_ratings = 0 THEN 0
            ELSE ROUND(((mp.average_rating / 10.0) * 0.7 + (LEAST(mp.total_ratings, 50) / 50.0) * 0.3) * 100, 2)
        END as performance_score,
        -- Generate recommendations
        CASE 
            WHEN mp.total_ratings = 0 THEN ARRAY['Consider promoting this item to get customer feedback']
            WHEN mp.average_rating < 5 THEN ARRAY['Review recipe or preparation method', 'Consider customer feedback for improvements']
            WHEN mp.rating_trend = 'declining' THEN ARRAY['Investigate recent quality issues', 'Check ingredient sourcing']
            WHEN mp.average_rating >= 8 AND mp.total_ratings >= 10 THEN ARRAY['Popular item - consider featuring prominently', 'Monitor consistency']
            WHEN mp.total_ratings < 5 THEN ARRAY['Low visibility - consider menu placement or promotions']
            ELSE ARRAY['Performing well - maintain current standards']
        END as recommendations
    FROM menu_performance mp
    ORDER BY mp.average_rating DESC, mp.total_ratings DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer feedback aggregation
CREATE OR REPLACE FUNCTION get_customer_feedback_insights(
    owner_user_id uuid,
    target_restaurant_id uuid,
    time_period text DEFAULT 'month'
)
RETURNS TABLE (
    feedback_summary jsonb,
    sentiment_breakdown jsonb,
    common_themes jsonb,
    actionable_insights text[]
) AS $$
DECLARE
    period_days integer;
    period_start date;
    period_end date;
BEGIN
    -- Calculate date range
    CASE time_period
        WHEN 'week' THEN period_days := 7;
        WHEN 'month' THEN period_days := 30;
        WHEN 'quarter' THEN period_days := 90;
        ELSE period_days := 30;
    END CASE;
    
    period_end := CURRENT_DATE;
    period_start := period_end - (period_days || ' days')::interval;

    RETURN QUERY
    WITH feedback_data AS (
        SELECT 
            rt.rating,
            rt.review_text,
            rt.created_at,
            CASE 
                WHEN rt.rating >= 8 THEN 'positive'
                WHEN rt.rating >= 6 THEN 'neutral'
                ELSE 'negative'
            END as sentiment
        FROM menu_items mi
        JOIN restaurant_owners ro ON mi.restaurant_id = ro.restaurant_id
        JOIN ratings rt ON mi.id = rt.menu_item_id
        WHERE ro.user_id = owner_user_id
        AND ro.verification_status = 'verified'
        AND mi.restaurant_id = target_restaurant_id
        AND rt.created_at >= period_start
        AND rt.review_text IS NOT NULL
        AND rt.review_text != ''
    ),
    sentiment_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
            COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
            COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
            COUNT(*) as total_reviews,
            ROUND(AVG(rating), 2) as avg_rating
        FROM feedback_data
    )
    SELECT 
        jsonb_build_object(
            'total_reviews', ss.total_reviews,
            'average_rating', ss.avg_rating,
            'review_volume_trend', CASE 
                WHEN ss.total_reviews > 10 THEN 'high'
                WHEN ss.total_reviews > 3 THEN 'moderate'
                ELSE 'low'
            END
        ) as feedback_summary,
        jsonb_build_object(
            'positive', ss.positive_count,
            'neutral', ss.neutral_count,
            'negative', ss.negative_count,
            'positive_percentage', CASE WHEN ss.total_reviews > 0 THEN ROUND((ss.positive_count::numeric / ss.total_reviews) * 100, 1) ELSE 0 END,
            'negative_percentage', CASE WHEN ss.total_reviews > 0 THEN ROUND((ss.negative_count::numeric / ss.total_reviews) * 100, 1) ELSE 0 END
        ) as sentiment_breakdown,
        jsonb_build_object(
            'service_mentions', COUNT(fd.*) FILTER (WHERE fd.review_text ILIKE '%service%' OR fd.review_text ILIKE '%staff%'),
            'food_quality_mentions', COUNT(fd.*) FILTER (WHERE fd.review_text ILIKE '%food%' OR fd.review_text ILIKE '%taste%' OR fd.review_text ILIKE '%delicious%'),
            'ambiance_mentions', COUNT(fd.*) FILTER (WHERE fd.review_text ILIKE '%atmosphere%' OR fd.review_text ILIKE '%ambiance%'),
            'value_mentions', COUNT(fd.*) FILTER (WHERE fd.review_text ILIKE '%price%' OR fd.review_text ILIKE '%value%' OR fd.review_text ILIKE '%expensive%')
        ) as common_themes,
        ARRAY[
            CASE WHEN ss.negative_count > ss.positive_count THEN 'Focus on addressing negative feedback patterns' ELSE 'Maintain current service standards' END,
            CASE WHEN ss.avg_rating < 6 THEN 'Consider menu or service improvements' ELSE 'Continue current approach' END,
            CASE WHEN ss.total_reviews < 5 THEN 'Encourage more customers to leave reviews' ELSE 'Good review volume' END
        ] as actionable_insights
    FROM sentiment_stats ss
    CROSS JOIN feedback_data fd
    GROUP BY ss.total_reviews, ss.avg_rating, ss.positive_count, ss.neutral_count, ss.negative_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update analytics tables (to be run daily via cron)
CREATE OR REPLACE FUNCTION update_restaurant_analytics_daily()
RETURNS void AS $$
DECLARE
    current_date_val date := CURRENT_DATE;
    week_start date := current_date_val - EXTRACT(DOW FROM current_date_val)::integer;
    month_start date := date_trunc('month', current_date_val)::date;
BEGIN
    -- Update daily analytics
    INSERT INTO restaurant_analytics_summary (
        restaurant_id, period_type, period_start, period_end,
        total_ratings, average_rating, total_reviews, total_responses,
        response_rate, unique_customers
    )
    SELECT 
        r.id as restaurant_id,
        'daily' as period_type,
        current_date_val as period_start,
        current_date_val as period_end,
        COUNT(rt.id) as total_ratings,
        ROUND(AVG(rt.rating), 2) as average_rating,
        COUNT(CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN 1 END) as total_reviews,
        COUNT(rr.id) as total_responses,
        CASE WHEN COUNT(CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN 1 END) > 0
             THEN ROUND((COUNT(rr.id)::numeric / COUNT(CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN 1 END)) * 100, 2)
             ELSE 0 END as response_rate,
        COUNT(DISTINCT rt.user_id) as unique_customers
    FROM restaurants r
    LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
    LEFT JOIN ratings rt ON mi.id = rt.menu_item_id 
        AND rt.created_at >= current_date_val 
        AND rt.created_at < current_date_val + INTERVAL '1 day'
    LEFT JOIN review_responses rr ON rt.id = rr.rating_id
    GROUP BY r.id
    ON CONFLICT (restaurant_id, period_type, period_start) 
    DO UPDATE SET
        total_ratings = EXCLUDED.total_ratings,
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        total_responses = EXCLUDED.total_responses,
        response_rate = EXCLUDED.response_rate,
        unique_customers = EXCLUDED.unique_customers,
        updated_at = timezone('utc'::text, now());

    -- Update menu item analytics daily
    INSERT INTO menu_item_analytics (
        menu_item_id, restaurant_id, period_type, period_start, period_end,
        total_ratings, average_rating, total_reviews
    )
    SELECT 
        mi.id as menu_item_id,
        mi.restaurant_id,
        'daily' as period_type,
        current_date_val as period_start,
        current_date_val as period_end,
        COUNT(rt.id) as total_ratings,
        ROUND(AVG(rt.rating), 2) as average_rating,
        COUNT(CASE WHEN rt.review_text IS NOT NULL AND rt.review_text != '' THEN 1 END) as total_reviews
    FROM menu_items mi
    LEFT JOIN ratings rt ON mi.id = rt.menu_item_id 
        AND rt.created_at >= current_date_val 
        AND rt.created_at < current_date_val + INTERVAL '1 day'
    GROUP BY mi.id, mi.restaurant_id
    ON CONFLICT (menu_item_id, period_type, period_start) 
    DO UPDATE SET
        total_ratings = EXCLUDED.total_ratings,
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE restaurant_analytics_summary IS 'Stores aggregated restaurant performance metrics by time period';
COMMENT ON TABLE menu_item_analytics IS 'Stores menu item performance analytics and trends';
COMMENT ON TABLE customer_feedback_summary IS 'Stores aggregated customer feedback analysis and sentiment data';
COMMENT ON FUNCTION get_restaurant_performance_dashboard IS 'Returns comprehensive restaurant performance data for owner dashboard';
COMMENT ON FUNCTION get_menu_item_performance IS 'Returns detailed menu item performance analysis with recommendations';
COMMENT ON FUNCTION get_customer_feedback_insights IS 'Returns customer feedback aggregation and sentiment analysis';
