-- Delete User Script for YumZoom Database
-- This script safely deletes a user and all associated data
-- Run this script in Supabase SQL editor

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

-- Option 1: Delete by Email
-- UPDATE the email below to the user you want to delete
-- SET @user_email = 'user@example.com';

-- Option 2: Delete by User ID  
-- UPDATE the user_id below to the user you want to delete
-- SET @user_id = 'uuid-here';

-- =====================================================
-- DELETE USER BY EMAIL FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_by_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    target_user_id UUID;
    deleted_ratings INTEGER := 0;
    deleted_profile INTEGER := 0;
    result_message TEXT;
BEGIN
    -- Find the user ID by email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = user_email;
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User with email "' || user_email || '" not found.';
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete user restaurant ratings
        DELETE FROM user_restaurant_ratings 
        WHERE user_id = target_user_id;
        GET DIAGNOSTICS deleted_ratings = ROW_COUNT;
        
        -- Delete user profile
        DELETE FROM user_profiles 
        WHERE id = target_user_id;
        GET DIAGNOSTICS deleted_profile = ROW_COUNT;
        
        -- Note: We cannot delete from auth.users table directly
        -- This must be done through Supabase Auth API or dashboard
        
        -- Prepare result message
        result_message := 'SUCCESS: User data deleted for ' || user_email || 
                         '. Deleted ' || deleted_ratings || ' ratings and ' || 
                         deleted_profile || ' profile record. ' ||
                         'IMPORTANT: You must manually delete the auth user from Supabase Dashboard > Authentication > Users.';
        
        RETURN result_message;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RAISE EXCEPTION 'ERROR deleting user data: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DELETE USER BY ID FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_by_id(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
    deleted_ratings INTEGER := 0;
    deleted_profile INTEGER := 0;
    result_message TEXT;
BEGIN
    -- Get user email for reference
    SELECT au.email INTO user_email 
    FROM auth.users au 
    WHERE au.id = target_user_id;
    
    -- Check if user exists
    IF user_email IS NULL THEN
        RETURN 'ERROR: User with ID "' || target_user_id || '" not found.';
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete user restaurant ratings
        DELETE FROM user_restaurant_ratings 
        WHERE user_id = target_user_id;
        GET DIAGNOSTICS deleted_ratings = ROW_COUNT;
        
        -- Delete user profile
        DELETE FROM user_profiles 
        WHERE id = target_user_id;
        GET DIAGNOSTICS deleted_profile = ROW_COUNT;
        
        -- Prepare result message
        result_message := 'SUCCESS: User data deleted for ' || user_email || ' (' || target_user_id || ')' ||
                         '. Deleted ' || deleted_ratings || ' ratings and ' || 
                         deleted_profile || ' profile record. ' ||
                         'IMPORTANT: You must manually delete the auth user from Supabase Dashboard > Authentication > Users.';
        
        RETURN result_message;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RAISE EXCEPTION 'ERROR deleting user data: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BULK DELETE USERS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION delete_multiple_users(user_emails TEXT[])
RETURNS TEXT AS $$
DECLARE
    email_item TEXT;
    total_deleted INTEGER := 0;
    result_message TEXT := '';
    individual_result TEXT;
BEGIN
    -- Loop through each email
    FOREACH email_item IN ARRAY user_emails
    LOOP
        -- Delete each user
        SELECT delete_user_by_email(email_item) INTO individual_result;
        
        -- Check if deletion was successful
        IF individual_result LIKE 'SUCCESS:%' THEN
            total_deleted := total_deleted + 1;
            result_message := result_message || '✓ ' || email_item || E'\n';
        ELSE
            result_message := result_message || '✗ ' || email_item || ': ' || individual_result || E'\n';
        END IF;
    END LOOP;
    
    RETURN 'BULK DELETE COMPLETED: ' || total_deleted || ' users deleted successfully.' || E'\n' || result_message ||
           'IMPORTANT: You must manually delete the auth users from Supabase Dashboard > Authentication > Users.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Delete a single user by email
-- SELECT delete_user_by_email('alice.johnson@gmail.com');

