-- Fix Taco Fiesta Image
-- This script updates Taco Fiesta with a different, working image URL

-- Check current Taco Fiesta image URL
SELECT name, image_url, cuisine_type 
FROM restaurants 
WHERE name = 'Taco Fiesta';

-- Update Taco Fiesta with a different Mexican food image that should work better
UPDATE restaurants 
SET image_url = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Taco Fiesta';

-- Alternative image URLs for Taco Fiesta (in case the first one doesn't work)
-- UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&h=600&fit=crop&crop=center' WHERE name = 'Taco Fiesta';
-- UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&h=600&fit=crop&crop=center' WHERE name = 'Taco Fiesta';

-- Verify the update
SELECT name, image_url, cuisine_type 
FROM restaurants 
WHERE name = 'Taco Fiesta';
