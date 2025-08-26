-- Complete RBAC Setup and Fix Script
-- This script will fix the user role issue by adding the missing column and setting up test users

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
-- STEP 2: Enable Row Level Security
-- ======================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not their role unless admin)
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id AND (
            -- Users can update their own profile but not role
            (OLD.user_role = NEW.user_role) OR
            -- Admins can update anyone's role
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() AND user_role = 'admin'
            )
        )
    );

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Policy: Allow inserting profiles for new users
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ======================================================
-- STEP 3: Create automatic profile creation function
-- ======================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, user_role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer'
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, do nothing
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ======================================================
-- STEP 4: Create/Update existing user profiles
-- ======================================================

-- Function to update all existing users in auth.users to have profiles
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    profile_count INTEGER := 0;
    result_text TEXT := '';
BEGIN
    -- Create profiles for users that don't have them
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_profiles up ON au.id = up.id
        WHERE up.id IS NULL
    LOOP
        INSERT INTO user_profiles (id, first_name, last_name, user_role)
        VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'first_name', 'User'),
            COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
            'customer'
        );
        
        profile_count := profile_count + 1;
        result_text := result_text || 'Created profile for: ' || user_record.email || E'\n';
    END LOOP;

    RETURN result_text || E'\n✅ Created ' || profile_count || ' missing user profiles!';
END;
$$ LANGUAGE plpgsql;

-- Run the function to create missing profiles
SELECT create_missing_profiles();

-- ======================================================
-- STEP 5: Function to assign roles to test users
-- ======================================================

CREATE OR REPLACE FUNCTION assign_test_user_roles()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    result_text TEXT := '';
    updated_count INTEGER := 0;
