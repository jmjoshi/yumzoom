-- Ultra-Simplified Test Script for Restaurant Characteristics Rating System
-- This script focuses on the core functionality without complex loops

-- =====================================================
-- TEST 1: Verify Sample Data is Loaded
-- =====================================================

SELECT '=== TEST 1: SAMPLE DATA VERIFICATION ===' as test_section;

-- Check restaurants count
SELECT 'Restaurants loaded:' as status, COUNT(*) as count FROM restaurants;

-- Check user profiles
SELECT 'User profiles created:' as status, COUNT(*) as count FROM user_profiles;

-- Check existing ratings
SELECT 'Existing user ratings:' as status, COUNT(*) as count FROM user_restaurant_ratings;

-- =====================================================
-- TEST 2: Show Available Data
-- =====================================================

SELECT '=== TEST 2: AVAILABLE DATA ===' as test_section;

-- Show available users
SELECT 'Available test users:' as info;
SELECT up.first_name, up.last_name, up.user_role, au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, up.first_name;

-- Show available restaurants
SELECT 'Available restaurants:' as info;
SELECT name, cuisine_type FROM restaurants ORDER BY name;

-- =====================================================
-- TEST 3: Submit Sample Ratings with Real Users
-- =====================================================

SELECT '=== TEST 3: SUBMITTING SAMPLE RATINGS ===' as test_section;

-- Submit ratings using a simpler approach
DO $$
DECLARE
    restaurant1_id UUID;
    restaurant2_id UUID;
    customer1_id UUID;
    customer2_id UUID;
    customer3_id UUID;
BEGIN
    -- Get any available restaurant IDs
    SELECT id INTO restaurant1_id FROM restaurants LIMIT 1;
    SELECT id INTO restaurant2_id FROM restaurants LIMIT 1 OFFSET 1;
    
    -- Get any available customer user IDs
    SELECT up.id INTO customer1_id 
    FROM user_profiles up 
    WHERE up.user_role = 'customer'
    LIMIT 1;
    
    SELECT up.id INTO customer2_id 
    FROM user_profiles up 
    WHERE up.user_role = 'customer'
    LIMIT 1 OFFSET 1;
    
    SELECT up.id INTO customer3_id 
    FROM user_profiles up 
    WHERE up.user_role = 'customer'
    LIMIT 1 OFFSET 2;
    
    -- Check if we have what we need
    IF restaurant1_id IS NULL THEN
        RAISE EXCEPTION 'No restaurants found in database';
    END IF;
    
    IF customer1_id IS NULL THEN
        RAISE EXCEPTION 'No customer users found in database';
    END IF;
    
    RAISE NOTICE 'Using restaurant ID: %', restaurant1_id;
    RAISE NOTICE 'Using customer IDs: %, %, %', customer1_id, customer2_id, customer3_id;
    
    -- Submit first rating
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        customer1_id, restaurant1_id,
        4.5, 4.0, 4.2, 4.8, 3.5, 4.1, 4.7, 
        ROUND((4.5 + 4.0 + 4.2 + 4.8 + 3.5 + 4.1 + 4.7) / 7.0, 2)
    );
    RAISE NOTICE 'Rating 1 submitted successfully!';
    
    -- Submit second rating if we have a second customer
    IF customer2_id IS NOT NULL THEN
        INSERT INTO user_restaurant_ratings (
            user_id, restaurant_id, 
            ambience_rating, decor_rating, service_rating, cleanliness_rating,
            noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
        ) VALUES (
            customer2_id, restaurant1_id,
            4.0, 4.5, 4.0, 4.5, 4.0, 3.8, 4.5,
            ROUND((4.0 + 4.5 + 4.0 + 4.5 + 4.0 + 3.8 + 4.5) / 7.0, 2)
        );
        RAISE NOTICE 'Rating 2 submitted successfully!';
    END IF;
    
    -- Submit third rating if we have a second restaurant and third customer
    IF restaurant2_id IS NOT NULL AND customer3_id IS NOT NULL THEN
        INSERT INTO user_restaurant_ratings (
            user_id, restaurant_id, 
            ambience_rating, decor_rating, service_rating, cleanliness_rating,
            noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
        ) VALUES (
            customer3_id, restaurant2_id,
            4.8, 4.7, 4.9, 4.9, 4.2, 4.0, 4.8,
            ROUND((4.8 + 4.7 + 4.9 + 4.9 + 4.2 + 4.0 + 4.8) / 7.0, 2)
        );
        RAISE NOTICE 'Rating 3 submitted successfully!';
    END IF;
    
    RAISE NOTICE 'Sample ratings submission completed!';
END $$;

-- =====================================================
-- TEST 4: Verify Rating Aggregation
-- =====================================================

SELECT '=== TEST 4: RATING AGGREGATION VERIFICATION ===' as test_section;

-- Check if aggregated characteristics were created
SELECT 'Aggregated characteristics created:' as status, COUNT(*) as count FROM restaurant_characteristics;

-- Show detailed aggregation results if any exist
SELECT 
    r.name as restaurant_name,
    rc.ambience_rating,
    rc.decor_rating,
    rc.service_rating,
    rc.cleanliness_rating,
    rc.noise_level_rating,
    rc.value_for_money_rating,
    rc.food_quality_rating,
    rc.overall_rating,
    rc.total_ratings_count
FROM restaurants r
JOIN restaurant_characteristics rc ON r.id = rc.restaurant_id
ORDER BY r.name;

-- =====================================================
-- TEST 5: Show User Ratings with Names
-- =====================================================

SELECT '=== TEST 5: USER RATINGS WITH REAL NAMES ===' as test_section;

-- Show all ratings with user names
SELECT 
    up.first_name || ' ' || up.last_name as user_name,
    up.user_role,
    au.email,
    r.name as restaurant_name,
    urr.ambience_rating,
    urr.decor_rating,
    urr.service_rating,
    urr.cleanliness_rating,
    urr.noise_level_rating,
    urr.value_for_money_rating,
    urr.food_quality_rating,
    urr.overall_rating,
    urr.created_at
FROM user_restaurant_ratings urr
JOIN user_profiles up ON urr.user_id = up.id
JOIN auth.users au ON up.id = au.id
JOIN restaurants r ON urr.restaurant_id = r.id
ORDER BY r.name, up.first_name;

-- =====================================================
-- TEST 6: Final Verification
-- =====================================================

SELECT '=== TEST 6: SYSTEM VERIFICATION ===' as test_section;

-- Final summary
SELECT 
    'Total restaurants:' as metric, 
    COUNT(*) as value 
FROM restaurants
UNION ALL
SELECT 
    'Restaurants with ratings:', 
    COUNT(*) 
FROM restaurant_characteristics
UNION ALL
SELECT 
    'Total individual ratings:', 
    COUNT(*) 
FROM user_restaurant_ratings
UNION ALL
SELECT 
    'Total test users:', 
    COUNT(*) 
FROM user_profiles
UNION ALL
SELECT 
    'Average overall rating:', 
    COALESCE(ROUND(AVG(overall_rating), 2), 0) 
FROM restaurant_characteristics;

-- Final status message
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM restaurant_characteristics) > 0 
        THEN '🎉 SUCCESS: Restaurant Characteristics Rating System is working properly with real users!'
        ELSE '❌ PARTIAL SUCCESS: Ratings submitted but no aggregated characteristics found. Check if triggers are working.'
    END as final_status;

SELECT '=== TEST COMPLETE ===' as test_section;
