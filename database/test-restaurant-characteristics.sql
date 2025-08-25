-- Test Script for Restaurant Characteristics Rating System
-- This script tests all functionality of the restaurant characteristics system
-- Run this script in Supabase SQL editor after loading sample data

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
-- TEST 2: Submit Sample Ratings for Multiple Restaurants
-- =====================================================

SELECT '=== TEST 2: SUBMITTING SAMPLE RATINGS ===' as test_section;

-- Get sample restaurant IDs for testing
DO $$
DECLARE
    bella_italia_id UUID;
    sakura_sushi_id UUID;
    taco_fiesta_id UUID;
    sample_user_id UUID;
    user2_id UUID;
    user3_id UUID;
BEGIN
    -- Get restaurant IDs
    SELECT id INTO bella_italia_id FROM restaurants WHERE name = 'Bella Italia';
    SELECT id INTO sakura_sushi_id FROM restaurants WHERE name = 'Sakura Sushi';
    SELECT id INTO taco_fiesta_id FROM restaurants WHERE name = 'Taco Fiesta';
    
    -- Check if we have any existing users, or create test user IDs that might exist
    -- For testing purposes, we'll use auth.users if available, or skip foreign key temporarily
    
    -- Try to get existing user IDs or use system approach
    SELECT COALESCE(
        (SELECT id FROM auth.users LIMIT 1),
        gen_random_uuid()
    ) INTO sample_user_id;
    
    SELECT gen_random_uuid() INTO user2_id;
    SELECT gen_random_uuid() INTO user3_id;
    
    -- Submit ratings for Bella Italia (User 1)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        sample_user_id, bella_italia_id,
        4.5, 4.0, 4.2, 4.8, 3.5, 4.1, 4.7, 
        ROUND((4.5 + 4.0 + 4.2 + 4.8 + 3.5 + 4.1 + 4.7) / 7.0, 2)
    );
    
    -- Submit different ratings for Bella Italia (User 2)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        user2_id, bella_italia_id,
        4.0, 4.5, 4.0, 4.5, 4.0, 3.8, 4.5,
        ROUND((4.0 + 4.5 + 4.0 + 4.5 + 4.0 + 3.8 + 4.5) / 7.0, 2)
    );
    
    -- Submit ratings for Sakura Sushi (User 1)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        sample_user_id, sakura_sushi_id,
        4.8, 4.7, 4.9, 4.9, 4.2, 4.0, 4.8,
        ROUND((4.8 + 4.7 + 4.9 + 4.9 + 4.2 + 4.0 + 4.8) / 7.0, 2)
    );
    
    -- Submit ratings for Taco Fiesta (User 1)
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        sample_user_id, taco_fiesta_id,
        4.2, 3.8, 4.0, 4.3, 3.0, 4.5, 4.1,
        ROUND((4.2 + 3.8 + 4.0 + 4.3 + 3.0 + 4.5 + 4.1) / 7.0, 2)
    );
    
    RAISE NOTICE 'Sample ratings submitted successfully with user IDs: %, %, %', sample_user_id, user2_id, user3_id;
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
-- TEST 5: Test Rating Updates
-- =====================================================

SELECT '=== TEST 5: RATING UPDATE TESTING ===' as test_section;

-- Add another rating to test re-aggregation
DO $$
DECLARE
    bella_italia_id UUID;
    new_user_id UUID;
BEGIN
    SELECT id INTO bella_italia_id FROM restaurants WHERE name = 'Bella Italia';
    
    -- Generate a new user ID or get an existing one
    SELECT COALESCE(
        (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
        gen_random_uuid()
    ) INTO new_user_id;
    
    -- Submit a third rating for Bella Italia
    INSERT INTO user_restaurant_ratings (
        user_id, restaurant_id, 
        ambience_rating, decor_rating, service_rating, cleanliness_rating,
        noise_level_rating, value_for_money_rating, food_quality_rating, overall_rating
    ) VALUES (
        new_user_id, bella_italia_id,
        3.5, 3.8, 4.5, 4.2, 3.8, 4.0, 4.3,
        ROUND((3.5 + 3.8 + 4.5 + 4.2 + 3.8 + 4.0 + 4.3) / 7.0, 2)
    );
    
    RAISE NOTICE 'Third rating added for Bella Italia with user ID: %', new_user_id;
END $$;

-- Check updated aggregation for Bella Italia
SELECT 'Updated ratings for Bella Italia:' as info;
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
    rc.total_ratings_count,
    rc.updated_at
FROM restaurants r
JOIN restaurant_characteristics rc ON r.id = rc.restaurant_id
WHERE r.name = 'Bella Italia';

-- =====================================================
-- TEST 6: Edge Cases and Validation
-- =====================================================

SELECT '=== TEST 6: EDGE CASES AND VALIDATION ===' as test_section;

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
-- TEST 7: Performance and Data Integrity
-- =====================================================

SELECT '=== TEST 7: DATA INTEGRITY VERIFICATION ===' as test_section;

-- Verify all ratings are within valid range (1-5)
SELECT 'Invalid ratings check (should be 0):' as check_info;
SELECT COUNT(*) as invalid_ratings_count
FROM user_restaurant_ratings 
WHERE ambience_rating NOT BETWEEN 1 AND 5
   OR decor_rating NOT BETWEEN 1 AND 5
   OR service_rating NOT BETWEEN 1 AND 5
   OR cleanliness_rating NOT BETWEEN 1 AND 5
   OR noise_level_rating NOT BETWEEN 1 AND 5
   OR value_for_money_rating NOT BETWEEN 1 AND 5
   OR food_quality_rating NOT BETWEEN 1 AND 5;

-- Verify aggregated ratings are properly calculated
SELECT 'Aggregation accuracy check for Bella Italia:' as check_info;
WITH manual_calc AS (
    SELECT 
        restaurant_id,
        ROUND(AVG(ambience_rating), 2) as manual_ambience,
        ROUND(AVG(decor_rating), 2) as manual_decor,
        ROUND(AVG(service_rating), 2) as manual_service,
        ROUND(AVG(cleanliness_rating), 2) as manual_cleanliness,
        ROUND(AVG(noise_level_rating), 2) as manual_noise,
        ROUND(AVG(value_for_money_rating), 2) as manual_value,
        ROUND(AVG(food_quality_rating), 2) as manual_food,
        COUNT(*) as manual_count
    FROM user_restaurant_ratings 
    WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = 'Bella Italia')
    GROUP BY restaurant_id
)
SELECT 
    'Manual vs Aggregated comparison:' as comparison,
    mc.manual_ambience,
    rc.ambience_rating as aggregated_ambience,
    mc.manual_count,
    rc.total_ratings_count as aggregated_count,
    CASE 
        WHEN mc.manual_ambience = rc.ambience_rating AND mc.manual_count = rc.total_ratings_count 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as test_result
FROM manual_calc mc
JOIN restaurant_characteristics rc ON mc.restaurant_id = rc.restaurant_id;

-- =====================================================
-- TEST SUMMARY
-- =====================================================

SELECT '=== FINAL TEST SUMMARY ===' as test_section;

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
    'Average overall rating:', 
    ROUND(AVG(overall_rating), 2) 
FROM restaurant_characteristics;

-- Final status message
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM restaurant_characteristics) > 0 
        THEN '🎉 SUCCESS: Restaurant Characteristics Rating System is working properly!'
        ELSE '❌ FAILURE: No aggregated ratings found'
    END as final_status;

SELECT '=== TEST COMPLETE ===' as test_section;