-- Example 2: Delete a single user by ID
-- SELECT delete_user_by_id('your-uuid-here');

-- Example 3: Delete multiple users at once
-- SELECT delete_multiple_users(ARRAY[
--     'alice.johnson@gmail.com',
--     'mike.chen@yahoo.com',
--     'test@example.com'
-- ]);

-- Example 4: Delete all test customers
-- SELECT delete_multiple_users(ARRAY[
--     'alice.johnson@gmail.com',
--     'mike.chen@yahoo.com', 
--     'sarah.williams@outlook.com',
--     'david.brown@gmail.com',
--     'emily.davis@hotmail.com'
-- ]);

-- Example 5: Delete all test users (complete cleanup)
-- SELECT delete_multiple_users(ARRAY[
--     'admin@yumzoom.com',
--     'support@yumzoom.com',
--     'marco.rossini@bellaitalia.com',
--     'kenji.tanaka@sakurasushi.com',
--     'carlos.martinez@tacofiesta.com',
--     'sophia.green@thegreengarden.com',
--     'james.partnership@fooddelivery.com',
--     'lisa.collaboration@restauranttech.com',
--     'alice.johnson@gmail.com',
--     'mike.chen@yahoo.com',
--     'sarah.williams@outlook.com',
--     'david.brown@gmail.com',
--     'emily.davis@hotmail.com'
-- ]);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check remaining users after deletion
-- SELECT 'Users remaining in profiles:' as status, COUNT(*) as count FROM user_profiles;
-- SELECT 'Users remaining in auth:' as status, COUNT(*) as count FROM auth.users;
-- SELECT 'Ratings remaining:' as status, COUNT(*) as count FROM user_restaurant_ratings;

-- List remaining users by role
-- SELECT user_role, COUNT(*) as count 
-- FROM user_profiles 
-- GROUP BY user_role 
-- ORDER BY user_role;

-- =====================================================
-- REGENERATE AGGREGATED CHARACTERISTICS
-- =====================================================

-- After deleting users, you may want to recalculate restaurant characteristics
-- since some ratings may have been removed

CREATE OR REPLACE FUNCTION recalculate_all_restaurant_characteristics()
RETURNS TEXT AS $$
DECLARE
    restaurant_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Delete all existing characteristics
    DELETE FROM restaurant_characteristics;
    
    -- Recalculate for each restaurant that has ratings
    FOR restaurant_record IN 
        SELECT DISTINCT restaurant_id 
        FROM user_restaurant_ratings
    LOOP
        -- This will trigger the aggregation function
        INSERT INTO restaurant_characteristics (restaurant_id, ambience_rating)
        SELECT restaurant_record.restaurant_id, 0.0;
        
        -- Delete the dummy record to trigger recalculation
        DELETE FROM restaurant_characteristics 
        WHERE restaurant_id = restaurant_record.restaurant_id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN 'Recalculated characteristics for ' || updated_count || ' restaurants.';
END;
$$ LANGUAGE plpgsql;

-- Run this after user deletion to recalculate aggregated ratings:
-- SELECT recalculate_all_restaurant_characteristics();

-- =====================================================
-- COMPLETE CLEANUP SCRIPT
-- =====================================================

-- Uncomment and run this section for complete test data cleanup:

/*
-- Step 1: Delete all user data (except auth.users which must be done manually)
DO $$
BEGIN
    DELETE FROM user_restaurant_ratings;
    DELETE FROM restaurant_characteristics;
    DELETE FROM user_profiles;
    
    RAISE NOTICE 'All user data deleted. Remember to delete auth.users manually in Supabase dashboard.';
END $$;

-- Step 2: Verify cleanup
SELECT 'User profiles:' as table_name, COUNT(*) as remaining_records FROM user_profiles
UNION ALL
SELECT 'User ratings:', COUNT(*) FROM user_restaurant_ratings  
UNION ALL
SELECT 'Restaurant characteristics:', COUNT(*) FROM restaurant_characteristics
UNION ALL
SELECT 'Auth users (manual deletion required):', COUNT(*) FROM auth.users;
*/
