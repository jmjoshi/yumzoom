-- Create missing social tables
-- Run this in Supabase SQL Editor to complete the migration

-- Missing collaboration tables
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_session ON collaboration_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_participants_user ON collaboration_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_options_session ON collaboration_options(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_votes_session ON collaboration_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_votes_option ON collaboration_votes(option_id);

-- Enable RLS
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_votes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view participants in sessions they're part of" ON collaboration_participants;
DROP POLICY IF EXISTS "Users can view options in sessions they're part of" ON collaboration_options;
DROP POLICY IF EXISTS "Users can view votes in sessions they're part of" ON collaboration_votes;

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

-- Create basic activity feed function
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
