-- Social Features - Phase 1 Schema
-- This file implements the database schema for social networking features

-- Family connections table (following/follower relationships)
CREATE TABLE IF NOT EXISTS family_connections (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    connection_type text DEFAULT 'friend' CHECK (connection_type IN ('friend', 'family_friend', 'neighbor')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_user_id, following_user_id),
    CHECK (follower_user_id != following_user_id)
);

-- Activity feed table to track user activities
CREATE TABLE IF NOT EXISTS user_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type text NOT NULL CHECK (activity_type IN (
        'restaurant_visit', 'review_posted', 'rating_given', 'restaurant_added_to_favorites',
        'restaurant_added_to_wishlist', 'family_member_added', 'achievement_earned'
    )),
    activity_data jsonb DEFAULT '{}',
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    rating integer,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Friend recommendations table for sharing restaurant recommendations
CREATE TABLE IF NOT EXISTS friend_recommendations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    recommender_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    recommendation_type text DEFAULT 'general' CHECK (recommendation_type IN (
        'general', 'occasion_based', 'dietary_friendly', 'family_suitable'
    )),
    message text,
    occasion text,
    recommended_items text[], -- Array of menu item names
    is_read boolean DEFAULT false,
    is_accepted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Family group voting/collaboration table
CREATE TABLE IF NOT EXISTS family_collaboration_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    session_type text DEFAULT 'restaurant_voting' CHECK (session_type IN (
        'restaurant_voting', 'menu_planning', 'occasion_planning', 'group_discovery'
    )),
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    deadline timestamp with time zone,
    voting_rules jsonb DEFAULT '{"multiple_votes": false, "require_unanimous": false}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collaboration session participants
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid REFERENCES family_collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    participant_type text DEFAULT 'voter' CHECK (participant_type IN ('voter', 'observer', 'decision_maker')),
    has_voted boolean DEFAULT false,
    invited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at timestamp with time zone,
    UNIQUE(session_id, user_id, family_member_id)
);

-- Collaboration voting options (restaurants being voted on)
CREATE TABLE IF NOT EXISTS collaboration_options (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid REFERENCES family_collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    suggested_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    suggested_by_family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    suggestion_reason text,
    vote_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Individual votes in collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid REFERENCES family_collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
    option_id uuid REFERENCES collaboration_options(id) ON DELETE CASCADE NOT NULL,
    voter_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    voter_family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    vote_weight integer DEFAULT 1,
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, option_id, voter_user_id, voter_family_member_id)
);

