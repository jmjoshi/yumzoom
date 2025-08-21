-- Advanced Search & Filtering Migration
-- This script adds necessary columns and indexes for advanced search functionality

-- Add dietary restrictions to menu items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_restrictions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegetarian boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegan boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_gluten_free boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens jsonb DEFAULT '[]'::jsonb;

-- Add location coordinates to restaurants for geo-search
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude decimal(10, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude decimal(11, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';

-- Add search-related metadata
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_range_category text CHECK (price_range_category IN ('$', '$$', '$$$', '$$$$'));

-- Add full-text search indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_search 
ON restaurants USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(cuisine_type, '')));

CREATE INDEX IF NOT EXISTS idx_menu_items_search 
ON menu_items USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '')));

-- Add GIN indexes for jsonb columns
CREATE INDEX IF NOT EXISTS idx_menu_items_dietary_restrictions ON menu_items USING gin(dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_menu_items_allergens ON menu_items USING gin(allergens);
CREATE INDEX IF NOT EXISTS idx_restaurants_tags ON restaurants USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_restaurants_features ON restaurants USING gin(features);

-- Add location-based indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type ON restaurants(cuisine_type) WHERE cuisine_type IS NOT NULL;

-- Add search performance indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range ON restaurants(price_range_category) WHERE price_range_category IS NOT NULL;

-- Create a view for search results that includes aggregated data
CREATE OR REPLACE VIEW restaurant_search_view AS
SELECT 
    r.id,
    r.name,
    r.description,
    r.address,
    r.city,
    r.state,
    r.cuisine_type,
    r.image_url,
    r.latitude,
    r.longitude,
    r.tags,
    r.features,
    r.price_range_category,
    r.created_at,
    r.updated_at,
    COALESCE(AVG(ratings.rating), 0) as average_rating,
    COUNT(ratings.id) as review_count,
    COALESCE(AVG(mi.price), 0) as average_price,
    COUNT(mi.id) as menu_item_count,
    -- Aggregated dietary options
    CASE WHEN COUNT(mi.id) FILTER (WHERE mi.is_vegetarian = true) > 0 THEN true ELSE false END as has_vegetarian_options,
    CASE WHEN COUNT(mi.id) FILTER (WHERE mi.is_vegan = true) > 0 THEN true ELSE false END as has_vegan_options,
    CASE WHEN COUNT(mi.id) FILTER (WHERE mi.is_gluten_free = true) > 0 THEN true ELSE false END as has_gluten_free_options,
    -- Search keywords for full-text search
    to_tsvector('english', 
        coalesce(r.name, '') || ' ' || 
        coalesce(r.description, '') || ' ' || 
        coalesce(r.cuisine_type, '') || ' ' ||
        coalesce(r.city, '') || ' ' ||
        coalesce(string_agg(mi.name, ' '), '')
    ) as search_vector
FROM restaurants r
LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
LEFT JOIN ratings ON mi.id = ratings.menu_item_id
GROUP BY r.id, r.name, r.description, r.address, r.city, r.state, r.cuisine_type, 
         r.image_url, r.latitude, r.longitude, r.tags, r.features, r.price_range_category,
         r.created_at, r.updated_at;

-- Create an index on the search view
CREATE INDEX IF NOT EXISTS idx_restaurant_search_view_search_vector 
ON restaurant_search_view USING gin(search_vector);

-- Add some sample data to support advanced search features
-- Update existing restaurants with sample location data
UPDATE restaurants SET 
    latitude = 40.7589 + (random() - 0.5) * 0.1,
    longitude = -73.9851 + (random() - 0.5) * 0.1,
    city = 'New York',
    state = 'NY',
    zip_code = '10001',
    tags = '["Kid-Friendly", "Casual"]'::jsonb,
    price_range_category = CASE 
        WHEN random() < 0.25 THEN '$'
        WHEN random() < 0.5 THEN '$$'
        WHEN random() < 0.75 THEN '$$$'
        ELSE '$$$$'
    END
WHERE latitude IS NULL;

-- Update menu items with dietary restriction data
UPDATE menu_items SET 
    is_vegetarian = CASE WHEN name ILIKE '%vegetarian%' OR name ILIKE '%veggie%' OR name ILIKE '%salad%' THEN true ELSE false END,
    is_vegan = CASE WHEN name ILIKE '%vegan%' THEN true ELSE false END,
    is_gluten_free = CASE WHEN name ILIKE '%gluten%' OR random() < 0.2 THEN true ELSE false END,
    dietary_restrictions = CASE 
        WHEN name ILIKE '%vegetarian%' THEN '["Vegetarian"]'::jsonb
        WHEN name ILIKE '%vegan%' THEN '["Vegan", "Vegetarian"]'::jsonb
        WHEN name ILIKE '%gluten%' THEN '["Gluten-Free"]'::jsonb
        ELSE '[]'::jsonb
    END,
    allergens = CASE 
        WHEN name ILIKE '%nut%' OR name ILIKE '%peanut%' THEN '["Nuts"]'::jsonb
        WHEN name ILIKE '%dairy%' OR name ILIKE '%cheese%' OR name ILIKE '%milk%' THEN '["Dairy"]'::jsonb
        WHEN name ILIKE '%shellfish%' OR name ILIKE '%shrimp%' OR name ILIKE '%crab%' THEN '["Shellfish"]'::jsonb
        ELSE '[]'::jsonb
    END;

-- Create a function for distance calculation
CREATE OR REPLACE FUNCTION calculate_distance(lat1 decimal, lon1 decimal, lat2 decimal, lon2 decimal)
RETURNS decimal AS $$
DECLARE
    radius decimal := 3959; -- Earth's radius in miles
    dlat decimal;
    dlon decimal;
    a decimal;
    c decimal;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN radius * c;
END;
$$ LANGUAGE plpgsql;

-- Create search analytics table for tracking popular searches
CREATE TABLE IF NOT EXISTS search_analytics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    search_query text,
    filters jsonb,
    results_count integer,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

-- Add a function to get popular search terms
CREATE OR REPLACE FUNCTION get_popular_search_terms(limit_count integer DEFAULT 10)
RETURNS TABLE(search_term text, search_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        search_query,
        COUNT(*) as search_count
    FROM search_analytics 
    WHERE search_query IS NOT NULL 
      AND search_query != ''
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY search_query
    ORDER BY COUNT(*) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for search analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own search analytics" ON search_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view aggregated search analytics" ON search_analytics
    FOR SELECT USING (true);

COMMENT ON TABLE search_analytics IS 'Tracks search queries and filters for analytics and improving search experience';
COMMENT ON FUNCTION calculate_distance IS 'Calculates distance between two latitude/longitude points in miles';
COMMENT ON FUNCTION get_popular_search_terms IS 'Returns most popular search terms from the last 30 days';
