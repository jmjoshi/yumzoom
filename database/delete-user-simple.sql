-- Simplified Delete User Script for YumZoom Database
-- This script safely deletes a user and all associated data

-- =====================================================
-- SIMPLE DELETE USER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_simple(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    target_user_id UUID;
    deleted_ratings INTEGER;
    deleted_profile INTEGER;
BEGIN
    -- Find the user ID by email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = user_email;
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RETURN 'ERROR: User with email ' || user_email || ' not found.';
    END IF;
    
    -- Delete user restaurant ratings first (foreign key constraint)
    DELETE FROM user_restaurant_ratings 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_ratings = ROW_COUNT;
    
    -- Delete user profile
    DELETE FROM user_profiles 
    WHERE id = target_user_id;
    GET DIAGNOSTICS deleted_profile = ROW_COUNT;
    
    -- Return success message
    RETURN 'SUCCESS: Deleted ' || deleted_ratings || ' ratings and ' || deleted_profile || ' profile for ' || user_email || '. Manually delete from Supabase Auth dashboard.';
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Delete a single user by email
-- SELECT delete_user_simple('alice.johnson@gmail.com');

-- =====================================================
-- MANUAL BULK DELETE (Run one by one)
-- =====================================================

-- Delete all test customers
-- SELECT delete_user_simple('alice.johnson@gmail.com');
-- SELECT delete_user_simple('mike.chen@yahoo.com');
-- SELECT delete_user_simple('sarah.williams@outlook.com');
-- SELECT delete_user_simple('david.brown@gmail.com');
-- SELECT delete_user_simple('emily.davis@hotmail.com');

-- Delete restaurant owners
-- SELECT delete_user_simple('marco.rossini@bellaitalia.com');
-- SELECT delete_user_simple('kenji.tanaka@sakurasushi.com');
-- SELECT delete_user_simple('carlos.martinez@tacofiesta.com');
-- SELECT delete_user_simple('sophia.green@thegreengarden.com');

-- Delete business partners
-- SELECT delete_user_simple('james.partnership@fooddelivery.com');
-- SELECT delete_user_simple('lisa.collaboration@restauranttech.com');

-- Delete admins
-- SELECT delete_user_simple('admin@yumzoom.com');
-- SELECT delete_user_simple('support@yumzoom.com');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check remaining users
-- SELECT 'User profiles remaining:' as info, COUNT(*) as count FROM user_profiles;
-- SELECT 'User ratings remaining:' as info, COUNT(*) as count FROM user_restaurant_ratings;
-- SELECT 'Auth users remaining (delete manually):' as info, COUNT(*) as count FROM auth.users;
