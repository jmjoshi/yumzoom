-- Fix broken image URLs in sample data
-- Update restaurants with working placeholder images

UPDATE restaurants SET image_url = 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=The+Gourmet+Bistro' WHERE name = 'The Gourmet Bistro';
UPDATE restaurants SET image_url = 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Sakura+Sushi' WHERE name = 'Sakura Sushi';
UPDATE restaurants SET image_url = 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Mama+Mias' WHERE name = 'Mama Mia''s';
UPDATE restaurants SET image_url = 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Spice+Garden' WHERE name = 'Spice Garden';

-- Update menu items with working placeholder images
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Grilled+Salmon' WHERE name = 'Grilled Salmon';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Caesar+Salad' WHERE name = 'Caesar Salad';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Chocolate+Cake' WHERE name = 'Chocolate Cake';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Dragon+Roll' WHERE name = 'Dragon Roll';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Chicken+Teriyaki' WHERE name = 'Chicken Teriyaki';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Miso+Soup' WHERE name = 'Miso Soup';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Margherita+Pizza' WHERE name = 'Margherita Pizza';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Fettuccine+Alfredo' WHERE name = 'Fettuccine Alfredo';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Tiramisu' WHERE name = 'Tiramisu';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Butter+Chicken' WHERE name = 'Butter Chicken';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Samosas' WHERE name = 'Samosas';
UPDATE menu_items SET image_url = 'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Mango+Lassi' WHERE name = 'Mango Lassi';
