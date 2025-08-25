-- Fixed Test Script for Restaurant Characteristics Rating System
-- This script uses REAL user IDs from your test users
-- Run this script in Supabase SQL editor after creating test users

-- =====================================================
-- TEST 1: Verify Sample Data is Loaded
-- =====================================================

SELECT '=== TEST 1: SAMPLE DATA VERIFICATION ===' as test_section;

-- Check restaurants count
SELECT 'Restaurants loaded:' as status, COUNT(*) as count FROM restaurants;

-- Check menu items count  
SELECT 'Menu items loaded:' as status, COUNT(*) as count FROM menu_items;

-- Check user profiles
SELECT 'User profiles created:' as status, COUNT(*) as count FROM user_profiles;

-- Check existing ratings
SELECT 'Existing user ratings:' as status, COUNT(*) as count FROM user_restaurant_ratings;

-- =====================================================
-- TEST 2: Get Real User IDs and Submit Ratings
-- =====================================================

SELECT '=== TEST 2: SUBMITTING SAMPLE RATINGS WITH REAL USERS ===' as test_section;

-- Show available users
SELECT 'Available test users:' as info;
SELECT up.first_name, up.last_name, up.user_role, au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, up.first_name;

-- Submit ratings using real user IDs
DO $$
DECLARE
    bella_italia_id UUID;
    sakura_sushi_id UUID;
    taco_fiesta_id UUID;
    customer1_id UUID;
    customer2_id UUID;
    customer3_id UUID;
    restaurant_owner_id UUID;
BEGIN
    -- Get restaurant IDs
    SELECT id INTO bella_italia_id FROM restaurants WHERE name = 'Bella Italia';
    SELECT id INTO sakura_sushi_id FROM restaurants WHERE name = 'Sakura Sushi';
    SELECT id INTO taco_fiesta_id FROM restaurants WHERE name = 'Taco Fiesta';
    
    -- Get real customer user IDs
    SELECT up.id INTO customer1_id 
    FROM user_profiles up 
    JOIN auth.users au ON up.id = au.id
    WHERE up.user_role = 'customer' AND au.email LIKE 'alice.%'
    LIMIT 1;
    
    SELECT up.id INTO customer2_id 
    FROM user_profiles up 
    JOIN auth.users au ON up.id = au.id
    WHERE up.user_role = 'customer' AND au.email LIKE 'mike.%'
    LIMIT 1;
    
    SELECT up.id INTO customer3_id 
    FROM user_profiles up 
    JOIN auth.users au ON up.id = au.id
    WHERE up.user_role = 'customer' AND au.email LIKE 'sarah.%'
    LIMIT 1;
    
    -- Get a restaurant owner ID
    SELECT up.id INTO restaurant_owner_id 
    FROM user_profiles up 
    WHERE up.user_role = 'restaurant_owner'
    LIMIT 1;
    
    -- Check if we have users
    IF customer1_id IS NULL OR customer2_id IS NULL OR customer3_id IS NULL THEN
        RAISE EXCEPTION 'Could not find enough customer users. Make sure you have created the test users first.';
    END IF;
    
    RAISE NOTICE 'Using customer IDs: %, %, %', customer1_id, customer2_id, customer3_id;
    
    -- Submit ratings for Bella Italia (Customer 1 - Alice)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        customer1_id, bella_italia_id,
        4.5, 4.0, 4.2, 4.8, 3.5, 4.1, 4.7, 
        ROUND((4.5 + 4.0 + 4.2 + 4.8 + 3.5 + 4.1 + 4.7) / 7.0, 2)
    );
    
    -- Submit different ratings for Bella Italia (Customer 2 - Mike)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        customer2_id, bella_italia_id,
        4.0, 4.5, 4.0, 4.5, 4.0, 3.8, 4.5,
        ROUND((4.0 + 4.5 + 4.0 + 4.5 + 4.0 + 3.8 + 4.5) / 7.0, 2)
    );
    
    -- Submit ratings for Sakura Sushi (Customer 1 - Alice)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        customer1_id, sakura_sushi_id,
        4.8, 4.7, 4.9, 4.9, 4.2, 4.0, 4.8,
        ROUND((4.8 + 4.7 + 4.9 + 4.9 + 4.2 + 4.0 + 4.8) / 7.0, 2)
    );
    
    -- Submit ratings for Taco Fiesta (Customer 3 - Sarah)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        customer3_id, taco_fiesta_id,
        4.2, 3.8, 4.0, 4.3, 3.0, 4.5, 4.1,
        ROUND((4.2 + 3.8 + 4.0 + 4.3 + 3.0 + 4.5 + 4.1) / 7.0, 2)
    );
    
    -- Restaurant owner rating their own restaurant (if allowed)
    IF restaurant_owner_id IS NOT NULL THEN
        INSERT INTO user_restaurant_ratings (
            user_id, restaurant_id, 
            ambience_rating, decor_rating, service_rating, cleanliness_rating,
            noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
        ) VALUES (
            restaurant_owner_id, bella_italia_id,
            4.8, 4.6, 4.9, 4.9, 4.0, 4.2, 4.8,
            ROUND((4.8 + 4.6 + 4.9 + 4.9 + 4.0 + 4.2 + 4.8) / 7.0, 2)
        );
        RAISE NOTICE 'Restaurant owner rating added with ID: %', restaurant_owner_id;
    END IF;
    
    RAISE NOTICE 'Sample ratings submitted successfully!';
END $$;

-- =====================================================
-- TEST 3: Verify Rating Aggregation
-- =====================================================

SELECT '=== TEST 3: RATING AGGREGATION VERIFICATION ===' as test_section;

-- Check if aggregated characteristics were created
SELECT 'Aggregated characteristics created:' as status, COUNT(*) as count FROM restaurant_characteristics;

-- Show detailed aggregation results
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
-- TEST 4: Test API Functions
-- =====================================================

SELECT '=== TEST 4: API FUNCTIONS TESTING ===' as test_section;

-- Test get_restaurant_with_characteristics function
SELECT 'Testing get_restaurant_with_characteristics function...' as test_info;

-- Get a restaurant with characteristics (Bella Italia)
SELECT * FROM get_restaurant_with_characteristics(
    (SELECT id FROM restaurants WHERE name = 'Bella Italia')
);

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
    ROUND(AVG(overall_rating), 2) 
FROM restaurant_characteristics;

-- Final status message
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM restaurant_characteristics) > 0 
        THEN '🎉 SUCCESS: Restaurant Characteristics Rating System is working properly with real users!'
        ELSE '❌ FAILURE: No aggregated ratings found'
    END as final_status;

SELECT '=== TEST COMPLETE ===' as test_section;
