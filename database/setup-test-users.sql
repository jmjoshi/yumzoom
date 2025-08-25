-- YumZoom Test Users Setup Script
-- This script creates realistic test users for all user types in the YumZoom platform
-- Run this script in Supabase SQL editor

-- WARNING: This will DELETE ALL existing users and create fresh test users
-- Make sure you want to proceed before running this script

BEGIN;

-- =====================================================
-- STEP 1: Clean Slate - Remove All Existing Users
-- =====================================================

SELECT '=== STEP 1: CLEANING EXISTING DATA ===' as step_info;

-- Delete all user-related data in proper order to respect foreign keys
DELETE FROM user_restaurant_ratings;
DELETE FROM restaurant_characteristics;

-- Note: We cannot directly delete from auth.users table in Supabase
-- This must be done through the Supabase Auth API or dashboard
-- The script will show you what to do manually

SELECT 'MANUAL ACTION REQUIRED:' as action_type, 
       'Go to Supabase Dashboard > Authentication > Users and delete all existing users manually' as instruction;

-- =====================================================
-- STEP 2: Create Realistic Test Users
-- =====================================================

SELECT '=== STEP 2: TEST USER CREATION INSTRUCTIONS ===' as step_info;

-- Since we cannot create auth.users directly in SQL, we need to provide instructions
-- for creating users through the Supabase Auth system

SELECT 'CREATE THESE USERS MANUALLY IN SUPABASE AUTH:' as header;

-- Customer Users
SELECT '--- CUSTOMER USERS ---' as user_type;
SELECT 'Email: alice.johnson@gmail.com, Password: TestUser123!, Role: customer' as user1;
SELECT 'Email: mike.chen@yahoo.com, Password: TestUser123!, Role: customer' as user2;
SELECT 'Email: sarah.williams@outlook.com, Password: TestUser123!, Role: customer' as user3;
SELECT 'Email: david.brown@gmail.com, Password: TestUser123!, Role: customer' as user4;
SELECT 'Email: emily.davis@hotmail.com, Password: TestUser123!, Role: customer' as user5;

-- Restaurant Owners
SELECT '--- RESTAURANT OWNER USERS ---' as user_type;
SELECT 'Email: marco.rossini@bellaitalia.com, Password: RestaurantOwner123!, Role: restaurant_owner' as owner1;
SELECT 'Email: kenji.tanaka@sakurasushi.com, Password: RestaurantOwner123!, Role: restaurant_owner' as owner2;
SELECT 'Email: carlos.martinez@tacofiesta.com, Password: RestaurantOwner123!, Role: restaurant_owner' as owner3;
SELECT 'Email: sophia.green@thegreengarden.com, Password: RestaurantOwner123!, Role: restaurant_owner' as owner4;

-- Business Partners
SELECT '--- BUSINESS PARTNER USERS ---' as user_type;
SELECT 'Email: james.partnership@fooddelivery.com, Password: BusinessPartner123!, Role: business_partner' as partner1;
SELECT 'Email: lisa.collaboration@restauranttech.com, Password: BusinessPartner123!, Role: business_partner' as partner2;

-- Admin Users
SELECT '--- ADMIN USERS ---' as user_type;
SELECT 'Email: admin@yumzoom.com, Password: AdminUser123!, Role: admin' as admin1;
SELECT 'Email: support@yumzoom.com, Password: AdminUser123!, Role: admin' as admin2;

-- =====================================================
-- STEP 3: User Profile Data Setup
-- =====================================================

-- After creating users in Supabase Auth, run this part to set up user profiles

SELECT '=== STEP 3: USER PROFILE SETUP (Run after creating auth users) ===' as step_info;

-- Create user profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    user_role TEXT NOT NULL DEFAULT 'customer',
    phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;
    
    -- Add full_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE user_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- Add date_of_birth column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE user_profiles ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Check if role column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'user_role') THEN
        ALTER TABLE user_profiles ADD COLUMN user_role TEXT DEFAULT 'customer';
    END IF;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- =====================================================
-- STEP 4: Auto-populate User Profiles (Run after auth users are created)
-- =====================================================

