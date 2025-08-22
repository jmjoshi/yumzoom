-- Check if all required social tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'family_connections',
    'user_activities', 
    'friend_recommendations',
    'family_collaboration_sessions',
    'collaboration_participants',
    'collaboration_options', 
    'collaboration_votes',
    'social_discovery_settings'
  )
ORDER BY table_name;

-- Check if the stored functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_user_activity_feed',
    'get_friend_suggestions',
    'handle_new_user_social_settings',
    'log_user_activity',
    'update_collaboration_vote_count'
  )
ORDER BY routine_name;
