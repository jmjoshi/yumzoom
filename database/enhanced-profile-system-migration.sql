-- Enhanced Profile System Migration
-- Implements comprehensive preference tracking, dining pattern analysis, 
-- wishlist management, and gamification features

-- Preference Tracking Table
CREATE TABLE IF NOT EXISTS preference_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    preference_type text NOT NULL CHECK (preference_type IN ('cuisine', 'dietary', 'ambiance', 'price_range', 'occasion', 'ingredient')),
    preference_value text NOT NULL,
    preference_strength integer NOT NULL CHECK (preference_strength >= 1 AND preference_strength <= 10),
    confidence_score decimal(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source text DEFAULT 'manual' CHECK (source IN ('manual', 'learned', 'inferred')),
    last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, family_member_id, preference_type, preference_value)
);

-- Dining Patterns Analysis Table
CREATE TABLE IF NOT EXISTS dining_patterns (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pattern_type text NOT NULL CHECK (pattern_type IN ('frequency', 'timing', 'seasonal', 'social', 'spending')),
    pattern_data jsonb NOT NULL,
    insights text[],
    confidence_level decimal(3,2) DEFAULT 0.5 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    date_range_start date NOT NULL,
    date_range_end date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Wishlists Table
CREATE TABLE IF NOT EXISTS user_wishlists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    is_collaborative boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    wishlist_id uuid REFERENCES user_wishlists(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    added_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    priority_level integer DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
    notes text,
    target_occasion text,
    estimated_visit_date date,
    votes integer DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'visited', 'removed')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(wishlist_id, restaurant_id)
);

-- Achievements System
CREATE TABLE IF NOT EXISTS achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text NOT NULL,
    icon text NOT NULL,
    category text NOT NULL CHECK (category IN ('explorer', 'reviewer', 'social', 'loyalty', 'milestone')),
    points_value integer DEFAULT 0,
    rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    requirements jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    earned_date timestamp with time zone,
    progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_unlocked boolean DEFAULT false,
    is_displayed boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id, family_member_id)
);

-- User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    streak_type text NOT NULL CHECK (streak_type IN ('dining_out', 'reviewing', 'exploring', 'social')),
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    last_activity_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, streak_type)
);

-- Personalization Settings Table
CREATE TABLE IF NOT EXISTS personalization_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    auto_learn_preferences boolean DEFAULT true,
    recommendation_frequency text DEFAULT 'moderate' CHECK (recommendation_frequency IN ('aggressive', 'moderate', 'conservative')),
    exploration_vs_exploitation integer DEFAULT 50 CHECK (exploration_vs_exploitation >= 0 AND exploration_vs_exploitation <= 100),
    dietary_strictness text DEFAULT 'moderate' CHECK (dietary_strictness IN ('strict', 'moderate', 'flexible')),
    social_discovery_enabled boolean DEFAULT true,
    location_based_suggestions boolean DEFAULT true,
    price_sensitivity integer DEFAULT 5 CHECK (price_sensitivity >= 1 AND price_sensitivity <= 10),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Dining Insights Table