-- This function will populate user profiles based on email patterns
CREATE OR REPLACE FUNCTION populate_test_user_profiles()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    profile_count INTEGER := 0;
BEGIN
    -- Loop through all auth users and create profiles
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        
        -- Determine role and profile info based on email
        IF user_record.email LIKE '%@bellaitalia.com' OR 
           user_record.email LIKE '%@sakurasushi.com' OR 
           user_record.email LIKE '%@tacofiesta.com' OR 
           user_record.email LIKE '%@thegreengarden.com' THEN
            
            -- Restaurant Owner
            INSERT INTO user_profiles (id, full_name, user_role, phone) VALUES (
                user_record.id,
                CASE 
                    WHEN user_record.email LIKE 'marco.%' THEN 'Marco Rossini'
                    WHEN user_record.email LIKE 'kenji.%' THEN 'Kenji Tanaka'
                    WHEN user_record.email LIKE 'carlos.%' THEN 'Carlos Martinez'
                    WHEN user_record.email LIKE 'sophia.%' THEN 'Sophia Green'
                    ELSE 'Restaurant Owner'
                END,
                'restaurant_owner',
                CASE 
                    WHEN user_record.email LIKE 'marco.%' THEN '(555) 123-4567'
                    WHEN user_record.email LIKE 'kenji.%' THEN '(555) 234-5678'
                    WHEN user_record.email LIKE 'carlos.%' THEN '(555) 345-6789'
                    WHEN user_record.email LIKE 'sophia.%' THEN '(555) 456-7890'
                    ELSE '(555) 000-0000'
                END
            ) ON CONFLICT (id) DO NOTHING;
            
        ELSIF user_record.email LIKE '%@yumzoom.com' THEN
            
            -- Admin User
            INSERT INTO user_profiles (id, full_name, user_role, phone) VALUES (
                user_record.id,
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'System Administrator'
                    WHEN user_record.email LIKE 'support@%' THEN 'Support Manager'
                    ELSE 'Admin User'
                END,
                'admin',
                '(555) 999-0000'
            ) ON CONFLICT (id) DO NOTHING;
            
        ELSIF user_record.email LIKE '%@fooddelivery.com' OR 
              user_record.email LIKE '%@restauranttech.com' THEN
            
            -- Business Partner
            INSERT INTO user_profiles (id, full_name, user_role, phone) VALUES (
                user_record.id,
                CASE 
                    WHEN user_record.email LIKE 'james.%' THEN 'James Partnership'
                    WHEN user_record.email LIKE 'lisa.%' THEN 'Lisa Collaboration'
                    ELSE 'Business Partner'
                END,
                'business_partner',
                '(555) 888-0000'
            ) ON CONFLICT (id) DO NOTHING;
            
        ELSE
            
            -- Regular Customer
            INSERT INTO user_profiles (id, full_name, user_role, phone, date_of_birth) VALUES (
                user_record.id,
                CASE 
                    WHEN user_record.email LIKE 'alice.%' THEN 'Alice Johnson'
                    WHEN user_record.email LIKE 'mike.%' THEN 'Mike Chen'
                    WHEN user_record.email LIKE 'sarah.%' THEN 'Sarah Williams'
                    WHEN user_record.email LIKE 'david.%' THEN 'David Brown'
                    WHEN user_record.email LIKE 'emily.%' THEN 'Emily Davis'
                    ELSE 'Customer User'
                END,
                'customer',
                CASE 
                    WHEN user_record.email LIKE 'alice.%' THEN '(555) 111-2222'
                    WHEN user_record.email LIKE 'mike.%' THEN '(555) 222-3333'
                    WHEN user_record.email LIKE 'sarah.%' THEN '(555) 333-4444'
                    WHEN user_record.email LIKE 'david.%' THEN '(555) 444-5555'
                    WHEN user_record.email LIKE 'emily.%' THEN '(555) 555-6666'
                    ELSE '(555) 000-1111'
                END,
                CASE 
                    WHEN user_record.email LIKE 'alice.%' THEN '1990-05-15'::DATE
                    WHEN user_record.email LIKE 'mike.%' THEN '1985-08-22'::DATE
                    WHEN user_record.email LIKE 'sarah.%' THEN '1992-12-03'::DATE
                    WHEN user_record.email LIKE 'david.%' THEN '1988-07-18'::DATE
                    WHEN user_record.email LIKE 'emily.%' THEN '1995-01-30'::DATE
                    ELSE '1990-01-01'::DATE
                END
            ) ON CONFLICT (id) DO NOTHING;
            
        END IF;
        
        profile_count := profile_count + 1;
    END LOOP;
    
    RETURN 'Created ' || profile_count || ' user profiles successfully!';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Usage Instructions
-- =====================================================

SELECT '=== STEP 5: COMPLETE SETUP INSTRUCTIONS ===' as step_info;

SELECT 'To complete the test user setup:' as instruction_header;
SELECT '1. Go to Supabase Dashboard > Authentication > Users' as step1;
SELECT '2. Delete all existing users manually' as step2;
SELECT '3. Create the users listed above using "Add User" button' as step3;
SELECT '4. Use the exact email/password combinations provided' as step4;
SELECT '5. After creating all auth users, run: SELECT populate_test_user_profiles();' as step5;
SELECT '6. Then run your restaurant characteristics test script' as step6;

-- Show sample user summary
SELECT '=== TEST USER SUMMARY ===' as summary_header;
SELECT 'Total Users to Create: 13' as total;
SELECT 'Customers: 5, Restaurant Owners: 4, Business Partners: 2, Admins: 2' as breakdown;

-- =====================================================
-- STEP 6: Verification Queries (Run after user creation)
-- =====================================================

-- Use these queries after creating users to verify setup
SELECT '=== VERIFICATION QUERIES (Run after user creation) ===' as verification_header;

SELECT 'Query 1: Check auth users count' as query1;
SELECT 'SELECT COUNT(*) as total_auth_users FROM auth.users;' as query1_sql;

SELECT 'Query 2: Check user profiles by role' as query2;
SELECT 'SELECT role, COUNT(*) as count FROM user_profiles GROUP BY role ORDER BY role;' as query2_sql;

SELECT 'Query 3: List all test users' as query3;
SELECT 'SELECT email, full_name, role FROM user_profiles ORDER BY role, full_name;' as query3_sql;

COMMIT;

-- Final message
SELECT '🎯 TEST USER SETUP COMPLETE! Follow the instructions above to create realistic test users.' as final_message;
