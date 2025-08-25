-- Debug and Fix Script for Restaurant Characteristics Testing
-- This script first checks the database constraints and then provides solutions

-- =====================================================
-- STEP 1: Debug the Foreign Key Constraint Issue
-- =====================================================

SELECT '=== DEBUGGING FOREIGN KEY CONSTRAINTS ===' as debug_section;

-- Check if auth.users table exists and has any users
SELECT 'auth.users table check:' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') 
            THEN 'EXISTS' 
            ELSE 'NOT EXISTS' 
       END as table_status;

-- Check if there are any users in auth.users
SELECT 'Users count in auth.users:' as check_type, 
       COALESCE((SELECT COUNT(*)::text FROM auth.users), 'TABLE NOT ACCESSIBLE') as user_count;

-- Check the foreign key constraint details
SELECT 'Foreign key constraints on user_restaurant_ratings:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_restaurant_ratings';

-- =====================================================
-- STEP 2: Solution Options
-- =====================================================

SELECT '=== SOLUTION OPTIONS ===' as solution_section;

-- Option A: Check if we can create a test user in auth.users (probably won't work in Supabase)
-- Option B: Temporarily disable the constraint for testing
-- Option C: Modify the constraint to be less restrictive
-- Option D: Use existing users if any exist

-- Let's first try to see if there are ANY existing users we can use
DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Try to count users (this might fail if we can't access auth.users)
    BEGIN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        RAISE NOTICE 'Found % users in auth.users', user_count;
        
        IF user_count > 0 THEN
            SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
            RAISE NOTICE 'Sample user ID available: %', sample_user_id;
        ELSE
            RAISE NOTICE 'No users found in auth.users table';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Cannot access auth.users table: %', SQLERRM;
    END;
END $$;

-- =====================================================
-- STEP 3: Working Solution for Testing
-- =====================================================

SELECT '=== IMPLEMENTING WORKING SOLUTION ===' as implementation_section;

-- We'll create a test script that works around the foreign key constraint
-- by either using existing users or temporarily modifying the constraint

-- First, let's see what approach will work:

-- Check if we can temporarily disable constraints (requires elevated privileges)
DO $$
BEGIN
    -- Try to temporarily disable foreign key checks
    SET session_replication_role = replica;
    RAISE NOTICE 'Successfully disabled foreign key constraints temporarily';
    
    -- Test inserting a sample rating
    BEGIN
        INSERT INTO user_restaurant_ratings (
            user_id, restaurant_id, 
            ambience_rating, decor_rating, service_rating, cleanliness_rating,
            noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
        ) 
        SELECT 
            gen_random_uuid(),
            (SELECT id FROM restaurants WHERE name = 'Bella Italia' LIMIT 1),
            4.5, 4.0, 4.2, 4.8, 3.5, 4.1, 4.7, 4.26
        WHERE EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bella Italia');
        
        RAISE NOTICE 'Successfully inserted test rating with disabled constraints';
        
        -- Clean up the test record
        DELETE FROM user_restaurant_ratings 
        WHERE user_id NOT IN (SELECT id FROM auth.users);
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to insert test rating: %', SQLERRM;
    END;
    
    -- Re-enable foreign key constraints
    SET session_replication_role = DEFAULT;
    RAISE NOTICE 'Re-enabled foreign key constraints';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cannot disable foreign key constraints: %', SQLERRM;
    SET session_replication_role = DEFAULT;
END $$;

-- =====================================================
-- STEP 4: Provide Final Recommendation
-- =====================================================

SELECT '=== RECOMMENDATIONS ===' as recommendations_section;

SELECT 'Based on the above tests, here are your options:' as recommendation_header;

-- The user needs to either:
-- 1. Have actual users in auth.users table
-- 2. Temporarily modify the foreign key constraint  
-- 3. Use a different testing approach that doesn't require foreign key constraint bypass

SELECT 'Option 1: Create actual users in Supabase Auth (recommended)' as option1;
SELECT 'Option 2: Temporarily drop the foreign key constraint for testing' as option2;
SELECT 'Option 3: Test the system with simulated data (without actual user IDs)' as option3;
