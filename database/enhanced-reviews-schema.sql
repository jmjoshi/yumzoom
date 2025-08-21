-- Enhanced Review System - Phase 1 Database Schema Updates
-- Add these to your existing schema or run separately in Supabase

-- First, update the existing ratings table to support written reviews
-- Add review text column to existing ratings table
ALTER TABLE ratings 
ADD COLUMN review_text text CHECK (char_length(review_text) <= 500),
ADD COLUMN is_edited boolean DEFAULT false,
ADD COLUMN edited_at timestamp with time zone;

-- Create review photos table
CREATE TABLE review_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    photo_filename text NOT NULL,
    photo_size integer,
    upload_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create review helpfulness votes table
CREATE TABLE review_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(rating_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_review_photos_rating_id ON review_photos(rating_id);
CREATE INDEX idx_review_photos_upload_order ON review_photos(rating_id, upload_order);
CREATE INDEX idx_review_votes_rating_id ON review_votes(rating_id);
CREATE INDEX idx_review_votes_user_id ON review_votes(user_id);
CREATE INDEX idx_ratings_review_text ON ratings(review_text) WHERE review_text IS NOT NULL;

-- Add updated_at trigger for review_votes
CREATE TRIGGER update_review_votes_updated_at
    BEFORE UPDATE ON review_votes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security for review photos
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review photos" ON review_photos
    FOR SELECT USING (true);

CREATE POLICY "Users can insert photos for their own ratings" ON review_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ratings 
            WHERE ratings.id = rating_id 
            AND ratings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete photos for their own ratings" ON review_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ratings 
            WHERE ratings.id = rating_id 
            AND ratings.user_id = auth.uid()
        )
    );

-- Row Level Security for review votes
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes" ON review_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON review_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON review_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON review_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for ratings with helpful vote counts
CREATE OR REPLACE VIEW ratings_with_votes AS
SELECT 
    r.*,
    COALESCE(helpful_votes.helpful_count, 0) as helpful_count,
    COALESCE(not_helpful_votes.not_helpful_count, 0) as not_helpful_count,
    COALESCE(helpful_votes.helpful_count, 0) - COALESCE(not_helpful_votes.not_helpful_count, 0) as net_helpfulness
FROM ratings r
LEFT JOIN (
    SELECT rating_id, COUNT(*) as helpful_count
    FROM review_votes 
    WHERE is_helpful = true 
    GROUP BY rating_id
) helpful_votes ON r.id = helpful_votes.rating_id
LEFT JOIN (
    SELECT rating_id, COUNT(*) as not_helpful_count
    FROM review_votes 
    WHERE is_helpful = false 
    GROUP BY rating_id
) not_helpful_votes ON r.id = not_helpful_votes.rating_id;

-- Function to get review statistics for a restaurant
CREATE OR REPLACE FUNCTION get_restaurant_review_stats(restaurant_uuid uuid)
RETURNS TABLE (
    total_reviews bigint,
    average_rating numeric,
    reviews_with_photos bigint,
    reviews_with_text bigint,
    rating_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(r.id) as total_reviews,
        ROUND(AVG(r.rating), 2) as average_rating,
        COUNT(rp.rating_id) as reviews_with_photos,
        COUNT(CASE WHEN r.review_text IS NOT NULL AND trim(r.review_text) != '' THEN 1 END) as reviews_with_text,
        jsonb_object_agg(
            r.rating::text, 
            COUNT(r.rating)
        ) as rating_distribution
    FROM ratings r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    LEFT JOIN review_photos rp ON r.id = rp.rating_id
    WHERE mi.restaurant_id = restaurant_uuid
    GROUP BY mi.restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get review statistics for a menu item
CREATE OR REPLACE FUNCTION get_menu_item_review_stats(menu_item_uuid uuid)
RETURNS TABLE (
    total_reviews bigint,
    average_rating numeric,
    reviews_with_photos bigint,
    reviews_with_text bigint,
    rating_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(r.id) as total_reviews,
        ROUND(AVG(r.rating), 2) as average_rating,
        COUNT(DISTINCT rp.rating_id) as reviews_with_photos,
        COUNT(CASE WHEN r.review_text IS NOT NULL AND trim(r.review_text) != '' THEN 1 END) as reviews_with_text,
        jsonb_object_agg(
            r.rating::text, 
            COUNT(r.rating)
        ) as rating_distribution
    FROM ratings r
    LEFT JOIN review_photos rp ON r.id = rp.rating_id
    WHERE r.menu_item_id = menu_item_uuid
    GROUP BY r.menu_item_id;
END;
$$ LANGUAGE plpgsql;

-- Add some sample review data for testing
-- Note: You'll need actual user IDs and rating IDs from your database
-- This is just an example structure

-- Example: Add some sample review text to existing ratings
-- UPDATE ratings SET review_text = 'Amazing dish! The flavors were perfectly balanced and the presentation was beautiful. Our whole family loved it!' WHERE id = '[RATING_ID_HERE]';
-- UPDATE ratings SET review_text = 'Good food but service was a bit slow. The taste was great though and we would come back.' WHERE id = '[ANOTHER_RATING_ID_HERE]';

COMMENT ON TABLE review_photos IS 'Stores photos uploaded with reviews, up to 3 per review';
COMMENT ON TABLE review_votes IS 'Tracks helpfulness votes on reviews from other users';
COMMENT ON COLUMN ratings.review_text IS 'Written review text, maximum 500 characters';
COMMENT ON COLUMN ratings.is_edited IS 'Flag to indicate if the review has been edited';
COMMENT ON COLUMN ratings.edited_at IS 'Timestamp of when the review was last edited';
-- Execute the contents of database/enhanced-reviews-schema.sql in Supabase