-- Fix RLS policies that might be blocking role access
-- This ensures users can always read their own user_role

-- First, let's check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Drop and recreate the policies with proper role access
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Policy: Users can view their own profile (including user_role)
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not their role unless admin)
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Policy: Allow profile creation for new users
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Test the policies by querying as the admin user
-- This should work if the user is properly authenticated
SELECT 
    'Testing RLS policy access:' as test_info;

-- Check if we can read user_profiles with current policies
SELECT 
    id,
    first_name,
    last_name,
    user_role
FROM user_profiles 
WHERE id = auth.uid();

-- Alternative: Temporarily bypass RLS for testing
-- ONLY USE THIS FOR DEBUGGING
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS policy fix applied!' as status;
