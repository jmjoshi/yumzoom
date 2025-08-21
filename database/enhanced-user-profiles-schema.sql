-- Enhanced User Profiles Schema
-- This file extends the existing schema with enhanced user profile features

-- Add new columns to family_members table for dietary restrictions and preferences
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS age_range text CHECK (age_range IN ('child', 'teen', 'adult')),
ADD COLUMN IF NOT EXISTS dietary_restrictions text[], 
ADD COLUMN IF NOT EXISTS favorite_cuisines text[],
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS allergies text[],
ADD COLUMN IF NOT EXISTS food_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_level text DEFAULT 'family' CHECK (privacy_level IN ('public', 'family', 'private'));

-- User favorites table for restaurants
CREATE TABLE IF NOT EXISTS user_favorites (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    notes text,
    tags text[],
    is_wishlist boolean DEFAULT false,
    priority_level integer DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
    occasion_suitable text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, family_member_id, restaurant_id)
);

-- User favorite menu items table
CREATE TABLE IF NOT EXISTS user_favorite_menu_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
    personal_notes text,
    last_ordered_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, family_member_id, menu_item_id)
);

-- User privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    profile_visibility text DEFAULT 'family' CHECK (profile_visibility IN ('public', 'friends', 'family', 'private')),
    dining_history_visibility text DEFAULT 'family' CHECK (dining_history_visibility IN ('public', 'friends', 'family', 'private')),
    reviews_visibility text DEFAULT 'public' CHECK (reviews_visibility IN ('public', 'friends', 'family', 'private')),
    favorites_visibility text DEFAULT 'family' CHECK (favorites_visibility IN ('public', 'friends', 'family', 'private')),
    allow_friend_requests boolean DEFAULT true,
    show_activity_status boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    family_member_public_visibility boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User dining occasions preferences
CREATE TABLE IF NOT EXISTS user_dining_occasions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    occasion_name text NOT NULL,
    preferred_cuisines text[],
    preferred_price_range text,
    preferred_ambiance text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, occasion_name)
);

-- User dietary restrictions lookup table
CREATE TABLE IF NOT EXISTS dietary_restrictions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    severity_level text DEFAULT 'preference' CHECK (severity_level IN ('preference', 'intolerance', 'allergy', 'medical')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Populate dietary restrictions
INSERT INTO dietary_restrictions (name, description, severity_level) VALUES
('Vegetarian', 'Does not eat meat, poultry, or fish', 'preference'),
('Vegan', 'Does not eat any animal products', 'preference'),
('Gluten-Free', 'Cannot consume gluten due to celiac disease or sensitivity', 'medical'),
('Dairy-Free', 'Cannot or chooses not to consume dairy products', 'intolerance'),
('Nut Allergy', 'Allergic to tree nuts', 'allergy'),
('Peanut Allergy', 'Allergic to peanuts', 'allergy'),
('Shellfish Allergy', 'Allergic to shellfish', 'allergy'),
('Egg Allergy', 'Allergic to eggs', 'allergy'),
('Soy Allergy', 'Allergic to soy products', 'allergy'),
('Lactose Intolerant', 'Cannot digest lactose properly', 'intolerance'),
('Kosher', 'Follows kosher dietary laws', 'preference'),
('Halal', 'Follows halal dietary laws', 'preference'),
('Low Sodium', 'Requires low sodium diet', 'medical'),
('Diabetic Friendly', 'Requires diabetic-friendly options', 'medical'),
('Keto', 'Follows ketogenic diet', 'preference'),
('Paleo', 'Follows paleolithic diet', 'preference'),
('Low Carb', 'Prefers low carbohydrate options', 'preference'),
('Heart Healthy', 'Requires heart-healthy options', 'medical')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_restaurant_id ON user_favorites(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_family_member_id ON user_favorites(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_wishlist ON user_favorites(user_id, is_wishlist);

CREATE INDEX IF NOT EXISTS idx_user_favorite_menu_items_user_id ON user_favorite_menu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_menu_items_menu_item_id ON user_favorite_menu_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_menu_items_family_member_id ON user_favorite_menu_items(family_member_id);

CREATE INDEX IF NOT EXISTS idx_family_members_dietary_restrictions ON family_members USING GIN(dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_family_members_favorite_cuisines ON family_members USING GIN(favorite_cuisines);

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_favorites_updated_at
    BEFORE UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_favorite_menu_items_updated_at
    BEFORE UPDATE ON user_favorite_menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at
    BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_dining_occasions_updated_at
    BEFORE UPDATE ON user_dining_occasions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dining_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" ON user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_favorite_menu_items
CREATE POLICY "Users can view their own favorite menu items" ON user_favorite_menu_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite menu items" ON user_favorite_menu_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite menu items" ON user_favorite_menu_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite menu items" ON user_favorite_menu_items
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_privacy_settings
CREATE POLICY "Users can view their own privacy settings" ON user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user_dining_occasions
CREATE POLICY "Users can view their own dining occasions" ON user_dining_occasions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dining occasions" ON user_dining_occasions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dining occasions" ON user_dining_occasions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dining occasions" ON user_dining_occasions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for dietary_restrictions (public read)
CREATE POLICY "Anyone can view dietary restrictions" ON dietary_restrictions
    FOR SELECT USING (true);

-- Function to create default privacy settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy_settings()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create privacy settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;
CREATE TRIGGER on_auth_user_created_privacy
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_privacy_settings();

-- Function to get user profile with privacy settings
CREATE OR REPLACE FUNCTION get_user_profile_with_privacy(profile_user_id uuid)
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    phone_mobile text,
    phone_home text,
    phone_work text,
    avatar_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    profile_visibility text,
    dining_history_visibility text,
    reviews_visibility text,
    favorites_visibility text,
    allow_friend_requests boolean,
    show_activity_status boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.first_name,
        up.last_name,
        up.phone_mobile,
        up.phone_home,
        up.phone_work,
        up.avatar_url,
        up.created_at,
        up.updated_at,
        ups.profile_visibility,
        ups.dining_history_visibility,
        ups.reviews_visibility,
        ups.favorites_visibility,
        ups.allow_friend_requests,
        ups.show_activity_status
    FROM user_profiles up
    LEFT JOIN user_privacy_settings ups ON up.id = ups.user_id
    WHERE up.id = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get family member with dietary info
CREATE OR REPLACE FUNCTION get_family_member_with_dietary_info(member_user_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    name text,
    relationship text,
    age_range text,
    dietary_restrictions text[],
    favorite_cuisines text[],
    notes text,
    avatar_url text,
    date_of_birth date,
    allergies text[],
    food_preferences jsonb,
    privacy_level text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fm.id,
        fm.user_id,
        fm.name,
        fm.relationship,
        fm.age_range,
        fm.dietary_restrictions,
        fm.favorite_cuisines,
        fm.notes,
        fm.avatar_url,
        fm.date_of_birth,
        fm.allergies,
        fm.food_preferences,
        fm.privacy_level,
        fm.created_at,
        fm.updated_at
    FROM family_members fm
    WHERE fm.user_id = member_user_id
    ORDER BY fm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
