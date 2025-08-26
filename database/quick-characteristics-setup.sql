-- Quick check and setup for restaurant characteristics tables
-- Run this in Supabase SQL Editor to ensure everything is set up

-- Check if tables exist
SELECT 
  'Table Status Check:' as info;

SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_name IN (
  'user_restaurant_ratings',
  'restaurant_characteristics',
  'restaurant_rating_photos',
  'restaurant_rating_votes'
) AND table_schema = 'public'
ORDER BY table_name;

-- If user_restaurant_ratings table is missing, create it
CREATE TABLE IF NOT EXISTS user_restaurant_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  ambience_rating INTEGER CHECK (ambience_rating >= 1 AND ambience_rating <= 10),
  decor_rating INTEGER CHECK (decor_rating >= 1 AND decor_rating <= 10),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 10),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 10),
  noise_level_rating INTEGER CHECK (noise_level_rating >= 1 AND noise_level_rating <= 10),
  value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 10),
  food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 10),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  review_text TEXT,
  visit_date DATE,
  would_recommend BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE user_restaurant_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view all ratings" ON user_restaurant_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON user_restaurant_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON user_restaurant_ratings;

CREATE POLICY "Users can view all ratings" ON user_restaurant_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON user_restaurant_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON user_restaurant_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Check if we have test restaurants
SELECT 
  'Test Restaurants Check:' as info;

SELECT 
  id,
  name,
  cuisine_type
FROM restaurants
LIMIT 5;

-- If no restaurants exist, add test restaurants
INSERT INTO restaurants (id, name, description, address, phone, cuisine_type, image_url) VALUES
('19020f7-c74e-4477-801e-4a691040496dd', 'Bella Italia', 'Authentic Italian cuisine in the heart of the city', '123 Main St, Downtown', '(555) 123-4567', 'Italian', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'),
('rest-2', 'Sakura Sushi', 'Fresh sushi and Japanese dishes', '456 Oak Ave, Midtown', '(555) 234-5678', 'Japanese', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500'),
('rest-3', 'Taco Fiesta', 'Vibrant Mexican flavors and atmosphere', '789 Pine St, Westside', '(555) 345-6789', 'Mexican', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  cuisine_type = EXCLUDED.cuisine_type,
  image_url = EXCLUDED.image_url;

-- Final verification
SELECT 'Setup Complete! ✅' as status;

SELECT 
  'You can now test restaurant characteristics at:' as instruction;

SELECT 
  'http://localhost:3000/restaurants/' || id as test_url
FROM restaurants 
LIMIT 3;
