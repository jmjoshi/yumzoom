-- Analytics Dashboard Database Optimizations
-- This script creates tables and views to optimize analytics queries

-- Analytics aggregation tables for better performance
CREATE TABLE IF NOT EXISTS family_analytics_daily (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    total_ratings integer DEFAULT 0,
    average_rating decimal(3,2) DEFAULT 0,
    unique_restaurants integer DEFAULT 0,
    active_family_members integer DEFAULT 0,
    estimated_spending decimal(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Restaurant popularity aggregation
CREATE TABLE IF NOT EXISTS restaurant_popularity (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    visit_count integer DEFAULT 0,
    total_ratings integer DEFAULT 0,
    average_rating decimal(3,2) DEFAULT 0,
    last_visit_date timestamp with time zone,
    first_visit_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

-- Cuisine preference aggregation
CREATE TABLE IF NOT EXISTS cuisine_preferences (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cuisine_type text NOT NULL,
    rating_count integer DEFAULT 0,
    average_rating decimal(3,2) DEFAULT 0,
    percentage decimal(5,2) DEFAULT 0,
    trend_direction text DEFAULT 'stable' CHECK (trend_direction IN ('up', 'down', 'stable')),
    last_rating_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, cuisine_type)
);

-- Family member activity aggregation
CREATE TABLE IF NOT EXISTS member_activity_stats (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
    rating_count integer DEFAULT 0,
    average_rating decimal(3,2) DEFAULT 0,
    favorite_restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
    favorite_cuisine_type text,
    last_activity_date timestamp with time zone,
    engagement_trend text DEFAULT 'stable' CHECK (engagement_trend IN ('up', 'down', 'stable')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, family_member_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_analytics_daily_user_date ON family_analytics_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_restaurant_popularity_user ON restaurant_popularity(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_popularity_visit_count ON restaurant_popularity(visit_count DESC);
CREATE INDEX IF NOT EXISTS idx_cuisine_preferences_user ON cuisine_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_stats_user ON member_activity_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_stats_rating_count ON member_activity_stats(rating_count DESC);

-- Additional indexes on existing tables for analytics
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_user_created_at ON ratings(user_id, created_at);

-- Views for analytics queries
CREATE OR REPLACE VIEW v_family_dining_insights AS
SELECT 
    r.user_id,
    DATE_TRUNC('day', r.created_at) as rating_date,
    COUNT(DISTINCT mi.restaurant_id) as unique_restaurants,
    COUNT(r.id) as total_ratings,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT r.family_member_id) FILTER (WHERE r.family_member_id IS NOT NULL) as active_family_members,
    SUM(COALESCE(mi.price, 0)) as estimated_spending
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
GROUP BY r.user_id, DATE_TRUNC('day', r.created_at);

CREATE OR REPLACE VIEW v_popular_restaurants AS
SELECT 
    r.user_id,
    mi.restaurant_id,
    rest.name as restaurant_name,
    rest.address as restaurant_address,
    rest.cuisine_type,
    COUNT(r.id) as visit_frequency,
    AVG(r.rating) as average_rating,
    MAX(r.created_at) as last_visit,
    MIN(r.created_at) as first_visit
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
JOIN restaurants rest ON mi.restaurant_id = rest.id
GROUP BY r.user_id, mi.restaurant_id, rest.name, rest.address, rest.cuisine_type;

CREATE OR REPLACE VIEW v_cuisine_preferences AS
SELECT 
    r.user_id,
    rest.cuisine_type,
    COUNT(r.id) as rating_count,
    AVG(r.rating) as average_rating,
    MAX(r.created_at) as last_rating_date
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
JOIN restaurants rest ON mi.restaurant_id = rest.id
WHERE rest.cuisine_type IS NOT NULL
GROUP BY r.user_id, rest.cuisine_type;

CREATE OR REPLACE VIEW v_member_activity AS
SELECT 
    r.user_id,
    COALESCE(r.family_member_id, gen_random_uuid()) as member_id,
    COALESCE(fm.name, 'Account Holder') as member_name,
    fm.relationship,
    COUNT(r.id) as rating_count,
    AVG(r.rating) as average_rating,
    MAX(r.created_at) as most_recent_activity,
    (
        SELECT rest.name 
        FROM ratings r2 
        JOIN menu_items mi2 ON r2.menu_item_id = mi2.id 
        JOIN restaurants rest ON mi2.restaurant_id = rest.id 
        WHERE r2.user_id = r.user_id 
        AND COALESCE(r2.family_member_id, gen_random_uuid()) = COALESCE(r.family_member_id, gen_random_uuid())
        GROUP BY rest.name 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as favorite_restaurant,
    (
        SELECT rest.cuisine_type 
        FROM ratings r2 
        JOIN menu_items mi2 ON r2.menu_item_id = mi2.id 
        JOIN restaurants rest ON mi2.restaurant_id = rest.id 
        WHERE r2.user_id = r.user_id 
        AND COALESCE(r2.family_member_id, gen_random_uuid()) = COALESCE(r.family_member_id, gen_random_uuid())
        AND rest.cuisine_type IS NOT NULL
        GROUP BY rest.cuisine_type 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as favorite_cuisine
FROM ratings r
LEFT JOIN family_members fm ON r.family_member_id = fm.id
GROUP BY r.user_id, r.family_member_id, fm.name, fm.relationship;

-- Function to refresh analytics aggregations
CREATE OR REPLACE FUNCTION refresh_analytics_aggregations(target_user_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- Refresh family analytics daily
    INSERT INTO family_analytics_daily (
        user_id, date, total_ratings, average_rating, unique_restaurants, 
        active_family_members, estimated_spending
    )
    SELECT 
        user_id, rating_date::date, total_ratings, average_rating::decimal(3,2), 
        unique_restaurants, active_family_members, estimated_spending::decimal(10,2)
    FROM v_family_dining_insights
    WHERE (target_user_id IS NULL OR user_id = target_user_id)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        total_ratings = EXCLUDED.total_ratings,
        average_rating = EXCLUDED.average_rating,
        unique_restaurants = EXCLUDED.unique_restaurants,
        active_family_members = EXCLUDED.active_family_members,
        estimated_spending = EXCLUDED.estimated_spending,
        updated_at = NOW();

    -- Refresh restaurant popularity
    INSERT INTO restaurant_popularity (
        user_id, restaurant_id, visit_count, total_ratings, average_rating, 
        last_visit_date, first_visit_date
    )
    SELECT 
        user_id, restaurant_id, visit_frequency, visit_frequency, 
        average_rating::decimal(3,2), last_visit, first_visit
    FROM v_popular_restaurants
    WHERE (target_user_id IS NULL OR user_id = target_user_id)
    ON CONFLICT (user_id, restaurant_id) 
    DO UPDATE SET 
        visit_count = EXCLUDED.visit_count,
        total_ratings = EXCLUDED.total_ratings,
        average_rating = EXCLUDED.average_rating,
        last_visit_date = EXCLUDED.last_visit_date,
        first_visit_date = EXCLUDED.first_visit_date,
        updated_at = NOW();

    -- Refresh cuisine preferences
    INSERT INTO cuisine_preferences (
        user_id, cuisine_type, rating_count, average_rating, last_rating_date
    )
    SELECT 
        user_id, cuisine_type, rating_count, average_rating::decimal(3,2), last_rating_date
    FROM v_cuisine_preferences
    WHERE (target_user_id IS NULL OR user_id = target_user_id)
    ON CONFLICT (user_id, cuisine_type) 
    DO UPDATE SET 
        rating_count = EXCLUDED.rating_count,
        average_rating = EXCLUDED.average_rating,
        last_rating_date = EXCLUDED.last_rating_date,
        updated_at = NOW();

    -- Calculate cuisine preference percentages
    UPDATE cuisine_preferences 
    SET percentage = (
        rating_count::decimal / NULLIF((
            SELECT SUM(rating_count) 
            FROM cuisine_preferences cp2 
            WHERE cp2.user_id = cuisine_preferences.user_id
        ), 0) * 100
    )
    WHERE (target_user_id IS NULL OR user_id = target_user_id);

END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh analytics when ratings are inserted/updated
CREATE OR REPLACE FUNCTION trigger_refresh_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule analytics refresh for this user
    PERFORM refresh_analytics_aggregations(COALESCE(NEW.user_id, OLD.user_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ratings table
DROP TRIGGER IF EXISTS ratings_analytics_refresh ON ratings;
CREATE TRIGGER ratings_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_analytics();

-- Row Level Security for analytics tables
ALTER TABLE family_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_popularity ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisine_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activity_stats ENABLE ROW LEVEL SECURITY;

-- Policies for analytics tables
CREATE POLICY "Users can view their own analytics" ON family_analytics_daily
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own restaurant popularity" ON restaurant_popularity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cuisine preferences" ON cuisine_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own member activity stats" ON member_activity_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Initial analytics refresh for existing data
SELECT refresh_analytics_aggregations();