CREATE TABLE IF NOT EXISTS dining_insights (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    insight_type text NOT NULL CHECK (insight_type IN ('preference_change', 'new_favorite', 'dining_pattern', 'recommendation', 'milestone')),
    title text NOT NULL,
    description text NOT NULL,
    data jsonb,
    importance_score integer DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
    is_read boolean DEFAULT false,
    expiry_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Preference History Table
CREATE TABLE IF NOT EXISTS user_preference_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    preference_type text NOT NULL,
    old_value text,
    new_value text NOT NULL,
    change_reason text NOT NULL CHECK (change_reason IN ('manual_update', 'learned_behavior', 'rating_feedback', 'explicit_feedback')),
    confidence_change decimal(3,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recommendation Feedback Table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    recommendation_type text NOT NULL CHECK (recommendation_type IN ('cuisine_match', 'social_recommendation', 'pattern_based', 'exploration')),
    feedback_type text NOT NULL CHECK (feedback_type IN ('visited', 'not_interested', 'saved_for_later', 'negative')),
    feedback_details text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preference_tracking_user_id ON preference_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_preference_tracking_family_member_id ON preference_tracking(family_member_id);
CREATE INDEX IF NOT EXISTS idx_preference_tracking_type ON preference_tracking(preference_type);

CREATE INDEX IF NOT EXISTS idx_dining_patterns_user_id ON dining_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_dining_patterns_type ON dining_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_dining_patterns_date_range ON dining_patterns(date_range_start, date_range_end);

CREATE INDEX IF NOT EXISTS idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_restaurant_id ON wishlist_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(user_id, is_unlocked);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_dining_insights_user_id ON dining_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_dining_insights_read ON dining_insights(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_restaurant_id ON recommendation_feedback(restaurant_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_preference_tracking_updated_at
    BEFORE UPDATE ON preference_tracking
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_dining_patterns_updated_at
    BEFORE UPDATE ON dining_patterns
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_wishlists_updated_at
    BEFORE UPDATE ON user_wishlists
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON wishlist_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_personalization_settings_updated_at
    BEFORE UPDATE ON personalization_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for all new tables
ALTER TABLE preference_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preference_tracking
CREATE POLICY "Users can view their own preference tracking" ON preference_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preference tracking" ON preference_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preference tracking" ON preference_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preference tracking" ON preference_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dining_patterns
CREATE POLICY "Users can view their own dining patterns" ON dining_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dining patterns" ON dining_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dining patterns" ON dining_patterns
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_wishlists
CREATE POLICY "Users can view their own wishlists" ON user_wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public wishlists" ON user_wishlists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own wishlists" ON user_wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists" ON user_wishlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists" ON user_wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items
CREATE POLICY "Users can view wishlist items from their wishlists" ON wishlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_wishlists uw 
            WHERE uw.id = wishlist_items.wishlist_id 
            AND uw.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view public wishlist items" ON wishlist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_wishlists uw 
            WHERE uw.id = wishlist_items.wishlist_id 
            AND uw.is_public = true
        )
    );

CREATE POLICY "Users can insert items to their wishlists" ON wishlist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_wishlists uw 
            WHERE uw.id = wishlist_items.wishlist_id 
            AND uw.user_id = auth.uid()
        ) AND auth.uid() = added_by_user_id
    );

CREATE POLICY "Users can update items in their wishlists" ON wishlist_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_wishlists uw 
            WHERE uw.id = wishlist_items.wishlist_id 
            AND uw.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their wishlists" ON wishlist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_wishlists uw 
            WHERE uw.id = wishlist_items.wishlist_id 
            AND uw.user_id = auth.uid()
        )
    );

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements
    FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for personalization_settings
CREATE POLICY "Users can view their own personalization settings" ON personalization_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization settings" ON personalization_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization settings" ON personalization_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for dining_insights
CREATE POLICY "Users can view their own dining insights" ON dining_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dining insights" ON dining_insights
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_preference_history
CREATE POLICY "Users can view their own preference history" ON user_preference_history
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for recommendation_feedback
CREATE POLICY "Users can view their own recommendation feedback" ON recommendation_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation feedback" ON recommendation_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create default personalization settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_personalization_settings()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.personalization_settings (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create personalization settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_personalization ON auth.users;
CREATE TRIGGER on_auth_user_created_personalization
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_personalization_settings();

