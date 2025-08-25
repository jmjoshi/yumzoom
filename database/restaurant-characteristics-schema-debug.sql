-- Restaurant Characteristics Schema - Debug Version
-- Run this step by step to identify issues

-- STEP 1: Enable extensions and create helper function
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 2: Create main tables (run this separately)
/*
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
*/

-- STEP 3: Create user ratings table (run this separately)
/*
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
*/

-- STEP 4: Create supporting tables (run this separately)
/*
CREATE TABLE restaurant_rating_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_restaurant_rating_id uuid REFERENCES user_restaurant_ratings(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    photo_filename text NOT NULL,
    photo_size integer,
    photo_type text,
    upload_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE restaurant_rating_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_restaurant_rating_id uuid REFERENCES user_restaurant_ratings(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_restaurant_rating_id, user_id)
);
*/

-- STEP 5: Create indexes (run this separately)
/*
CREATE INDEX idx_restaurant_characteristics_restaurant_id ON restaurant_characteristics(restaurant_id);
CREATE INDEX idx_user_restaurant_ratings_user_id ON user_restaurant_ratings(user_id);
CREATE INDEX idx_user_restaurant_ratings_restaurant_id ON user_restaurant_ratings(restaurant_id);
CREATE INDEX idx_user_restaurant_ratings_overall_rating ON user_restaurant_ratings(overall_rating);
CREATE INDEX idx_restaurant_rating_photos_rating_id ON restaurant_rating_photos(user_restaurant_rating_id);
CREATE INDEX idx_restaurant_rating_votes_rating_id ON restaurant_rating_votes(user_restaurant_rating_id);
CREATE INDEX idx_restaurant_rating_votes_user_id ON restaurant_rating_votes(user_id);
*/

-- STEP 6: Create triggers (run this separately)
/*
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
*/

-- STEP 7: Enable RLS (run this separately)
/*
ALTER TABLE restaurant_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restaurant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_rating_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_rating_votes ENABLE ROW LEVEL SECURITY;
*/

-- STEP 8: Create RLS policies (run this separately)
/*
CREATE POLICY "Anyone can view restaurant characteristics" ON restaurant_characteristics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view restaurant ratings" ON user_restaurant_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own restaurant ratings" ON user_restaurant_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant ratings" ON user_restaurant_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurant ratings" ON user_restaurant_ratings
    FOR DELETE USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view all rating votes" ON restaurant_rating_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON restaurant_rating_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON restaurant_rating_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON restaurant_rating_votes
    FOR DELETE USING (auth.uid() = user_id);
*/
