-- Simple Sample Data for YumZoom - Fixed Version
-- This version only uses basic columns that should exist

-- First, let's check what columns exist in the restaurants table
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurants';

-- Add restaurants with minimal required columns
INSERT INTO restaurants (name, description, address, cuisine_type) VALUES
('Bella Italia', 'Authentic Italian restaurant with fresh pasta and wood-fired pizzas', '123 Main Street, Downtown', 'Italian'),
('Sakura Sushi', 'Premium sushi restaurant with fresh fish and traditional Japanese atmosphere', '456 Oak Avenue, Midtown', 'Japanese'),
('Taco Fiesta', 'Vibrant Mexican cantina with authentic street tacos and fresh margaritas', '789 Pine Road, Westside', 'Mexican'),
('The Green Garden', 'Farm-to-table vegetarian restaurant with organic ingredients', '321 Elm Street, Eastside', 'Vegetarian'),
('Burger Palace', 'Gourmet burger joint with craft beer and loaded fries', '654 Maple Lane, Northside', 'American'),
('Spice Route', 'Authentic Indian cuisine with traditional spices and tandoor specialties', '987 Cedar Way, Southside', 'Indian')
ON CONFLICT (name) DO NOTHING;

-- Simple menu items (if menu_items table exists)
-- Check if menu_items table exists first
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'menu_items';

-- Add basic menu items
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, name, description, price, category
FROM restaurants r,
(VALUES 
    ('Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 16.99, 'Pizza'),
    ('Spaghetti Carbonara', 'Traditional Roman pasta with eggs, cheese, and pancetta', 18.99, 'Pasta'),
    ('Caesar Salad', 'Crisp romaine lettuce with parmesan and house-made croutons', 12.99, 'Salad')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Bella Italia'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, name, description, price, category
FROM restaurants r,
(VALUES 
    ('Salmon Sashimi', 'Fresh Atlantic salmon, 6 pieces', 18.99, 'Sashimi'),
    ('Dragon Roll', 'Shrimp tempura and avocado topped with eel and spicy mayo', 24.99, 'Specialty Roll'),
    ('Miso Soup', 'Traditional soybean paste soup with tofu and wakame', 4.99, 'Soup')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Sakura Sushi'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, name, description, price, category
FROM restaurants r,
(VALUES 
    ('Street Tacos (3)', 'Authentic corn tortillas with choice of carnitas, chicken, or beef', 12.99, 'Tacos'),
    ('Guacamole & Chips', 'Fresh avocado dip with house-made tortilla chips', 9.99, 'Appetizer'),
    ('Classic Margarita', 'Tequila, lime juice, and triple sec with salt rim', 11.99, 'Beverage')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Taco Fiesta'
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 
    r.name as restaurant_name,
    COUNT(mi.id) as menu_items_count
FROM restaurants r
LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
GROUP BY r.id, r.name
ORDER BY r.name;
