-- Quick Image Test Script
-- Run this to verify that restaurants have image URLs

-- Check if restaurants have image URLs
SELECT 
    name,
    cuisine_type,
    CASE 
        WHEN image_url IS NOT NULL THEN 'Has Image ✓'
        ELSE 'No Image ✗'
    END as image_status,
    CASE 
        WHEN image_url IS NOT NULL THEN LEFT(image_url, 50) || '...'
        ELSE 'NULL'
    END as image_url_preview
FROM restaurants
ORDER BY name;

-- Test specific restaurant that should have image
SELECT 
    name,
    image_url,
    LENGTH(image_url) as url_length
FROM restaurants 
WHERE name = 'Bella Italia';

-- Count total restaurants vs restaurants with images
SELECT 
    COUNT(*) as total_restaurants,
    COUNT(image_url) as restaurants_with_images,
    COUNT(*) - COUNT(image_url) as restaurants_without_images
FROM restaurants;