-- Function to track preference changes
CREATE OR REPLACE FUNCTION track_preference_change()
RETURNS trigger AS $$
BEGIN
    -- Insert into preference history when preferences change
    IF (OLD.preference_strength != NEW.preference_strength OR OLD.preference_value != NEW.preference_value) THEN
        INSERT INTO user_preference_history (
            user_id,
            family_member_id,
            preference_type,
            old_value,
            new_value,
            change_reason,
            confidence_change
        ) VALUES (
            NEW.user_id,
            NEW.family_member_id,
            NEW.preference_type,
            OLD.preference_value,
            NEW.preference_value,
            CASE 
                WHEN OLD.source = 'manual' AND NEW.source = 'manual' THEN 'manual_update'
                WHEN NEW.source = 'learned' THEN 'learned_behavior'
                ELSE 'rating_feedback'
            END,
            NEW.confidence_score - OLD.confidence_score
        );
    END IF;
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger for preference change tracking
CREATE TRIGGER track_preference_changes
    AFTER UPDATE ON preference_tracking
    FOR EACH ROW
    EXECUTE PROCEDURE track_preference_change();

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points_value, rarity, requirements) VALUES
('First Review', 'Write your first restaurant review', '✍️', 'reviewer', 10, 'common', '{"reviews_written": 1}'),
('Cuisine Explorer', 'Try 5 different cuisine types', '🌍', 'explorer', 25, 'uncommon', '{"unique_cuisines": 5}'),
('Social Butterfly', 'Connect with 10 family networks', '🦋', 'social', 20, 'uncommon', '{"family_connections": 10}'),
('Loyal Customer', 'Visit the same restaurant 5 times', '🏆', 'loyalty', 30, 'rare', '{"restaurant_visits": 5, "same_restaurant": true}'),
('Review Master', 'Write 50 detailed reviews', '📝', 'reviewer', 100, 'epic', '{"reviews_written": 50, "min_length": 100}'),
('Adventurous Eater', 'Try 25 different cuisine types', '🗺️', 'explorer', 75, 'rare', '{"unique_cuisines": 25}'),
('Community Leader', 'Have 100 helpful review votes', '👑', 'social', 150, 'epic', '{"helpful_votes": 100}'),
('Dining Streak', 'Dine out for 7 consecutive weeks', '🔥', 'milestone', 50, 'rare', '{"dining_streak": 7, "unit": "weeks"}'),
('Family Favorite', 'Create a family wishlist with 20 restaurants', '❤️', 'milestone', 40, 'uncommon', '{"wishlist_items": 20}'),
('Gourmet Guide', 'Visit 10 fine dining establishments', '🥂', 'explorer', 200, 'legendary', '{"fine_dining_visits": 10}')
ON CONFLICT (name) DO NOTHING;

-- Function to calculate dining insights
CREATE OR REPLACE FUNCTION generate_dining_insights(target_user_id uuid)
RETURNS void AS $$
DECLARE
    user_rating_count integer;
    recent_cuisine_preferences text[];
    dining_frequency_change decimal;
BEGIN
    -- Get user's rating count
    SELECT COUNT(*) INTO user_rating_count 
    FROM ratings 
    WHERE user_id = target_user_id;

    -- Generate milestone insights
    IF user_rating_count IN (1, 5, 10, 25, 50, 100) THEN
        INSERT INTO dining_insights (user_id, insight_type, title, description, importance_score)
        VALUES (
            target_user_id,
            'milestone',
            'Rating Milestone Reached!',
            format('Congratulations! You''ve rated %s restaurants. Keep exploring!', user_rating_count),
            8
        );
    END IF;

    -- Detect preference changes (simplified example)
    SELECT array_agg(DISTINCT preference_value) INTO recent_cuisine_preferences
    FROM preference_tracking pt
    WHERE pt.user_id = target_user_id 
    AND pt.preference_type = 'cuisine'
    AND pt.last_updated > (NOW() - INTERVAL '30 days')
    AND pt.preference_strength >= 7;

    IF array_length(recent_cuisine_preferences, 1) > 3 THEN
        INSERT INTO dining_insights (user_id, insight_type, title, description, importance_score)
        VALUES (
            target_user_id,
            'preference_change',
            'Expanding Your Palate',
            'We''ve noticed you''re exploring new cuisines! Your taste preferences are becoming more diverse.',
            6
        );
    END IF;
END;
$$ language plpgsql security definer;

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(target_user_id uuid, streak_type_param text)
RETURNS void AS $$
DECLARE
    current_streak_count integer;
    last_activity date;
    streak_broken boolean := false;
