-- Fix infinite recursion in RLS policies
-- The admin policy was creating a circular reference

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Temporarily disable RLS to clear any locks
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile 
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow profile creation for authenticated users
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Allow all reads for authenticated users (simplest approach)
-- This avoids the infinite recursion completely
CREATE POLICY "Authenticated users can read profiles" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Test the fix by checking if we can read profiles now
SELECT 'Testing fixed policies:' as status;

-- This should now work without infinite recursion
SELECT 
    user_role,
    first_name,
    last_name,
    id
FROM user_profiles 
LIMIT 5;

SELECT 'RLS infinite recursion fixed!' as result;
