-- Quick verification query to check if social tables exist
-- Run this first to confirm the issue
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'family_connections',
    'user_activities', 
    'friend_recommendations',
    'family_collaboration_sessions',
    'social_discovery_settings'
  );

-- If the above query returns empty results, you need to run the full migration:
-- Copy and paste the entire contents of database/social-features-schema.sql
