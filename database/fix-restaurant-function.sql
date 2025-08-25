-- Fixed get_restaurant_with_characteristics function
-- This version works with the actual restaurant table structure

CREATE OR REPLACE FUNCTION get_restaurant_with_characteristics(restaurant_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    cuisine_type TEXT,
    image_url TEXT,
    rating NUMERIC,
    review_count INTEGER,
    price_range TEXT,
    ambience_rating NUMERIC,
    decor_rating NUMERIC,
    service_rating NUMERIC,
    cleanliness_rating NUMERIC,
    noise_level_rating NUMERIC,
    value_for_money_rating NUMERIC,
    food_quality_rating NUMERIC,
    overall_rating NUMERIC,
    total_ratings_count INTEGER,
    characteristics_updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        r.address,
        r.phone,
        r.website,
        r.cuisine_type,
        r.image_url,
        r.rating,
        r.review_count,
        r.price_range,
        COALESCE(rc.ambience_rating, 0.0) as ambience_rating,
        COALESCE(rc.decor_rating, 0.0) as decor_rating,
        COALESCE(rc.service_rating, 0.0) as service_rating,
        COALESCE(rc.cleanliness_rating, 0.0) as cleanliness_rating,
        COALESCE(rc.noise_level_rating, 0.0) as noise_level_rating,
        COALESCE(rc.value_for_money_rating, 0.0) as value_for_money_rating,
        COALESCE(rc.food_quality_rating, 0.0) as food_quality_rating,
        COALESCE(rc.overall_rating, 0.0) as overall_rating,
        COALESCE(rc.total_ratings_count, 0) as total_ratings_count,
        rc.updated_at as characteristics_updated_at
    FROM restaurants r
    LEFT JOIN restaurant_characteristics rc ON r.id = rc.restaurant_id
    WHERE r.id = restaurant_id;
END;
$$ LANGUAGE plpgsql;
