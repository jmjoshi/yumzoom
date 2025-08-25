-- Add Restaurant Images Script
-- This script adds image URLs to existing restaurants in the database

-- Update restaurants with high-quality food images from Unsplash

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Bella Italia';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Sakura Sushi';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Taco Fiesta';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'The Green Garden';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Burger Palace';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Spice Route';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Ocean''s Bounty';

UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop&crop=center' 
WHERE name = 'Café Parisien';

-- Verify the updates
SELECT name, image_url, cuisine_type 
FROM restaurants 
WHERE image_url IS NOT NULL
ORDER BY name;

-- Count restaurants with and without images
SELECT 
    CASE 
        WHEN image_url IS NOT NULL THEN 'With Image'
        ELSE 'Without Image'
    END as image_status,
    COUNT(*) as count
FROM restaurants
GROUP BY CASE 
    WHEN image_url IS NOT NULL THEN 'With Image'
    ELSE 'Without Image'
END;
