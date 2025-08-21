-- Restaurant Owner Response System Database Schema
-- Add these to your existing schema or run separately in Supabase

-- Create restaurant owners table for verification
CREATE TABLE restaurant_owners (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    business_name text NOT NULL,
    business_email text NOT NULL,
    business_phone text,
    verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents jsonb, -- Store document URLs and metadata
    verified_at timestamp with time zone,
    verified_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

-- Create review responses table
CREATE TABLE review_responses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    restaurant_owner_id uuid REFERENCES restaurant_owners(id) ON DELETE CASCADE NOT NULL,
    response_text text NOT NULL CHECK (char_length(response_text) <= 1000),
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(rating_id) -- Only one response per review
);

-- Create notifications table for owner responses
CREATE TABLE response_notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    response_id uuid REFERENCES review_responses(id) ON DELETE CASCADE NOT NULL,
    notification_type text DEFAULT 'owner_response' CHECK (notification_type IN ('owner_response')),
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_restaurant_owners_user_id ON restaurant_owners(user_id);
CREATE INDEX idx_restaurant_owners_restaurant_id ON restaurant_owners(restaurant_id);
CREATE INDEX idx_restaurant_owners_verification_status ON restaurant_owners(verification_status);
CREATE INDEX idx_review_responses_rating_id ON review_responses(rating_id);
CREATE INDEX idx_review_responses_restaurant_owner_id ON review_responses(restaurant_owner_id);
CREATE INDEX idx_response_notifications_user_id ON response_notifications(user_id);
CREATE INDEX idx_response_notifications_is_read ON response_notifications(user_id, is_read);

-- Add updated_at triggers
CREATE TRIGGER update_restaurant_owners_updated_at
    BEFORE UPDATE ON restaurant_owners
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at
    BEFORE UPDATE ON review_responses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security
ALTER TABLE restaurant_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_notifications ENABLE ROW LEVEL SECURITY;

-- Restaurant owners policies
CREATE POLICY "Users can view their own restaurant ownership" ON restaurant_owners
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own restaurant ownership requests" ON restaurant_owners
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant ownership" ON restaurant_owners
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all restaurant owners" ON restaurant_owners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.first_name || ' ' || user_profiles.last_name) = 'Admin User'
        )
    );

CREATE POLICY "Admins can update verification status" ON restaurant_owners
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.first_name || ' ' || user_profiles.last_name) = 'Admin User'
        )
    );

-- Review responses policies
CREATE POLICY "Anyone can view review responses" ON review_responses
    FOR SELECT USING (true);

CREATE POLICY "Verified restaurant owners can insert responses for their restaurants" ON review_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            JOIN ratings r ON EXISTS (
                SELECT 1 FROM menu_items mi 
                WHERE mi.id = r.menu_item_id 
                AND mi.restaurant_id = ro.restaurant_id
            )
            WHERE ro.id = restaurant_owner_id 
            AND ro.user_id = auth.uid()
            AND ro.verification_status = 'verified'
            AND r.id = rating_id
        )
    );

CREATE POLICY "Restaurant owners can update their own responses" ON review_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.id = restaurant_owner_id 
            AND ro.user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can delete their own responses" ON review_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.id = restaurant_owner_id 
            AND ro.user_id = auth.uid()
        )
    );

-- Response notifications policies
CREATE POLICY "Users can view their own notifications" ON response_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON response_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for ratings with responses
CREATE OR REPLACE VIEW ratings_with_responses AS
SELECT 
    r.*,
    rr.id as response_id,
    rr.response_text,
    rr.is_edited as response_is_edited,
    rr.edited_at as response_edited_at,
    rr.created_at as response_created_at,
    ro.business_name as restaurant_business_name,
    ro.verification_status
FROM ratings r
LEFT JOIN review_responses rr ON r.id = rr.rating_id
LEFT JOIN restaurant_owners ro ON rr.restaurant_owner_id = ro.id;

-- Function to create notification when owner responds to review
CREATE OR REPLACE FUNCTION create_response_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO response_notifications (user_id, rating_id, response_id)
    SELECT r.user_id, NEW.rating_id, NEW.id
    FROM ratings r
    WHERE r.id = NEW.rating_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create notification when response is added
CREATE TRIGGER on_review_response_created
    AFTER INSERT ON review_responses
    FOR EACH ROW
    EXECUTE PROCEDURE create_response_notification();

-- Function to get restaurant owner status for a user
CREATE OR REPLACE FUNCTION get_user_restaurant_owner_status(user_uuid uuid)
RETURNS TABLE (
    restaurant_id uuid,
    restaurant_name text,
    business_name text,
    verification_status text,
    verified_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ro.restaurant_id,
        r.name as restaurant_name,
        ro.business_name,
        ro.verification_status,
        ro.verified_at
    FROM restaurant_owners ro
    JOIN restaurants r ON ro.restaurant_id = r.id
    WHERE ro.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get review statistics for restaurant owner dashboard
CREATE OR REPLACE FUNCTION get_owner_review_dashboard(owner_user_id uuid)
RETURNS TABLE (
    restaurant_id uuid,
    restaurant_name text,
    total_reviews bigint,
    average_rating numeric,
    reviews_with_responses bigint,
    pending_responses bigint,
    recent_reviews jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ro.restaurant_id,
        r.name as restaurant_name,
        COUNT(rt.id) as total_reviews,
        ROUND(AVG(rt.rating), 2) as average_rating,
        COUNT(rr.id) as reviews_with_responses,
        COUNT(rt.id) - COUNT(rr.id) as pending_responses,
        jsonb_agg(
            jsonb_build_object(
                'id', rt.id,
                'rating', rt.rating,
                'review_text', rt.review_text,
                'created_at', rt.created_at,
                'user_name', up.first_name || ' ' || up.last_name,
                'has_response', CASE WHEN rr.id IS NOT NULL THEN true ELSE false END
            ) ORDER BY rt.created_at DESC
        ) FILTER (WHERE rt.id IS NOT NULL) as recent_reviews
    FROM restaurant_owners ro
    JOIN restaurants r ON ro.restaurant_id = r.id
    LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
    LEFT JOIN ratings rt ON mi.id = rt.menu_item_id
    LEFT JOIN review_responses rr ON rt.id = rr.rating_id
    LEFT JOIN user_profiles up ON rt.user_id = up.id
    WHERE ro.user_id = owner_user_id
    AND ro.verification_status = 'verified'
    GROUP BY ro.restaurant_id, r.name;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (you can modify restaurant IDs as needed)
-- INSERT INTO restaurant_owners (user_id, restaurant_id, business_name, business_email, business_phone, verification_status, verified_at)
-- VALUES (
--     '[USER_ID_HERE]',
--     '[RESTAURANT_ID_HERE]',
--     'The Gourmet Bistro LLC',
--     'owner@gourmetbistro.com',
--     '(555) 123-4567',
--     'verified',
--     timezone('utc'::text, now())
-- );

COMMENT ON TABLE restaurant_owners IS 'Stores restaurant owner verification information';
COMMENT ON TABLE review_responses IS 'Stores restaurant owner responses to customer reviews';
COMMENT ON TABLE response_notifications IS 'Stores notifications for users when restaurant owners respond to their reviews';
COMMENT ON COLUMN restaurant_owners.verification_status IS 'Status of owner verification: pending, verified, or rejected';
COMMENT ON COLUMN restaurant_owners.verification_documents IS 'JSON array of document URLs and metadata for verification';
COMMENT ON COLUMN review_responses.response_text IS 'Restaurant owner response text, maximum 1000 characters';
