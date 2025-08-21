-- Analytics optimization migration
-- Create indexes and views for better analytics performance

-- Indexes for better analytics query performance
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_user_created ON ratings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_family_member_created ON ratings(family_member_id, created_at);

-- Composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_ratings_user_menu_item ON ratings(user_id, menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_price ON menu_items(restaurant_id, price);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);

-- Create analytics materialized views for better performance
-- Note: These are regular views for now, can be materialized in production

-- Family dining insights view
CREATE OR REPLACE VIEW family_dining_insights AS
SELECT 
    r.user_id,
    DATE_TRUNC('day', r.created_at) as date,
    COUNT(DISTINCT mi.restaurant_id) as restaurants_visited,
    COUNT(r.id) as total_ratings,
    AVG(r.rating) as average_rating,
    SUM(COALESCE(mi.price, 0)) as estimated_spending,
    COUNT(DISTINCT r.family_member_id) as active_members
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
GROUP BY r.user_id, DATE_TRUNC('day', r.created_at);

-- Popular restaurants view
CREATE OR REPLACE VIEW popular_restaurants AS
SELECT 
    r.user_id,
    rest.id as restaurant_id,
    rest.name as restaurant_name,
    rest.address as restaurant_address,
    rest.cuisine_type,
    COUNT(r.id) as visit_frequency,
    AVG(r.rating) as average_rating,
    MAX(r.created_at) as last_visit,
    COUNT(r.id) as total_ratings
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
JOIN restaurants rest ON mi.restaurant_id = rest.id
GROUP BY r.user_id, rest.id, rest.name, rest.address, rest.cuisine_type;

-- Cuisine preferences view
CREATE OR REPLACE VIEW cuisine_preferences AS
SELECT 
    r.user_id,
    rest.cuisine_type,
    COUNT(r.id) as rating_count,
    AVG(r.rating) as average_rating,
    (COUNT(r.id) * 100.0 / 
        (SELECT COUNT(*) FROM ratings r2 WHERE r2.user_id = r.user_id)
    ) as percentage
FROM ratings r
JOIN menu_items mi ON r.menu_item_id = mi.id
JOIN restaurants rest ON mi.restaurant_id = rest.id
WHERE rest.cuisine_type IS NOT NULL
GROUP BY r.user_id, rest.cuisine_type;

-- Family member activity view
CREATE OR REPLACE VIEW family_member_activity AS
SELECT 
    fm.user_id,
    fm.id as member_id,
    fm.name as member_name,
    fm.relationship,
    COUNT(r.id) as rating_count,
    AVG(r.rating) as average_rating,
    MAX(r.created_at) as most_recent_activity,
    (
        SELECT rest.name 
        FROM ratings r2 
        JOIN menu_items mi2 ON r2.menu_item_id = mi2.id
        JOIN restaurants rest ON mi2.restaurant_id = rest.id
        WHERE r2.family_member_id = fm.id 
        GROUP BY rest.name 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as favorite_restaurant,
    (
        SELECT rest.cuisine_type 
        FROM ratings r3 
        JOIN menu_items mi3 ON r3.menu_item_id = mi3.id
        JOIN restaurants rest ON mi3.restaurant_id = rest.id
        WHERE r3.family_member_id = fm.id 
        GROUP BY rest.cuisine_type 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as favorite_cuisine
FROM family_members fm
LEFT JOIN ratings r ON fm.id = r.family_member_id
GROUP BY fm.user_id, fm.id, fm.name, fm.relationship;

-- Grant appropriate permissions
-- These policies will be handled by RLS, but adding comments for reference

-- Comments for future optimization:
-- COMMENT ON VIEW family_dining_insights IS 'Aggregated family dining patterns for analytics dashboard';
-- COMMENT ON VIEW popular_restaurants IS 'Restaurant popularity rankings per family';
-- COMMENT ON VIEW cuisine_preferences IS 'Family cuisine preference analysis';
-- COMMENT ON VIEW family_member_activity IS 'Individual family member engagement metrics';

-- Performance monitoring query (for development)
-- SELECT schemaname, tablename, attname, n_distinct, correlation 
-- FROM pg_stats 
-- WHERE schemaname = 'public' AND tablename IN ('ratings', 'menu_items', 'restaurants');
