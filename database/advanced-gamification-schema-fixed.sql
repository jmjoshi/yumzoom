-- Advanced Gamification System Schema (Fixed for existing family structure)
-- Implements dining challenges, goals, family leaderboards, and enhanced badge systems

-- First, create a families table to support the gamification features
CREATE TABLE IF NOT EXISTS families (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add family_id to existing family_members table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_members' 
        AND column_name = 'family_id'
    ) THEN
        ALTER TABLE family_members ADD COLUMN family_id uuid REFERENCES families(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create default families for existing users with family members
INSERT INTO families (name, created_by)
SELECT 
    COALESCE(u.user_metadata->>'first_name', 'User') || '''s Family' as name,
    fm.user_id as created_by
FROM family_members fm
JOIN auth.users u ON fm.user_id = u.id
GROUP BY fm.user_id, u.user_metadata->>'first_name'
ON CONFLICT DO NOTHING;

-- Update family_members to link to families
UPDATE family_members 
SET family_id = f.id
FROM families f
WHERE family_members.user_id = f.created_by
AND family_members.family_id IS NULL;

-- Dining Challenges Table
CREATE TABLE IF NOT EXISTS dining_challenges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    challenge_type text NOT NULL CHECK (challenge_type IN ('personal', 'family', 'community', 'seasonal')),
    category text NOT NULL CHECK (category IN ('exploration', 'frequency', 'social', 'variety', 'quality')),
    difficulty_level text NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    duration_days integer NOT NULL CHECK (duration_days > 0),
    requirements jsonb NOT NULL,
    rewards jsonb NOT NULL,
    icon text NOT NULL,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    max_participants integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Challenge Participation Table
CREATE TABLE IF NOT EXISTS user_challenge_participation (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_id uuid REFERENCES families(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES dining_challenges(id) ON DELETE CASCADE NOT NULL,
    start_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date timestamp with time zone,
    progress jsonb DEFAULT '{}',
    completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    rewards_claimed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, challenge_id)
);

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    goal_type text NOT NULL CHECK (goal_type IN ('dining_frequency', 'cuisine_exploration', 'review_writing', 'social_engagement', 'budget_management', 'health_conscious')),
    title text NOT NULL,
    description text NOT NULL,
    target_value integer NOT NULL CHECK (target_value > 0),
    current_value integer DEFAULT 0,
    target_date date NOT NULL,
    priority_level integer DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    reminder_frequency text DEFAULT 'weekly' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly', 'none')),
    is_public boolean DEFAULT false,
    rewards jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Family Leaderboards Table
CREATE TABLE IF NOT EXISTS family_leaderboards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    leaderboard_type text NOT NULL CHECK (leaderboard_type IN ('monthly_reviews', 'cuisine_exploration', 'achievement_points', 'dining_frequency', 'social_engagement')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    rankings jsonb NOT NULL,
    total_participants integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_id, leaderboard_type, period_start, period_end)
);

-- Global Leaderboards Table
CREATE TABLE IF NOT EXISTS global_leaderboards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    leaderboard_type text NOT NULL CHECK (leaderboard_type IN ('top_reviewers', 'cuisine_explorers', 'achievement_hunters', 'social_connectors', 'challenge_champions')),
    period_type text NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly', 'all_time')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    rankings jsonb NOT NULL,
    total_participants integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(leaderboard_type, period_type, period_start, period_end)
);

-- Enhanced Achievement Categories Table
CREATE TABLE IF NOT EXISTS achievement_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text NOT NULL,
    icon text NOT NULL,
    color text DEFAULT '#6B7280',
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievement Milestones Table (for progressive achievements)
CREATE TABLE IF NOT EXISTS achievement_milestones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    milestone_level integer NOT NULL CHECK (milestone_level > 0),
    name text NOT NULL,
    description text NOT NULL,
    requirements jsonb NOT NULL,
    points_bonus integer DEFAULT 0,
    badge_icon text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(achievement_id, milestone_level)
);

-- User Milestone Progress Table
CREATE TABLE IF NOT EXISTS user_milestone_progress (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    milestone_id uuid REFERENCES achievement_milestones(id) ON DELETE CASCADE NOT NULL,
    progress_value integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, milestone_id)
);

-- Streak Milestones Table
CREATE TABLE IF NOT EXISTS streak_milestones (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    streak_type text NOT NULL,
    milestone_days integer NOT NULL CHECK (milestone_days > 0),
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    rewards jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(streak_type, milestone_days)
);

-- User Rewards Table
CREATE TABLE IF NOT EXISTS user_rewards (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_type text NOT NULL CHECK (reward_type IN ('points', 'badge', 'discount', 'feature_unlock', 'special_recognition')),
    reward_source text NOT NULL CHECK (reward_source IN ('achievement', 'challenge', 'goal', 'streak', 'leaderboard')),
    source_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    value_data jsonb DEFAULT '{}',
    is_claimed boolean DEFAULT false,
    claimed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gamification Settings Table
CREATE TABLE IF NOT EXISTS gamification_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    challenges_enabled boolean DEFAULT true,
    leaderboards_enabled boolean DEFAULT true,
    notifications_enabled boolean DEFAULT true,
    public_progress boolean DEFAULT true,
    achievement_notifications boolean DEFAULT true,
    challenge_reminders boolean DEFAULT true,
    goal_reminders boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);

CREATE INDEX IF NOT EXISTS idx_dining_challenges_type ON dining_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_dining_challenges_category ON dining_challenges(category);
CREATE INDEX IF NOT EXISTS idx_dining_challenges_active ON dining_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_dining_challenges_dates ON dining_challenges(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_user_challenge_participation_user_id ON user_challenge_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_participation_family_id ON user_challenge_participation(family_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_participation_challenge_id ON user_challenge_participation(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_participation_status ON user_challenge_participation(is_completed);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_family_member_id ON user_goals(family_member_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON user_goals(target_date);

CREATE INDEX IF NOT EXISTS idx_family_leaderboards_family_id ON family_leaderboards(family_id);
CREATE INDEX IF NOT EXISTS idx_family_leaderboards_type ON family_leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_family_leaderboards_period ON family_leaderboards(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_global_leaderboards_type ON global_leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_global_leaderboards_period_type ON global_leaderboards(period_type);
CREATE INDEX IF NOT EXISTS idx_global_leaderboards_period ON global_leaderboards(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_achievement_milestones_achievement_id ON achievement_milestones(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_user_id ON user_milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_milestone_id ON user_milestone_progress(milestone_id);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_type ON user_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON user_rewards(is_claimed);
CREATE INDEX IF NOT EXISTS idx_user_rewards_expires ON user_rewards(expires_at);

-- Enable RLS for all new tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families
CREATE POLICY "Users can view families they belong to" ON families
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.family_id = families.id 
            AND fm.user_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Users can create their own families" ON families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family creators can update their families" ON families
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for dining_challenges (public read for active challenges)
CREATE POLICY "Anyone can view active challenges" ON dining_challenges
    FOR SELECT USING (is_active = true);

-- RLS Policies for user_challenge_participation
CREATE POLICY "Users can view their own challenge participation" ON user_challenge_participation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge participation" ON user_challenge_participation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge participation" ON user_challenge_participation
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public goals" ON user_goals
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own goals" ON user_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for family_leaderboards
CREATE POLICY "Family members can view their family leaderboards" ON family_leaderboards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.family_id = family_leaderboards.family_id 
            AND fm.user_id = auth.uid()
        )
    );

-- RLS Policies for global_leaderboards (public read)
CREATE POLICY "Anyone can view global leaderboards" ON global_leaderboards
    FOR SELECT USING (true);

-- RLS Policies for achievement_categories (public read)
CREATE POLICY "Anyone can view achievement categories" ON achievement_categories
    FOR SELECT USING (is_active = true);

-- RLS Policies for achievement_milestones (public read)
CREATE POLICY "Anyone can view achievement milestones" ON achievement_milestones
    FOR SELECT USING (true);

-- RLS Policies for user_milestone_progress
CREATE POLICY "Users can view their own milestone progress" ON user_milestone_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestone progress" ON user_milestone_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestone progress" ON user_milestone_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for streak_milestones (public read)
CREATE POLICY "Anyone can view streak milestones" ON streak_milestones
    FOR SELECT USING (true);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON user_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards" ON user_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards" ON user_rewards
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for gamification_settings
CREATE POLICY "Users can view their own gamification settings" ON gamification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification settings" ON gamification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification settings" ON gamification_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON families
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_dining_challenges_updated_at
    BEFORE UPDATE ON dining_challenges
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_challenge_participation_updated_at
    BEFORE UPDATE ON user_challenge_participation
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_family_leaderboards_updated_at
    BEFORE UPDATE ON family_leaderboards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_global_leaderboards_updated_at
    BEFORE UPDATE ON global_leaderboards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_milestone_progress_updated_at
    BEFORE UPDATE ON user_milestone_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_gamification_settings_updated_at
    BEFORE UPDATE ON gamification_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to create default gamification settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification_settings()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.gamification_settings (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create gamification settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON auth.users;
CREATE TRIGGER on_auth_user_created_gamification
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_gamification_settings();

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
    target_user_id uuid,
    challenge_id_param uuid
)
RETURNS void AS $$
DECLARE
    challenge_record RECORD;
    user_stats RECORD;
    new_progress jsonb := '{}';
    completion_percentage integer := 0;
    is_completed boolean := false;
BEGIN
    -- Get challenge details
    SELECT * INTO challenge_record 
    FROM dining_challenges 
    WHERE id = challenge_id_param;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Get user statistics for challenge evaluation
    SELECT 
        COUNT(DISTINCT r.id) as reviews_written,
        COUNT(DISTINCT mi.restaurant_id) as restaurants_visited,
        COUNT(DISTINCT restaurants.cuisine_type) as unique_cuisines,
        COUNT(DISTINCT DATE(r.created_at)) as dining_days
    INTO user_stats
    FROM ratings r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    JOIN restaurants ON mi.restaurant_id = restaurants.id
    WHERE r.user_id = target_user_id
    AND r.created_at >= (
        SELECT start_date FROM user_challenge_participation 
        WHERE user_id = target_user_id AND challenge_id = challenge_id_param
    );

    -- Calculate progress based on challenge requirements
    CASE challenge_record.category
        WHEN 'exploration' THEN
            IF challenge_record.requirements->>'unique_cuisines' IS NOT NULL THEN
                new_progress := jsonb_build_object(
                    'current_cuisines', user_stats.unique_cuisines,
                    'target_cuisines', (challenge_record.requirements->>'unique_cuisines')::integer
                );
                completion_percentage := LEAST(100, 
                    (user_stats.unique_cuisines * 100) / (challenge_record.requirements->>'unique_cuisines')::integer
                );
            END IF;
        
        WHEN 'frequency' THEN
            IF challenge_record.requirements->>'dining_days' IS NOT NULL THEN
                new_progress := jsonb_build_object(
                    'current_days', user_stats.dining_days,
                    'target_days', (challenge_record.requirements->>'dining_days')::integer
                );
                completion_percentage := LEAST(100, 
                    (user_stats.dining_days * 100) / (challenge_record.requirements->>'dining_days')::integer
                );
            END IF;
        
        WHEN 'variety' THEN
            IF challenge_record.requirements->>'restaurants_visited' IS NOT NULL THEN
                new_progress := jsonb_build_object(
                    'current_restaurants', user_stats.restaurants_visited,
                    'target_restaurants', (challenge_record.requirements->>'restaurants_visited')::integer
                );
                completion_percentage := LEAST(100, 
                    (user_stats.restaurants_visited * 100) / (challenge_record.requirements->>'restaurants_visited')::integer
                );
            END IF;
        
        ELSE
            completion_percentage := 0;
    END CASE;

    is_completed := (completion_percentage >= 100);

    -- Update challenge participation
    UPDATE user_challenge_participation 
    SET 
        progress = new_progress,
        completion_percentage = completion_percentage,
        is_completed = is_completed,
        completed_at = CASE WHEN is_completed AND NOT user_challenge_participation.is_completed 
                           THEN NOW() 
                           ELSE completed_at 
                      END,
        updated_at = NOW()
    WHERE user_id = target_user_id AND challenge_id = challenge_id_param;

    -- Award rewards if completed
    IF is_completed THEN
        PERFORM award_challenge_rewards(target_user_id, challenge_id_param);
    END IF;
END;
$$ language plpgsql security definer;

-- Function to award challenge rewards
CREATE OR REPLACE FUNCTION award_challenge_rewards(
    target_user_id uuid,
    challenge_id_param uuid
)
RETURNS void AS $$
DECLARE
    challenge_record RECORD;
    reward_item RECORD;
BEGIN
    -- Get challenge details
    SELECT * INTO challenge_record 
    FROM dining_challenges 
    WHERE id = challenge_id_param;

    -- Process each reward
    FOR reward_item IN 
        SELECT * FROM jsonb_array_elements(challenge_record.rewards) AS reward
    LOOP
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
            reward_item.reward->>'type',
            'challenge',
            challenge_id_param,
            reward_item.reward->>'title',
            reward_item.reward->>'description',
            reward_item.reward->'value'
        );
    END LOOP;

    -- Create achievement insight (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dining_insights') THEN
        INSERT INTO dining_insights (user_id, insight_type, title, description, importance_score)
        VALUES (
            target_user_id,
            'milestone',
            format('Challenge Completed: %s', challenge_record.name),
            challenge_record.description,
            8
        );
    END IF;
END;
$$ language plpgsql security definer;

-- Function to update family leaderboard
CREATE OR REPLACE FUNCTION update_family_leaderboard(
    target_family_id uuid,
    leaderboard_type_param text,
    period_start_param date,
    period_end_param date
)
RETURNS void AS $$
DECLARE
    member_record RECORD;
    rankings jsonb := '[]';
    participant_count integer := 0;
BEGIN
    -- Calculate rankings based on leaderboard type
    CASE leaderboard_type_param
        WHEN 'monthly_reviews' THEN
            FOR member_record IN 
                SELECT 
                    fm.user_id,
                    COALESCE(up.first_name, 'User') as display_name,
                    COUNT(r.id) as score
                FROM family_members fm
                LEFT JOIN user_profiles up ON fm.user_id = up.id
                LEFT JOIN ratings r ON r.user_id = fm.user_id 
                    AND r.created_at >= period_start_param 
                    AND r.created_at < period_end_param + INTERVAL '1 day'
                WHERE fm.family_id = target_family_id
                GROUP BY fm.user_id, up.first_name
                ORDER BY score DESC
            LOOP
                rankings := rankings || jsonb_build_object(
                    'user_id', member_record.user_id,
                    'display_name', member_record.display_name,
                    'score', member_record.score,
                    'rank', participant_count + 1
                );
                participant_count := participant_count + 1;
            END LOOP;
        
        WHEN 'achievement_points' THEN
            FOR member_record IN 
                SELECT 
                    fm.user_id,
                    COALESCE(up.first_name, 'User') as display_name,
                    COALESCE(SUM(a.points_value), 0) as score
                FROM family_members fm
                LEFT JOIN user_profiles up ON fm.user_id = up.id
                LEFT JOIN user_achievements ua ON ua.user_id = fm.user_id 
                    AND ua.is_unlocked = true
                    AND ua.earned_date >= period_start_param 
                    AND ua.earned_date < period_end_param + INTERVAL '1 day'
                LEFT JOIN achievements a ON ua.achievement_id = a.id
                WHERE fm.family_id = target_family_id
                GROUP BY fm.user_id, up.first_name
                ORDER BY score DESC
            LOOP
                rankings := rankings || jsonb_build_object(
                    'user_id', member_record.user_id,
                    'display_name', member_record.display_name,
                    'score', member_record.score,
                    'rank', participant_count + 1
                );
                participant_count := participant_count + 1;
            END LOOP;
    END CASE;

    -- Insert or update leaderboard
    INSERT INTO family_leaderboards (
        family_id,
        leaderboard_type,
        period_start,
        period_end,
        rankings,
        total_participants
    ) VALUES (
        target_family_id,
        leaderboard_type_param,
        period_start_param,
        period_end_param,
        rankings,
        participant_count
    )
    ON CONFLICT (family_id, leaderboard_type, period_start, period_end)
    DO UPDATE SET
        rankings = EXCLUDED.rankings,
        total_participants = EXCLUDED.total_participants,
        updated_at = NOW();
END;
$$ language plpgsql security definer;

-- Insert default achievement categories
INSERT INTO achievement_categories (name, description, icon, color, sort_order) VALUES
('Explorer', 'Discover new cuisines and restaurants', '🗺️', '#10B981', 1),
('Reviewer', 'Share your dining experiences', '✍️', '#3B82F6', 2),
('Social', 'Connect with the community', '👥', '#8B5CF6', 3),
('Loyalty', 'Show commitment to favorites', '❤️', '#EF4444', 4),
('Milestone', 'Reach important goals', '🏆', '#F59E0B', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default dining challenges
INSERT INTO dining_challenges (
    name, description, challenge_type, category, difficulty_level, duration_days, 
    requirements, rewards, icon
) VALUES
(
    '7-Day Cuisine Explorer',
    'Try 7 different cuisines in 7 days',
    'personal',
    'exploration',
    'medium',
    7,
    '{"unique_cuisines": 7}',
    '[{"type": "points", "title": "Explorer Points", "description": "50 exploration points", "value": {"points": 50}}, {"type": "badge", "title": "Cuisine Explorer Badge", "description": "Special exploration badge", "value": {"badge_id": "cuisine_explorer_7day"}}]',
    '🌍'
),
(
    'Family Food Week',
    'Dine out together as a family 5 times in a week',
    'family',
    'frequency',
    'easy',
    7,
    '{"dining_days": 5, "family_participation": true}',
    '[{"type": "points", "title": "Family Bonus", "description": "100 family points", "value": {"points": 100}}]',
    '👨‍👩‍👧‍👦'
),
(
    'Local Legend',
    'Visit 10 local restaurants in your area',
    'personal',
    'variety',
    'hard',
    30,
    '{"restaurants_visited": 10, "local_only": true}',
    '[{"type": "points", "title": "Local Legend Points", "description": "200 loyalty points", "value": {"points": 200}}, {"type": "special_recognition", "title": "Local Legend Status", "description": "Featured as local food expert", "value": {"recognition": "local_legend"}}]',
    '🏠'
),
(
    'Review Master Challenge',
    'Write detailed reviews for 20 restaurants',
    'personal',
    'social',
    'expert',
    60,
    '{"reviews_written": 20, "min_review_length": 100}',
    '[{"type": "points", "title": "Master Reviewer Points", "description": "500 reviewer points", "value": {"points": 500}}, {"type": "feature_unlock", "title": "Premium Features", "description": "Unlock advanced review tools", "value": {"features": ["advanced_analytics", "photo_editing"]}}]',
    '📝'
)
ON CONFLICT (name) DO NOTHING;

-- Insert default streak milestones
INSERT INTO streak_milestones (streak_type, milestone_days, name, description, icon, rewards) VALUES
('dining_out', 7, 'Weekly Warrior', 'Dined out for 7 consecutive weeks', '🔥', '{"points": 50, "badge": "weekly_warrior"}'),
('dining_out', 30, 'Monthly Master', 'Dined out for 30 consecutive weeks', '🏆', '{"points": 200, "badge": "monthly_master"}'),
('reviewing', 14, 'Review Streak', 'Wrote reviews for 14 consecutive weeks', '✍️', '{"points": 75, "badge": "review_streak"}'),
('exploring', 21, 'Explorer Streak', 'Tried new places for 21 consecutive weeks', '🗺️', '{"points": 150, "badge": "explorer_streak"}')
ON CONFLICT (streak_type, milestone_days) DO NOTHING;

-- Create enhanced achievement milestones for existing achievements (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        INSERT INTO achievement_milestones (achievement_id, milestone_level, name, description, requirements, points_bonus, badge_icon)
        SELECT 
            a.id,
            1,
            a.name || ' - Bronze',
            'Bronze level: ' || a.description,
            a.requirements,
            a.points_value / 2,
            '🥉'
        FROM achievements a
        WHERE a.name IN ('Cuisine Explorer', 'Review Master', 'Adventurous Eater')
        ON CONFLICT (achievement_id, milestone_level) DO NOTHING;

        INSERT INTO achievement_milestones (achievement_id, milestone_level, name, description, requirements, points_bonus, badge_icon)
        SELECT 
            a.id,
            2,
            a.name || ' - Silver',
            'Silver level: Enhanced ' || a.description,
            jsonb_set(a.requirements, '{}', (jsonb_each_text(a.requirements)).value::int * 2),
            a.points_value,
            '🥈'
        FROM achievements a
        WHERE a.name IN ('Cuisine Explorer', 'Review Master', 'Adventurous Eater')
        ON CONFLICT (achievement_id, milestone_level) DO NOTHING;

        INSERT INTO achievement_milestones (achievement_id, milestone_level, name, description, requirements, points_bonus, badge_icon)
        SELECT 
            a.id,
            3,
            a.name || ' - Gold',
            'Gold level: Master ' || a.description,
            jsonb_set(a.requirements, '{}', (jsonb_each_text(a.requirements)).value::int * 5),
            a.points_value * 2,
            '🥇'
        FROM achievements a
        WHERE a.name IN ('Cuisine Explorer', 'Review Master', 'Adventurous Eater')
        ON CONFLICT (achievement_id, milestone_level) DO NOTHING;
    END IF;
END $$;
