-- Emergency RLS bypass for testing
-- Run this ONLY for debugging the role issue

-- First check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Test query - this should now work regardless of policies
SELECT 
    'Testing without RLS:' as test_status;

SELECT 
    up.user_role,
    au.email,
    up.first_name || ' ' || up.last_name as name,
    up.id
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'admin@yumzoom.com';

-- Re-enable RLS after testing
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for testing - remember to re-enable!' as warning;