BEGIN
    -- Admin users
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN ('admin@yumzoom.com', 'support@yumzoom.com')
    LOOP
        UPDATE user_profiles 
        SET 
            user_role = 'admin',
            first_name = CASE 
                WHEN user_record.email = 'admin@yumzoom.com' THEN 'System'
                WHEN user_record.email = 'support@yumzoom.com' THEN 'Support'
            END,
            last_name = CASE 
                WHEN user_record.email = 'admin@yumzoom.com' THEN 'Administrator'
                WHEN user_record.email = 'support@yumzoom.com' THEN 'Manager'
            END
        WHERE id = user_record.id;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
            result_text := result_text || '👑 Updated admin user: ' || user_record.email || E'\n';
        END IF;
    END LOOP;

    -- Restaurant owners
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'marco.rossini@bellaitalia.com',
            'kenji.tanaka@sakurasushi.com', 
            'carlos.martinez@tacofiesta.com',
            'sophia.green@thegreengarden.com'
        )
    LOOP
        UPDATE user_profiles 
        SET 
            user_role = 'restaurant_owner',
            first_name = CASE 
                WHEN user_record.email = 'marco.rossini@bellaitalia.com' THEN 'Marco'
                WHEN user_record.email = 'kenji.tanaka@sakurasushi.com' THEN 'Kenji'
                WHEN user_record.email = 'carlos.martinez@tacofiesta.com' THEN 'Carlos'
                WHEN user_record.email = 'sophia.green@thegreengarden.com' THEN 'Sophia'
            END,
            last_name = CASE 
                WHEN user_record.email = 'marco.rossini@bellaitalia.com' THEN 'Rossini'
                WHEN user_record.email = 'kenji.tanaka@sakurasushi.com' THEN 'Tanaka'
                WHEN user_record.email = 'carlos.martinez@tacofiesta.com' THEN 'Martinez'
                WHEN user_record.email = 'sophia.green@thegreengarden.com' THEN 'Green'
            END
        WHERE id = user_record.id;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
            result_text := result_text || '🍕 Updated restaurant owner: ' || user_record.email || E'\n';
        END IF;
    END LOOP;

    -- Business partners
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'james.partnership@fooddelivery.com',
            'lisa.collaboration@restauranttech.com'
        )
    LOOP
        UPDATE user_profiles 
        SET 
            user_role = 'business_partner',
            first_name = CASE 
                WHEN user_record.email = 'james.partnership@fooddelivery.com' THEN 'James'
                WHEN user_record.email = 'lisa.collaboration@restauranttech.com' THEN 'Lisa'
            END,
            last_name = CASE 
                WHEN user_record.email = 'james.partnership@fooddelivery.com' THEN 'Partnership'
                WHEN user_record.email = 'lisa.collaboration@restauranttech.com' THEN 'Collaboration'
            END
        WHERE id = user_record.id;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
            result_text := result_text || '🤝 Updated business partner: ' || user_record.email || E'\n';
        END IF;
    END LOOP;

    -- Customer users
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'alice.johnson@gmail.com',
            'mike.chen@yahoo.com',
            'sarah.williams@outlook.com',
            'david.brown@gmail.com',
            'emily.davis@hotmail.com'
        )
    LOOP
        UPDATE user_profiles 
        SET 
            user_role = 'customer',
            first_name = CASE 
                WHEN user_record.email = 'alice.johnson@gmail.com' THEN 'Alice'
                WHEN user_record.email = 'mike.chen@yahoo.com' THEN 'Mike'
                WHEN user_record.email = 'sarah.williams@outlook.com' THEN 'Sarah'
                WHEN user_record.email = 'david.brown@gmail.com' THEN 'David'
                WHEN user_record.email = 'emily.davis@hotmail.com' THEN 'Emily'
            END,
            last_name = CASE 
                WHEN user_record.email = 'alice.johnson@gmail.com' THEN 'Johnson'
                WHEN user_record.email = 'mike.chen@yahoo.com' THEN 'Chen'
                WHEN user_record.email = 'sarah.williams@outlook.com' THEN 'Williams'
                WHEN user_record.email = 'david.brown@gmail.com' THEN 'Brown'
                WHEN user_record.email = 'emily.davis@hotmail.com' THEN 'Davis'
            END
        WHERE id = user_record.id;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
            result_text := result_text || '👥 Updated customer: ' || user_record.email || E'\n';
        END IF;
    END LOOP;

    RETURN result_text || E'\n✅ Total users updated with roles: ' || updated_count;
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- STEP 6: Verification queries
-- ======================================================

-- Show current status before role assignment
SELECT 'BEFORE ROLE ASSIGNMENT - Current user profiles:' as status;
SELECT 
    COALESCE(user_role, 'NO_ROLE') as user_role,
    COUNT(*) as count 
FROM user_profiles 
GROUP BY user_role 
ORDER BY user_role;

-- Assign roles to test users
SELECT assign_test_user_roles();

-- Show final status after role assignment
SELECT 'AFTER ROLE ASSIGNMENT - Final user profiles:' as status;
SELECT 
    user_role,
    COUNT(*) as count 
FROM user_profiles 
GROUP BY user_role 
ORDER BY user_role;

-- Show detailed user list
SELECT 'DETAILED USER LIST:' as info;
SELECT 
    up.first_name || ' ' || up.last_name as full_name,
    up.user_role,
    au.email,
    up.id
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, au.email;

-- ======================================================
-- STEP 7: Test specific users
-- ======================================================

-- Test Alice Johnson (should be customer)
SELECT 'Testing Alice Johnson:' as test;
SELECT 
    up.first_name,
    up.last_name,
    up.user_role,
    au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'alice.johnson@gmail.com';

-- Test admin user
SELECT 'Testing admin user:' as test;
SELECT 
    up.first_name,
    up.last_name,
    up.user_role,
    au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'admin@yumzoom.com';

-- Final success message
SELECT '🎉 RBAC SETUP COMPLETE! 🎉' as final_status;
SELECT 'You can now sign in with any test user and see their correct role.' as instruction;
SELECT 'Admin users will now see admin functionality in the navigation.' as note;
