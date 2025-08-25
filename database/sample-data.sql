-- Sample Data for YumZoom - Restaurants and Menu Items
-- Run this after the restaurant characteristics schema is in place

-- First, let's check what restaurants exist
-- SELECT * FROM restaurants;

-- Sample restaurants (if your restaurants table is empty)
INSERT INTO restaurants (name, description, address, phone, website, cuisine_type, image_url, price_range, hours) VALUES
('Bella Italia', 'Authentic Italian restaurant with fresh pasta and wood-fired pizzas', '123 Main Street, Downtown', '555-0101', 'https://bellaitalia.com', 'Italian', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500', 2, '11:00 AM - 10:00 PM'),
('Sakura Sushi', 'Premium sushi restaurant with fresh fish and traditional Japanese atmosphere', '456 Oak Avenue, Midtown', '555-0102', 'https://sakurasushi.com', 'Japanese', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500', 3, '5:00 PM - 11:00 PM'),
('Taco Fiesta', 'Vibrant Mexican cantina with authentic street tacos and fresh margaritas', '789 Pine Road, Westside', '555-0103', 'https://tacofiesta.com', 'Mexican', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500', 1, '11:00 AM - 12:00 AM'),
('The Green Garden', 'Farm-to-table vegetarian restaurant with organic ingredients', '321 Elm Street, Eastside', '555-0104', 'https://greengarden.com', 'Vegetarian', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 2, '8:00 AM - 9:00 PM'),
('Burger Palace', 'Gourmet burger joint with craft beer and loaded fries', '654 Maple Lane, Northside', '555-0105', 'https://burgerpalace.com', 'American', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 2, '11:00 AM - 11:00 PM'),
('Spice Route', 'Authentic Indian cuisine with traditional spices and tandoor specialties', '987 Cedar Way, Southside', '555-0106', 'https://spiceroute.com', 'Indian', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500', 2, '12:00 PM - 10:00 PM')
ON CONFLICT (name) DO NOTHING;

-- Sample menu items for each restaurant
-- Get restaurant IDs first, then insert menu items

-- Menu items for Bella Italia (Italian)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 16.99, 'Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300', true, '{"vegetarian": true}'),
    ('Spaghetti Carbonara', 'Traditional Roman pasta with eggs, cheese, and pancetta', 18.99, 'Pasta', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300', true, '{}'),
    ('Chicken Parmigiana', 'Breaded chicken breast with marinara sauce and melted cheese', 22.99, 'Main Course', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300', true, '{}'),
    ('Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 8.99, 'Dessert', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300', true, '{"vegetarian": true}'),
    ('Caesar Salad', 'Crisp romaine lettuce with parmesan and house-made croutons', 12.99, 'Salad', 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=300', true, '{"vegetarian": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'Bella Italia';

-- Menu items for Sakura Sushi (Japanese)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Salmon Sashimi', 'Fresh Atlantic salmon, 6 pieces', 18.99, 'Sashimi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300', true, '{"gluten_free": true}'),
    ('Dragon Roll', 'Shrimp tempura and avocado topped with eel and spicy mayo', 24.99, 'Specialty Roll', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300', true, '{}'),
    ('Chicken Teriyaki', 'Grilled chicken with teriyaki sauce and steamed rice', 19.99, 'Entree', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300', true, '{}'),
    ('Miso Soup', 'Traditional soybean paste soup with tofu and wakame', 4.99, 'Soup', 'https://images.unsplash.com/photo-1603729362604-fee870bb3493?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Green Tea Ice Cream', 'House-made matcha ice cream', 6.99, 'Dessert', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300', true, '{"vegetarian": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'Sakura Sushi';

-- Menu items for Taco Fiesta (Mexican)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Street Tacos (3)', 'Authentic corn tortillas with choice of carnitas, chicken, or beef', 12.99, 'Tacos', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300', true, '{}'),
    ('Guacamole & Chips', 'Fresh avocado dip with house-made tortilla chips', 9.99, 'Appetizer', 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Chicken Quesadilla', 'Grilled flour tortilla with chicken and melted cheese', 14.99, 'Entree', 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=300', true, '{}'),
    ('Churros', 'Fried dough pastry with cinnamon sugar and chocolate sauce', 7.99, 'Dessert', 'https://images.unsplash.com/photo-1509459436294-0bdc6c6d7e9e?w=300', true, '{"vegetarian": true}'),
    ('Classic Margarita', 'Tequila, lime juice, and triple sec with salt rim', 11.99, 'Beverage', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300', true, '{"vegan": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'Taco Fiesta';

-- Menu items for The Green Garden (Vegetarian)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Quinoa Buddha Bowl', 'Organic quinoa with roasted vegetables and tahini dressing', 16.99, 'Bowl', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300', true, '{"vegetarian": true, "vegan": true, "gluten_free": true}'),
    ('Mushroom Risotto', 'Creamy arborio rice with wild mushrooms and truffle oil', 19.99, 'Entree', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300', true, '{"vegetarian": true}'),
    ('Avocado Toast', 'Multigrain bread topped with smashed avocado and hemp seeds', 11.99, 'Breakfast', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Green Smoothie', 'Spinach, banana, mango, and coconut water', 8.99, 'Beverage', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Raw Chocolate Cake', 'Date and nut base with cashew cream frosting', 9.99, 'Dessert', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300', true, '{"vegetarian": true, "vegan": true, "raw": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'The Green Garden';

-- Menu items for Burger Palace (American)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Classic Cheeseburger', 'Beef patty with cheddar, lettuce, tomato, and special sauce', 15.99, 'Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', true, '{}'),
    ('BBQ Bacon Burger', 'Double beef patty with bacon, onion rings, and BBQ sauce', 18.99, 'Burger', 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=300', true, '{}'),
    ('Loaded Fries', 'Crispy fries topped with cheese, bacon, and sour cream', 9.99, 'Side', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', true, '{}'),
    ('Buffalo Wings (8)', 'Spicy chicken wings with blue cheese dipping sauce', 13.99, 'Appetizer', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300', true, '{}'),
    ('Chocolate Milkshake', 'Thick vanilla ice cream blended with chocolate syrup', 6.99, 'Beverage', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300', true, '{"vegetarian": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'Burger Palace';

-- Menu items for Spice Route (Indian)
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available, dietary_info) 
SELECT r.id, name, description, price, category, image_url, is_available, dietary_info
FROM restaurants r,
(VALUES 
    ('Chicken Tikka Masala', 'Tender chicken in creamy tomato curry sauce', 18.99, 'Curry', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300', true, '{}'),
    ('Vegetable Biryani', 'Fragrant basmati rice with mixed vegetables and spices', 16.99, 'Rice', 'https://images.unsplash.com/photo-1563379091339-03246963d13a?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Garlic Naan', 'Fresh baked bread with garlic and cilantro', 4.99, 'Bread', 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=300', true, '{"vegetarian": true}'),
    ('Samosas (2)', 'Crispy pastries filled with spiced potatoes and peas', 7.99, 'Appetizer', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300', true, '{"vegetarian": true, "vegan": true}'),
    ('Mango Lassi', 'Creamy yogurt drink with sweet mango puree', 5.99, 'Beverage', 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=300', true, '{"vegetarian": true}')
) AS menu_data(name, description, price, category, image_url, is_available, dietary_info)
WHERE r.name = 'Spice Route';

-- Verify the data was inserted
SELECT 
    r.name as restaurant_name,
    COUNT(mi.id) as menu_items_count,
    AVG(mi.price) as avg_price
FROM restaurants r
LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
GROUP BY r.id, r.name
ORDER BY r.name;
