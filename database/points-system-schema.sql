-- Points System Schema
-- Automatic point awarding for user activities

-- User points table
CREATE TABLE IF NOT EXISTS user_points (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points integer NOT NULL CHECK (points > 0),
    reason text NOT NULL,
    activity_type text NOT NULL CHECK (activity_type IN ('review', 'rating', 'restaurant_visit', 'challenge_completion', 'goal_completion', 'streak_milestone', 'social_engagement', 'first_time_bonus')),
    reference_id uuid, -- ID of the related activity (review_id, challenge_id, etc.)
    awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id uuid NOT NULL, -- Reference to achievement definition
    is_unlocked boolean DEFAULT false,
    unlocked_at timestamp with time zone,
    earned_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    points_value integer DEFAULT 0,
    badge_name text,
    badge_description text,
    badge_icon text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('exploration', 'social', 'quality', 'loyalty', 'milestone')),
    points_value integer NOT NULL DEFAULT 0,
    requirements jsonb NOT NULL,
    badge_icon text,
    badge_color text DEFAULT '#6B7280',
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User streaks table (for tracking consecutive activities)
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

-- Achievement notifications table
CREATE TABLE IF NOT EXISTS achievement_notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id uuid REFERENCES user_achievements(id) ON DELETE CASCADE,
    notification_type text NOT NULL CHECK (notification_type IN ('achievement_unlocked', 'milestone_reached', 'points_earned', 'streak_milestone')),
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_activity_type ON user_points(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_points_awarded_at ON user_points(awarded_at);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_date ON user_achievements(earned_date);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);

CREATE INDEX IF NOT EXISTS idx_achievement_notifications_user_id ON achievement_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_read ON achievement_notifications(is_read);

