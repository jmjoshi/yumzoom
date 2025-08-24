-- Restaurant Characteristics Schema Migration
-- Adds detailed restaurant characteristics and ratings

-- Restaurant characteristics table
CREATE TABLE restaurant_characteristics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    ambience_rating decimal(3,1) NOT NULL CHECK (ambience_rating >= 1.0 AND ambience_rating <= 10.0),
    decor_rating decimal(3,1) NOT NULL CHECK (decor_rating >= 1.0 AND decor_rating <= 10.0),
    service_rating decimal(3,1) NOT NULL CHECK (service_rating >= 1.0 AND service_rating <= 10.0),
    cleanliness_rating decimal(3,1) NOT NULL CHECK (cleanliness_rating >= 1.0 AND cleanliness_rating <= 10.0),
    noise_level_rating decimal(3,1) NOT NULL CHECK (noise_level_rating >= 1.0 AND noise_level_rating <= 10.0),
    value_for_money_rating decimal(3,1) NOT NULL CHECK (value_for_money_rating >= 1.0 AND value_for_money_rating <= 10.0),
    food_quality_rating decimal(3,1) NOT NULL CHECK (food_quality_rating >= 1.0 AND food_quality_rating <= 10.0),
    overall_rating decimal(3,1) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 10.0),
    total_ratings_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id)
);

-- User restaurant ratings table (individual user ratings for characteristics)
CREATE TABLE user_restaurant_ratings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    ambience_rating integer NOT NULL CHECK (ambience_rating >= 1 AND ambience_rating <= 10),
    decor_rating integer NOT NULL CHECK (decor_rating >= 1 AND decor_rating <= 10),
    service_rating integer NOT NULL CHECK (service_rating >= 1 AND service_rating <= 10),
    cleanliness_rating integer NOT NULL CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 10),
    noise_level_rating integer NOT NULL CHECK (noise_level_rating >= 1 AND noise_level_rating <= 10),
    value_for_money_rating integer NOT NULL CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 10),
    food_quality_rating integer NOT NULL CHECK (food_quality_rating >= 1 AND food_quality_rating <= 10),
    overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 10),
    review_text text,
    visit_date date,
    would_recommend boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

