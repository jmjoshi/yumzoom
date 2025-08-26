-- Simplified RBAC Fix Script
-- This version avoids complex RLS policies that might cause syntax errors

-- ======================================================
-- STEP 1: Add user_role column if it doesn't exist
-- ======================================================

DO $$
BEGIN
    -- Check if user_role column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'user_role') THEN
        
        -- Add the user_role column with constraint
        ALTER TABLE user_profiles 
        ADD COLUMN user_role TEXT DEFAULT 'customer' 
        CHECK (user_role IN ('customer', 'restaurant_owner', 'business_partner', 'admin'));
        
        RAISE NOTICE '✅ Added user_role column to user_profiles table';
    ELSE
        RAISE NOTICE '✅ user_role column already exists in user_profiles table';
    END IF;
END $$;

-- ======================================================
-- STEP 2: Enable Row Level Security (Simplified)
-- ======================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Simplified policies that avoid OLD/NEW references in wrong context
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ======================================================
-- STEP 3: Create/Update existing user profiles
-- ======================================================

-- Create profiles for existing auth users who don't have profiles
INSERT INTO user_profiles (id, first_name, last_name, user_role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    'customer'
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ======================================================
-- STEP 4: Assign roles to specific test users
-- ======================================================

-- Update admin users
UPDATE user_profiles 
SET 
    user_role = 'admin',
    first_name = 'System',
    last_name = 'Administrator'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@yumzoom.com'
);

UPDATE user_profiles 
SET 
    user_role = 'admin',
    first_name = 'Support',
    last_name = 'Manager'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'support@yumzoom.com'
);

-- Update restaurant owners
UPDATE user_profiles 
SET 
    user_role = 'restaurant_owner',
    first_name = 'Marco',
    last_name = 'Rossini'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'marco.rossini@bellaitalia.com'
);

UPDATE user_profiles 
SET 
    user_role = 'restaurant_owner',
    first_name = 'Kenji',
    last_name = 'Tanaka'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'kenji.tanaka@sakurasushi.com'
);

UPDATE user_profiles 
SET 
    user_role = 'restaurant_owner',
    first_name = 'Carlos',
    last_name = 'Martinez'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'carlos.martinez@tacofiesta.com'
);

UPDATE user_profiles 
SET 
    user_role = 'restaurant_owner',
    first_name = 'Sophia',
    last_name = 'Green'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'sophia.green@thegreengarden.com'
);

-- Update business partners
UPDATE user_profiles 
SET 
    user_role = 'business_partner',
    first_name = 'James',
    last_name = 'Partnership'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'james.partnership@fooddelivery.com'
);

UPDATE user_profiles 
SET 
    user_role = 'business_partner',
    first_name = 'Lisa',
    last_name = 'Collaboration'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'lisa.collaboration@restauranttech.com'
);

-- Update customer users (these should already be 'customer' but let's set names)
UPDATE user_profiles 
SET 
    user_role = 'customer',
    first_name = 'Alice',
    last_name = 'Johnson'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'alice.johnson@gmail.com'
);

UPDATE user_profiles 
SET 
    user_role = 'customer',
    first_name = 'Mike',
    last_name = 'Chen'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'mike.chen@yahoo.com'
);

UPDATE user_profiles 
SET 
    user_role = 'customer',
    first_name = 'Sarah',
    last_name = 'Williams'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'sarah.williams@outlook.com'
);

UPDATE user_profiles 
SET 
    user_role = 'customer',
    first_name = 'David',
    last_name = 'Brown'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'david.brown@gmail.com'
);

UPDATE user_profiles 
SET 
    user_role = 'customer',
    first_name = 'Emily',
    last_name = 'Davis'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'emily.davis@hotmail.com'
);

-- ======================================================
-- STEP 5: Verification
-- ======================================================

-- Show final user roles
SELECT 
    up.first_name || ' ' || up.last_name as full_name,
    up.user_role,
    au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, au.email;

-- Show role summary
SELECT 
    user_role,
    COUNT(*) as count 
FROM user_profiles 
GROUP BY user_role 
ORDER BY user_role;

-- Success message
SELECT '🎉 RBAC FIX COMPLETE! 🎉' as status;
