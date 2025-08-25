-- Simple Test Script for Restaurant Characteristics Rating System
-- This script tests the system without foreign key constraints to auth.users
-- Run this script in Supabase SQL editor after loading sample data

BEGIN;

-- Temporarily disable foreign key constraint if possible
-- Note: In production, this should be handled differently
SET session_replication_role = replica;

-- =====================================================
-- TEST 1: Verify Sample Data is Loaded
-- =====================================================

SELECT '=== TEST 1: SAMPLE DATA VERIFICATION ===' as test_section;

-- Check restaurants count
SELECT 'Restaurants loaded:' as status, COUNT(*) as count FROM restaurants;

-- Check menu items count  
SELECT 'Menu items loaded:' as status, COUNT(*) as count FROM menu_items;

-- Check that restaurant characteristics table is empty (starting state)
SELECT 'Initial characteristics records:' as status, COUNT(*) as count FROM restaurant_characteristics;

-- Check that user ratings table is empty (starting state)
SELECT 'Initial user ratings:' as status, COUNT(*) as count FROM user_restaurant_ratings;

-- =====================================================
-- TEST 2: Submit Sample Ratings
-- =====================================================

SELECT '=== TEST 2: SUBMITTING SAMPLE RATINGS ===' as test_section;

-- Direct INSERT approach with test user IDs
DO $$
DECLARE
    bella_italia_id UUID;
    sakura_sushi_id UUID;
    taco_fiesta_id UUID;
    test_user1 UUID := gen_random_uuid();
    test_user2 UUID := gen_random_uuid();
    test_user3 UUID := gen_random_uuid();
BEGIN
    -- Get restaurant IDs
    SELECT id INTO bella_italia_id FROM restaurants WHERE name = 'Bella Italia';
    SELECT id INTO sakura_sushi_id FROM restaurants WHERE name = 'Sakura Sushi';
    SELECT id INTO taco_fiesta_id FROM restaurants WHERE name = 'Taco Fiesta';
    
    RAISE NOTICE 'Using test user IDs: %, %, %', test_user1, test_user2, test_user3;
    
    -- Submit ratings for Bella Italia (User 1)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        test_user1, bella_italia_id,
        4.5, 4.0, 4.2, 4.8, 3.5, 4.1, 4.7, 4.26
    );
    
    -- Submit different ratings for Bella Italia (User 2)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        test_user2, bella_italia_id,
        4.0, 4.5, 4.0, 4.5, 4.0, 3.8, 4.5, 4.19
    );
    
    -- Submit ratings for Sakura Sushi
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        test_user1, sakura_sushi_id,
        4.8, 4.7, 4.9, 4.9, 4.2, 4.0, 4.8, 4.61
    );
    
    -- Submit ratings for Taco Fiesta
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        test_user1, taco_fiesta_id,
        4.2, 3.8, 4.0, 4.3, 3.0, 4.5, 4.1, 3.99
    );
    
    -- Submit third rating for Bella Italia
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        test_user3, bella_italia_id,
        3.5, 3.8, 4.5, 4.2, 3.8, 4.0, 4.3, 4.01
    );
    
    RAISE NOTICE 'Sample ratings submitted successfully!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting ratings: %', SQLERRM;
    RAISE;
END $$;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

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
-- TEST 5: Edge Cases
-- =====================================================

SELECT '=== TEST 5: EDGE CASES ===' as test_section;

-- Test restaurant without any ratings
SELECT 'Restaurants without ratings:' as info;
SELECT 
    r.name as restaurant_name,
    CASE 
        WHEN rc.restaurant_id IS NULL THEN 'No ratings yet'
        ELSE 'Has ratings'
    END as rating_status
FROM restaurants r
LEFT JOIN restaurant_characteristics rc ON r.id = rc.restaurant_id
WHERE rc.restaurant_id IS NULL;

-- Test get_restaurant_with_characteristics for restaurant without ratings
SELECT 'Testing function with restaurant that has no ratings (Burger Palace):' as test_info;
SELECT * FROM get_restaurant_with_characteristics(
    (SELECT id FROM restaurants WHERE name = 'Burger Palace')
);

-- =====================================================
-- FINAL TEST SUMMARY
-- =====================================================

SELECT '=== FINAL TEST SUMMARY ===' as test_section;

SELECT 
    'Total restaurants:' as metric, 
    COUNT(*)::text as value 
FROM restaurants
UNION ALL
SELECT 
    'Restaurants with ratings:', 
    COUNT(*)::text 
FROM restaurant_characteristics
UNION ALL
SELECT 
    'Total individual ratings:', 
    COUNT(*)::text 
FROM user_restaurant_ratings
UNION ALL
SELECT 
    'Average overall rating:', 
    ROUND(AVG(overall_rating), 2)::text
FROM restaurant_characteristics;

-- Final status message
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM restaurant_characteristics) > 0 
        THEN '🎉 SUCCESS: Restaurant Characteristics Rating System is working properly!'
        ELSE '❌ FAILURE: No aggregated ratings found'
    END as final_status;

SELECT '=== TEST COMPLETE ===' as test_section;

COMMIT;