-- User social discovery preferences
CREATE TABLE IF NOT EXISTS social_discovery_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    discoverable_by_email boolean DEFAULT true,
    discoverable_by_phone boolean DEFAULT true,
    allow_connection_suggestions boolean DEFAULT true,
    show_in_friend_activities boolean DEFAULT true,
    auto_accept_family_connections boolean DEFAULT false,
    share_dining_activities boolean DEFAULT true,
    share_favorites_with_friends boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_connections_follower_user_id ON family_connections(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_following_user_id ON family_connections(following_user_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_status ON family_connections(status);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_restaurant_id ON user_activities(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_public ON user_activities(is_public);

CREATE INDEX IF NOT EXISTS idx_friend_recommendations_recipient ON friend_recommendations(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_recommendations_recommender ON friend_recommendations(recommender_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_recommendations_restaurant ON friend_recommendations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_friend_recommendations_read ON friend_recommendations(is_read);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_creator ON family_collaboration_sessions(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON family_collaboration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session ON collaboration_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user ON collaboration_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_options_session ON collaboration_options(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_votes_session ON collaboration_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_votes_option ON collaboration_votes(option_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_family_connections_updated_at
    BEFORE UPDATE ON family_connections
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_friend_recommendations_updated_at
    BEFORE UPDATE ON friend_recommendations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_family_collaboration_sessions_updated_at
    BEFORE UPDATE ON family_collaboration_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_collaboration_votes_updated_at
    BEFORE UPDATE ON collaboration_votes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_social_discovery_settings_updated_at
    BEFORE UPDATE ON social_discovery_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for all new tables
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_discovery_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_connections
CREATE POLICY "Users can view their own connections" ON family_connections
    FOR SELECT USING (auth.uid() = follower_user_id OR auth.uid() = following_user_id);

CREATE POLICY "Users can create their own connections" ON family_connections
    FOR INSERT WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can update their own connections" ON family_connections
    FOR UPDATE USING (auth.uid() = follower_user_id OR auth.uid() = following_user_id);

CREATE POLICY "Users can delete their own connections" ON family_connections
    FOR DELETE USING (auth.uid() = follower_user_id OR auth.uid() = following_user_id);

-- RLS policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public activities from connections" ON user_activities
    FOR SELECT USING (
        is_public = true AND 
        user_id IN (
            SELECT following_user_id FROM family_connections 
            WHERE follower_user_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Users can create their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON user_activities
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for friend_recommendations
CREATE POLICY "Users can view recommendations sent to them or by them" ON friend_recommendations
    FOR SELECT USING (auth.uid() = recipient_user_id OR auth.uid() = recommender_user_id);

CREATE POLICY "Users can create recommendations" ON friend_recommendations
    FOR INSERT WITH CHECK (auth.uid() = recommender_user_id);

CREATE POLICY "Users can update recommendations they received" ON friend_recommendations
    FOR UPDATE USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can delete recommendations they sent" ON friend_recommendations
    FOR DELETE USING (auth.uid() = recommender_user_id);

-- RLS policies for family_collaboration_sessions
CREATE POLICY "Users can view collaboration sessions they created or participate in" ON family_collaboration_sessions
    FOR SELECT USING (
        auth.uid() = creator_user_id OR 
        id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create collaboration sessions" ON family_collaboration_sessions
    FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can update collaboration sessions they created" ON family_collaboration_sessions
    FOR UPDATE USING (auth.uid() = creator_user_id);

CREATE POLICY "Users can delete collaboration sessions they created" ON family_collaboration_sessions
    FOR DELETE USING (auth.uid() = creator_user_id);

-- RLS policies for collaboration_participants
CREATE POLICY "Users can view participants in sessions they're part of" ON collaboration_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM family_collaboration_sessions 
            WHERE creator_user_id = auth.uid()
        ) OR
        session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Session creators can manage participants" ON collaboration_participants
    FOR ALL USING (
        session_id IN (
            SELECT id FROM family_collaboration_sessions 
            WHERE creator_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own participation" ON collaboration_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for collaboration_options
CREATE POLICY "Users can view options in sessions they're part of" ON collaboration_options
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM family_collaboration_sessions 
            WHERE creator_user_id = auth.uid()
        ) OR
        session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can create options" ON collaboration_options
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM family_collaboration_sessions 
            WHERE creator_user_id = auth.uid()
        ) OR
        session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
        )
    );

-- RLS policies for collaboration_votes
CREATE POLICY "Users can view votes in sessions they're part of" ON collaboration_votes
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM family_collaboration_sessions 
            WHERE creator_user_id = auth.uid()
        ) OR
        session_id IN (
            SELECT session_id FROM collaboration_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own votes" ON collaboration_votes
    FOR INSERT WITH CHECK (auth.uid() = voter_user_id);

CREATE POLICY "Users can update their own votes" ON collaboration_votes
    FOR UPDATE USING (auth.uid() = voter_user_id);

CREATE POLICY "Users can delete their own votes" ON collaboration_votes
    FOR DELETE USING (auth.uid() = voter_user_id);

-- RLS policies for social_discovery_settings
CREATE POLICY "Users can view their own social discovery settings" ON social_discovery_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social discovery settings" ON social_discovery_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social discovery settings" ON social_discovery_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to create default social discovery settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_social_settings()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.social_discovery_settings (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create social discovery settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_social ON auth.users;
CREATE TRIGGER on_auth_user_created_social
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_social_settings();

-- Function to log user activities automatically
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id uuid,
    p_activity_type text,
    p_activity_data jsonb DEFAULT '{}',
    p_restaurant_id uuid DEFAULT NULL,
    p_menu_item_id uuid DEFAULT NULL,
    p_family_member_id uuid DEFAULT NULL,
    p_rating integer DEFAULT NULL,
    p_is_public boolean DEFAULT true
)
RETURNS uuid AS $$
DECLARE
    activity_id uuid;
BEGIN
    INSERT INTO user_activities (
        user_id, activity_type, activity_data, restaurant_id, 
        menu_item_id, family_member_id, rating, is_public
    ) VALUES (
        p_user_id, p_activity_type, p_activity_data, p_restaurant_id,
        p_menu_item_id, p_family_member_id, p_rating, p_is_public
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity feed for a user
CREATE OR REPLACE FUNCTION public.get_user_activity_feed(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    activity_type text,
    activity_data jsonb,
    restaurant_id uuid,
    menu_item_id uuid,
    family_member_id uuid,
    rating integer,
    is_public boolean,
    created_at timestamp with time zone,
    user_first_name text,
    user_last_name text,
    restaurant_name text,
    restaurant_cuisine_type text,
    menu_item_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.user_id,
        ua.activity_type,
        ua.activity_data,
        ua.restaurant_id,
        ua.menu_item_id,
        ua.family_member_id,
        ua.rating,
        ua.is_public,
        ua.created_at,
        up.first_name,
        up.last_name,
        r.name as restaurant_name,
        r.cuisine_type as restaurant_cuisine_type,
        mi.name as menu_item_name
    FROM user_activities ua
    LEFT JOIN user_profiles up ON ua.user_id = up.id
    LEFT JOIN restaurants r ON ua.restaurant_id = r.id
    LEFT JOIN menu_items mi ON ua.menu_item_id = mi.id
    WHERE ua.user_id = p_user_id 
       OR (ua.is_public = true AND ua.user_id IN (
           SELECT following_user_id FROM family_connections 
           WHERE follower_user_id = p_user_id AND status = 'accepted'
       ))
    ORDER BY ua.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend suggestions based on mutual connections
CREATE OR REPLACE FUNCTION public.get_friend_suggestions(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    user_id uuid,
    first_name text,
    last_name text,
    avatar_url text,
    mutual_connections_count bigint,
    common_cuisines text[]
) AS $$
BEGIN
    RETURN QUERY
    WITH mutual_friends AS (
        SELECT 
            fc2.following_user_id as suggested_user_id,
            COUNT(*) as mutual_count
        FROM family_connections fc1
        JOIN family_connections fc2 ON fc1.following_user_id = fc2.follower_user_id
        WHERE fc1.follower_user_id = p_user_id 
        AND fc1.status = 'accepted'
        AND fc2.status = 'accepted'
        AND fc2.following_user_id != p_user_id
        AND fc2.following_user_id NOT IN (
            SELECT following_user_id FROM family_connections 
            WHERE follower_user_id = p_user_id
        )
        GROUP BY fc2.following_user_id
    ),
    common_cuisine_preferences AS (
        SELECT 
            mf.suggested_user_id,
            array_agg(DISTINCT unnest_cuisines) as common_cuisines
        FROM mutual_friends mf
        JOIN family_members fm1 ON fm1.user_id = p_user_id
        JOIN family_members fm2 ON fm2.user_id = mf.suggested_user_id
        CROSS JOIN unnest(fm1.favorite_cuisines) AS unnest_cuisines
        WHERE unnest_cuisines = ANY(fm2.favorite_cuisines)
        GROUP BY mf.suggested_user_id
    )
    SELECT 
        up.id,
        up.first_name,
        up.last_name,
        up.avatar_url,
        mf.mutual_count,
        COALESCE(ccp.common_cuisines, ARRAY[]::text[])
    FROM mutual_friends mf
    JOIN user_profiles up ON mf.suggested_user_id = up.id
    LEFT JOIN common_cuisine_preferences ccp ON mf.suggested_user_id = ccp.suggested_user_id
    ORDER BY mf.mutual_count DESC, array_length(COALESCE(ccp.common_cuisines, ARRAY[]::text[]), 1) DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update vote counts when votes are added/removed
CREATE OR REPLACE FUNCTION public.update_collaboration_vote_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE collaboration_options 
        SET vote_count = vote_count + NEW.vote_weight
        WHERE id = NEW.option_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE collaboration_options 
        SET vote_count = vote_count - OLD.vote_weight
        WHERE id = OLD.option_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE collaboration_options 
        SET vote_count = vote_count - OLD.vote_weight + NEW.vote_weight
        WHERE id = NEW.option_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vote counts
CREATE TRIGGER update_vote_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON collaboration_votes
    FOR EACH ROW EXECUTE PROCEDURE update_collaboration_vote_count();