BEGIN
    -- Get current streak data
    SELECT current_streak, last_activity_date INTO current_streak_count, last_activity
    FROM user_streaks
    WHERE user_id = target_user_id AND streak_type = streak_type_param;

    -- Check if streak should continue or reset
    IF last_activity IS NULL OR last_activity < (CURRENT_DATE - INTERVAL '7 days') THEN
        streak_broken := true;
    END IF;

    -- Update or insert streak
    INSERT INTO user_streaks (user_id, streak_type, current_streak, best_streak, last_activity_date)
    VALUES (
        target_user_id,
        streak_type_param,
        CASE WHEN streak_broken THEN 1 ELSE current_streak_count + 1 END,
        CASE WHEN streak_broken THEN GREATEST(1, current_streak_count) 
             ELSE GREATEST(current_streak_count + 1, COALESCE((SELECT best_streak FROM user_streaks WHERE user_id = target_user_id AND streak_type = streak_type_param), 0))
        END,
        CURRENT_DATE
    )
    ON CONFLICT (user_id, streak_type) 
    DO UPDATE SET 
        current_streak = CASE WHEN streak_broken THEN 1 ELSE user_streaks.current_streak + 1 END,
        best_streak = CASE WHEN streak_broken THEN GREATEST(1, user_streaks.current_streak) 
                          ELSE GREATEST(user_streaks.current_streak + 1, user_streaks.best_streak)
                     END,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW();
END;
$$ language plpgsql security definer;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(target_user_id uuid)
RETURNS void AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    requirement_met boolean;
BEGIN
    -- Get user statistics
    SELECT 
        COUNT(DISTINCT r.id) as reviews_written,
        COUNT(DISTINCT mi.restaurant_id) as restaurants_visited,
        COUNT(DISTINCT restaurants.cuisine_type) as unique_cuisines,
        COUNT(DISTINCT CASE WHEN restaurants.cuisine_type ILIKE '%fine%' OR restaurants.cuisine_type ILIKE '%upscale%' THEN r.id END) as fine_dining_visits
    INTO user_stats
    FROM ratings r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    JOIN restaurants ON mi.restaurant_id = restaurants.id
    WHERE r.user_id = target_user_id;

    -- Check each achievement
    FOR achievement_record IN 
        SELECT * FROM achievements 
        WHERE id NOT IN (
            SELECT achievement_id FROM user_achievements 
            WHERE user_id = target_user_id AND is_unlocked = true
        )
    LOOP
        requirement_met := false;

        -- Simple achievement checking logic (can be expanded)
        CASE 
            WHEN achievement_record.requirements->>'reviews_written' IS NOT NULL THEN
                requirement_met := user_stats.reviews_written >= (achievement_record.requirements->>'reviews_written')::integer;
            
            WHEN achievement_record.requirements->>'unique_cuisines' IS NOT NULL THEN
                requirement_met := user_stats.unique_cuisines >= (achievement_record.requirements->>'unique_cuisines')::integer;
            
            WHEN achievement_record.requirements->>'fine_dining_visits' IS NOT NULL THEN
                requirement_met := user_stats.fine_dining_visits >= (achievement_record.requirements->>'fine_dining_visits')::integer;
            
            ELSE
                requirement_met := false;
        END CASE;

        -- Award achievement if requirement is met
        IF requirement_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, earned_date, progress, is_unlocked)
            VALUES (target_user_id, achievement_record.id, NOW(), 100, true)
            ON CONFLICT (user_id, achievement_id) DO UPDATE SET
                is_unlocked = true,
                earned_date = NOW(),
                progress = 100;

            -- Create insight for new achievement
            INSERT INTO dining_insights (user_id, insight_type, title, description, importance_score)
            VALUES (
                target_user_id,
                'milestone',
                format('Achievement Unlocked: %s', achievement_record.name),
                achievement_record.description,
                9
            );
        END IF;
    END LOOP;
END;
$$ language plpgsql security definer;