-- Restaurant rating photos table
CREATE TABLE restaurant_rating_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_restaurant_rating_id uuid REFERENCES user_restaurant_ratings(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    photo_filename text NOT NULL,
    photo_size integer,
    photo_type text, -- 'food', 'ambience', 'exterior', 'interior', 'menu'
    upload_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurant rating votes (helpfulness voting)
CREATE TABLE restaurant_rating_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_restaurant_rating_id uuid REFERENCES user_restaurant_ratings(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_restaurant_rating_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_restaurant_characteristics_restaurant_id ON restaurant_characteristics(restaurant_id);
CREATE INDEX idx_user_restaurant_ratings_user_id ON user_restaurant_ratings(user_id);
CREATE INDEX idx_user_restaurant_ratings_restaurant_id ON user_restaurant_ratings(restaurant_id);
CREATE INDEX idx_user_restaurant_ratings_overall_rating ON user_restaurant_ratings(overall_rating);
CREATE INDEX idx_restaurant_rating_photos_rating_id ON restaurant_rating_photos(user_restaurant_rating_id);
CREATE INDEX idx_restaurant_rating_votes_rating_id ON restaurant_rating_votes(user_restaurant_rating_id);
CREATE INDEX idx_restaurant_rating_votes_user_id ON restaurant_rating_votes(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_restaurant_characteristics_updated_at
    BEFORE UPDATE ON restaurant_characteristics
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_restaurant_ratings_updated_at
    BEFORE UPDATE ON user_restaurant_ratings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurant_rating_votes_updated_at
    BEFORE UPDATE ON restaurant_rating_votes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE restaurant_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restaurant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_rating_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_rating_votes ENABLE ROW LEVEL SECURITY;

-- Restaurant characteristics policies (public read access)
CREATE POLICY "Anyone can view restaurant characteristics" ON restaurant_characteristics
    FOR SELECT USING (true);

-- User restaurant ratings policies
CREATE POLICY "Anyone can view restaurant ratings" ON user_restaurant_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own restaurant ratings" ON user_restaurant_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant ratings" ON user_restaurant_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant ratings" ON user_restaurant_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Restaurant rating photos policies
CREATE POLICY "Anyone can view restaurant rating photos" ON restaurant_rating_photos
    FOR SELECT USING (true);

CREATE POLICY "Users can manage photos for their own ratings" ON restaurant_rating_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_restaurant_ratings urr 
            WHERE urr.id = user_restaurant_rating_id 
            AND urr.user_id = auth.uid()
        )
    );

-- Restaurant rating votes policies
CREATE POLICY "Users can view all rating votes" ON restaurant_rating_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON restaurant_rating_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON restaurant_rating_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON restaurant_rating_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update restaurant characteristics when user ratings change
CREATE OR REPLACE FUNCTION update_restaurant_characteristics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update restaurant characteristics based on all user ratings
    INSERT INTO restaurant_characteristics (
        restaurant_id,
        ambience_rating,
        decor_rating,
        service_rating,
        cleanliness_rating,
        noise_level_rating,
        value_for_money_rating,
        food_quality_rating,
        overall_rating,
        total_ratings_count
    )
    SELECT 
        COALESCE(NEW.restaurant_id, OLD.restaurant_id) as restaurant_id,
        ROUND(AVG(ambience_rating::decimal), 1) as ambience_rating,
        ROUND(AVG(decor_rating::decimal), 1) as decor_rating,
        ROUND(AVG(service_rating::decimal), 1) as service_rating,
        ROUND(AVG(cleanliness_rating::decimal), 1) as cleanliness_rating,
        ROUND(AVG(noise_level_rating::decimal), 1) as noise_level_rating,
        ROUND(AVG(value_for_money_rating::decimal), 1) as value_for_money_rating,
        ROUND(AVG(food_quality_rating::decimal), 1) as food_quality_rating,
        ROUND(AVG(overall_rating::decimal), 1) as overall_rating,
        COUNT(*)::integer as total_ratings_count
    FROM user_restaurant_ratings 
    WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
    GROUP BY restaurant_id
    ON CONFLICT (restaurant_id) 
    DO UPDATE SET
        ambience_rating = EXCLUDED.ambience_rating,
        decor_rating = EXCLUDED.decor_rating,
        service_rating = EXCLUDED.service_rating,
        cleanliness_rating = EXCLUDED.cleanliness_rating,
        noise_level_rating = EXCLUDED.noise_level_rating,
        value_for_money_rating = EXCLUDED.value_for_money_rating,
        food_quality_rating = EXCLUDED.food_quality_rating,
        overall_rating = EXCLUDED.overall_rating,
        total_ratings_count = EXCLUDED.total_ratings_count,
        updated_at = timezone('utc'::text, now());
        
    -- Also update the main restaurants table rating
    UPDATE restaurants 
    SET rating = (
        SELECT ROUND(AVG(overall_rating::decimal), 1)
        FROM user_restaurant_ratings 
        WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
    ),
    review_count = (
        SELECT COUNT(*)
        FROM user_restaurant_ratings 
        WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
    )
    WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language plpgsql;

-- Create triggers to automatically update restaurant characteristics
CREATE TRIGGER update_restaurant_characteristics_on_rating_change
    AFTER INSERT OR UPDATE OR DELETE ON user_restaurant_ratings
    FOR EACH ROW
    EXECUTE PROCEDURE update_restaurant_characteristics();

-- Function to get restaurant with all characteristics
CREATE OR REPLACE FUNCTION get_restaurant_with_characteristics(restaurant_uuid uuid)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    address text,
    phone text,
    website text,
    cuisine_type text,
    image_url text,
    latitude decimal,
    longitude decimal,
    rating decimal,
    review_count integer,
    price_range integer,
    hours text,
    ambience_rating decimal,
    decor_rating decimal,
    service_rating decimal,
    cleanliness_rating decimal,
    noise_level_rating decimal,
    value_for_money_rating decimal,
    food_quality_rating decimal,
    overall_rating decimal,
    total_ratings_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
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
        r.latitude,
        r.longitude,
        r.rating,
        r.review_count,
        r.price_range,
        r.hours,
        COALESCE(rc.ambience_rating, 0::decimal) as ambience_rating,
        COALESCE(rc.decor_rating, 0::decimal) as decor_rating,
        COALESCE(rc.service_rating, 0::decimal) as service_rating,
        COALESCE(rc.cleanliness_rating, 0::decimal) as cleanliness_rating,
        COALESCE(rc.noise_level_rating, 0::decimal) as noise_level_rating,
        COALESCE(rc.value_for_money_rating, 0::decimal) as value_for_money_rating,
        COALESCE(rc.food_quality_rating, 0::decimal) as food_quality_rating,
        COALESCE(rc.overall_rating, 0::decimal) as overall_rating,
        COALESCE(rc.total_ratings_count, 0) as total_ratings_count,
        r.created_at,
        r.updated_at
    FROM restaurants r
    LEFT JOIN restaurant_characteristics rc ON r.id = rc.restaurant_id
    WHERE r.id = restaurant_uuid;
END;
$$ language plpgsql;

-- Add new columns to restaurants table to store aggregated ratings
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS rating decimal(3,1),
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Sample data for testing
INSERT INTO user_restaurant_ratings (
    user_id, 
    restaurant_id, 
    ambience_rating, 
    decor_rating, 
    service_rating, 
    cleanliness_rating, 
    noise_level_rating, 
    value_for_money_rating, 
    food_quality_rating, 
    overall_rating,
    review_text,
    visit_date,
    would_recommend
) 
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid as user_id,
    r.id as restaurant_id,
    (RANDOM() * 4 + 6)::integer as ambience_rating, -- Random rating between 6-10
    (RANDOM() * 4 + 6)::integer as decor_rating,
    (RANDOM() * 4 + 6)::integer as service_rating,
    (RANDOM() * 4 + 6)::integer as cleanliness_rating,
    (RANDOM() * 4 + 6)::integer as noise_level_rating,
    (RANDOM() * 4 + 6)::integer as value_for_money_rating,
    (RANDOM() * 4 + 6)::integer as food_quality_rating,
    (RANDOM() * 4 + 6)::integer as overall_rating,
    'Great restaurant with excellent food and service!' as review_text,
    CURRENT_DATE - (RANDOM() * 30)::integer as visit_date,
    true as would_recommend
FROM restaurants r
LIMIT 4; -- One rating per restaurant for testing