-- Row Level Security
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active achievements" ON achievements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievement notifications" ON achievement_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement notifications" ON achievement_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to award points for activities
CREATE OR REPLACE FUNCTION award_points(
    target_user_id uuid,
    points_amount integer,
    reason_text text,
    activity_type_param text,
    reference_id_param uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    point_record_id uuid;
BEGIN
    -- Insert points record
    INSERT INTO user_points (
        user_id,
        points,
        reason,
        activity_type,
        reference_id
    ) VALUES (
        target_user_id,
        points_amount,
        reason_text,
        activity_type_param,
        reference_id_param
    ) RETURNING id INTO point_record_id;

    -- Create notification
    INSERT INTO achievement_notifications (
        user_id,
        notification_type,
        title,
        message
    ) VALUES (
        target_user_id,
        'points_earned',
        'Points Earned!',
        format('You earned %s points for: %s', points_amount, reason_text)
    );

    RETURN point_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(target_user_id uuid)
RETURNS void AS $$
DECLARE
    achievement_record RECORD;
    user_stats RECORD;
    requirements_met boolean;
    achievement_unlocked_id uuid;
BEGIN
    -- Get user statistics
    SELECT
        COUNT(DISTINCT r.id) as total_reviews,
        COUNT(DISTINCT mi.restaurant_id) as unique_restaurants,
        COUNT(DISTINCT restaurants.cuisine_type) as unique_cuisines,
        AVG(r.rating) as avg_rating,
        COUNT(DISTINCT DATE(r.created_at)) as active_days,
        MAX(r.created_at) as last_review_date
    INTO user_stats
    FROM ratings r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    JOIN restaurants ON mi.restaurant_id = restaurants.id
    WHERE r.user_id = target_user_id;

    -- Check each achievement
    FOR achievement_record IN
        SELECT * FROM achievements WHERE is_active = true
    LOOP
        requirements_met := true;

        -- Check if achievement is already unlocked
        IF EXISTS (
            SELECT 1 FROM user_achievements
            WHERE user_id = target_user_id
            AND achievement_id = achievement_record.id
            AND is_unlocked = true
        ) THEN
            CONTINUE;
        END IF;

        -- Evaluate requirements based on achievement type
        CASE achievement_record.category
            WHEN 'exploration' THEN
                IF achievement_record.requirements->>'unique_restaurants' IS NOT NULL THEN
                    requirements_met := requirements_met AND
                        (user_stats.unique_restaurants >= (achievement_record.requirements->>'unique_restaurants')::integer);
                END IF;
                IF achievement_record.requirements->>'unique_cuisines' IS NOT NULL THEN
                    requirements_met := requirements_met AND
                        (user_stats.unique_cuisines >= (achievement_record.requirements->>'unique_cuisines')::integer);
                END IF;

            WHEN 'social' THEN
                IF achievement_record.requirements->>'total_reviews' IS NOT NULL THEN
                    requirements_met := requirements_met AND
                        (user_stats.total_reviews >= (achievement_record.requirements->>'total_reviews')::integer);
                END IF;

            WHEN 'quality' THEN
                IF achievement_record.requirements->>'avg_rating' IS NOT NULL THEN
                    requirements_met := requirements_met AND
                        (user_stats.avg_rating >= (achievement_record.requirements->>'avg_rating')::numeric);
                END IF;

            WHEN 'loyalty' THEN
                IF achievement_record.requirements->>'active_days' IS NOT NULL THEN
                    requirements_met := requirements_met AND
                        (user_stats.active_days >= (achievement_record.requirements->>'active_days')::integer);
                END IF;

            WHEN 'milestone' THEN
                -- Custom milestone logic can be added here
                requirements_met := true;
        END CASE;

        -- Unlock achievement if requirements are met
        IF requirements_met THEN
            -- Insert or update user achievement
            INSERT INTO user_achievements (
                user_id,
                achievement_id,
                is_unlocked,
                unlocked_at,
                points_value,
                badge_name,
                badge_description,
                badge_icon
            ) VALUES (
                target_user_id,
                achievement_record.id,
                true,
                NOW(),
                achievement_record.points_value,
                achievement_record.name,
                achievement_record.description,
                achievement_record.badge_icon
            )
            ON CONFLICT (user_id, achievement_id)
            DO UPDATE SET
                is_unlocked = true,
                unlocked_at = NOW(),
                points_value = achievement_record.points_value,
                badge_name = achievement_record.name,
                badge_description = achievement_record.description,
                badge_icon = achievement_record.badge_icon,
                updated_at = NOW()
            RETURNING id INTO achievement_unlocked_id;

            -- Award points for achievement
            IF achievement_record.points_value > 0 THEN
                PERFORM award_points(
                    target_user_id,
                    achievement_record.points_value,
                    format('Achievement unlocked: %s', achievement_record.name),
                    'achievement_unlocked',
                    achievement_record.id
                );
            END IF;

            -- Create achievement notification
            INSERT INTO achievement_notifications (
                user_id,
                achievement_id,
                notification_type,
                title,
                message
            ) VALUES (
                target_user_id,
                achievement_unlocked_id,
                'achievement_unlocked',
                format('🏆 %s Unlocked!', achievement_record.name),
                achievement_record.description
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(
    target_user_id uuid,
    streak_type_param text,
    activity_date date DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
    streak_record user_streaks%ROWTYPE;
    days_since_last_activity integer;
    is_consecutive boolean;
BEGIN
    -- Get or create streak record
    SELECT * INTO streak_record
    FROM user_streaks
    WHERE user_id = target_user_id AND streak_type = streak_type_param;

    IF NOT FOUND THEN
        -- Create new streak
        INSERT INTO user_streaks (user_id, streak_type, current_streak, best_streak, last_activity_date)
        VALUES (target_user_id, streak_type_param, 1, 1, activity_date);
        RETURN;
    END IF;

    -- Calculate if activity is consecutive
    days_since_last_activity := activity_date - streak_record.last_activity_date;

    IF days_since_last_activity = 1 THEN
        -- Consecutive day
        streak_record.current_streak := streak_record.current_streak + 1;
        is_consecutive := true;
    ELSIF days_since_last_activity = 0 THEN
        -- Same day, no change
        RETURN;
    ELSE
        -- Streak broken
        streak_record.current_streak := 1;
        is_consecutive := false;
    END IF;

    -- Update best streak if current is higher
    IF streak_record.current_streak > streak_record.best_streak THEN
        streak_record.best_streak := streak_record.current_streak;
    END IF;

    -- Update streak record
    UPDATE user_streaks
    SET
        current_streak = streak_record.current_streak,
        best_streak = streak_record.best_streak,
        last_activity_date = activity_date,
        updated_at = NOW()
    WHERE user_id = target_user_id AND streak_type = streak_type_param;

    -- Check for streak milestones
    IF is_consecutive THEN
        PERFORM check_streak_milestones(target_user_id, streak_type_param, streak_record.current_streak);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check streak milestones
CREATE OR REPLACE FUNCTION check_streak_milestones(
    target_user_id uuid,
    streak_type_param text,
    current_streak integer
)
RETURNS void AS $$
DECLARE
    milestone_record streak_milestones%ROWTYPE;
BEGIN
    -- Find applicable milestones
    FOR milestone_record IN
        SELECT * FROM streak_milestones
        WHERE streak_type = streak_type_param
        AND milestone_days = current_streak
    LOOP
        -- Award milestone rewards
        INSERT INTO user_rewards (
            user_id,
            reward_type,
            reward_source,
            source_id,
            title,
            description,
            value_data
        ) VALUES (
            target_user_id,
            'badge',
            'streak_milestone',
            milestone_record.id,
            milestone_record.name,
            milestone_record.description,
            milestone_record.rewards
        );

        -- Create notification
        INSERT INTO achievement_notifications (
            user_id,
            notification_type,
            title,
            message
        ) VALUES (
            target_user_id,
            'streak_milestone',
            format('🔥 %s', milestone_record.name),
            milestone_record.description
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically award points for reviews
CREATE OR REPLACE FUNCTION trigger_review_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award points for new review
    PERFORM award_points(
        NEW.user_id,
        10,
        'Review submitted',
        'review',
        NEW.id
    );

    -- Update streaks
    PERFORM update_user_streak(NEW.user_id, 'reviewing', CURRENT_DATE);
    PERFORM update_user_streak(NEW.user_id, 'dining_out', CURRENT_DATE);

    -- Check for achievements
    PERFORM check_and_unlock_achievements(NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review points
DROP TRIGGER IF EXISTS review_points_trigger ON ratings;
CREATE TRIGGER review_points_trigger
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_review_points();

-- Insert default achievements
INSERT INTO achievements (name, description, category, points_value, requirements, badge_icon, sort_order) VALUES
('First Review', 'Submit your first restaurant review', 'social', 25, '{"total_reviews": 1}', '✍️', 1),
('Review Master', 'Submit 10 restaurant reviews', 'social', 100, '{"total_reviews": 10}', '📝', 2),
('Explorer', 'Visit 5 different restaurants', 'exploration', 75, '{"unique_restaurants": 5}', '🗺️', 3),
('Cuisine Hunter', 'Try 3 different cuisines', 'exploration', 50, '{"unique_cuisines": 3}', '🍽️', 4),
('Quality Critic', 'Maintain an average rating above 4.0', 'quality', 150, '{"avg_rating": 4.0}', '⭐', 5),
('Loyal Customer', 'Be active for 30 days', 'loyalty', 200, '{"active_days": 30}', '❤️', 6),
('Century Club', 'Earn 100 points', 'milestone', 0, '{"total_points": 100}', '💯', 7)
ON CONFLICT (name) DO NOTHING;

-- Function to get user total points
CREATE OR REPLACE FUNCTION get_user_total_points(target_user_id uuid)
RETURNS integer AS $$
DECLARE
    total_points integer;
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM user_points
    WHERE user_id = target_user_id;

    RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user achievement stats
CREATE OR REPLACE FUNCTION get_user_achievement_stats(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
    total_achievements integer;
    unlocked_achievements integer;
    total_points integer;
BEGIN
    SELECT COUNT(*) INTO total_achievements FROM achievements WHERE is_active = true;
    SELECT COUNT(*) INTO unlocked_achievements
    FROM user_achievements
    WHERE user_id = target_user_id AND is_unlocked = true;

    SELECT get_user_total_points(target_user_id) INTO total_points;

    stats := jsonb_build_object(
        'total_achievements', total_achievements,
        'unlocked_achievements', unlocked_achievements,
        'completion_percentage', CASE WHEN total_achievements > 0
            THEN ROUND((unlocked_achievements::numeric / total_achievements::numeric) * 100, 1)
            ELSE 0 END,
        'total_points', total_points
    );

    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
