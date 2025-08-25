-- Reset and Populate Sample Data for YumZoom
-- This script clears all existing data and adds fresh sample data
-- Run this script in Supabase SQL editor

-- WARNING: This will DELETE ALL DATA in the following tables
-- Make sure you want to proceed before running this script

BEGIN;

-- Step 1: Clear all existing data (in proper order to respect foreign keys)
DELETE FROM user_restaurant_ratings;
DELETE FROM restaurant_characteristics;
DELETE FROM menu_items;
DELETE FROM restaurants;

-- Step 2: Reset sequences (if any)
-- This ensures IDs start from 1 again
-- ALTER SEQUENCE restaurants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;

-- Step 3: Insert fresh restaurant data
INSERT INTO restaurants (name, description, address, cuisine_type) VALUES
('Bella Italia', 'Authentic Italian restaurant with fresh pasta and wood-fired pizzas made in our traditional brick oven', '123 Main Street, Downtown', 'Italian'),

('Sakura Sushi', 'Premium sushi restaurant with fresh fish flown in daily and traditional Japanese atmosphere', '456 Oak Avenue, Midtown', 'Japanese'),

('Taco Fiesta', 'Vibrant Mexican cantina with authentic street tacos and fresh margaritas made with premium tequila', '789 Pine Road, Westside', 'Mexican'),

('The Green Garden', 'Farm-to-table vegetarian restaurant featuring organic ingredients sourced from local farms', '321 Elm Street, Eastside', 'Vegetarian'),

('Burger Palace', 'Gourmet burger joint with grass-fed beef, craft beer, and hand-cut fries', '654 Maple Lane, Northside', 'American'),

('Spice Route', 'Authentic Indian cuisine with traditional spices imported from India and tandoor specialties', '987 Cedar Way, Southside', 'Indian'),

('Ocean''s Bounty', 'Fresh seafood restaurant with daily catch and coastal atmosphere', '159 Harbor Street, Waterfront', 'Seafood'),

('Café Parisien', 'Charming French bistro with classic dishes and extensive wine selection', '246 Boulevard Lane, Historic District', 'French');

-- Step 4: Insert comprehensive menu items for each restaurant

-- Bella Italia Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Margherita Pizza', 'Classic Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, and basil', 18.99, 'Pizza'),
    ('Pepperoni Pizza', 'Traditional pizza with spicy pepperoni and mozzarella cheese', 20.99, 'Pizza'),
    ('Spaghetti Carbonara', 'Traditional Roman pasta with eggs, pecorino cheese, pancetta, and black pepper', 22.99, 'Pasta'),
    ('Fettuccine Alfredo', 'Fresh fettuccine with creamy parmesan sauce', 21.99, 'Pasta'),
    ('Caesar Salad', 'Crisp romaine lettuce with parmesan, croutons, and house-made dressing', 14.99, 'Salad'),
    ('Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 8.99, 'Dessert'),
    ('Bruschetta', 'Grilled bread topped with fresh tomatoes, garlic, and basil', 12.99, 'Appetizer')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Bella Italia';

-- Sakura Sushi Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Salmon Sashimi (6pc)', 'Fresh Atlantic salmon, expertly sliced', 24.99, 'Sashimi'),
    ('Tuna Sashimi (6pc)', 'Premium yellowfin tuna', 26.99, 'Sashimi'),
    ('Dragon Roll', 'Shrimp tempura and avocado topped with eel and spicy mayo', 28.99, 'Specialty Roll'),
    ('California Roll', 'Crab, avocado, and cucumber roll', 16.99, 'Classic Roll'),
    ('Miso Soup', 'Traditional soybean paste soup with tofu and wakame', 6.99, 'Soup'),
    ('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze and steamed rice', 19.99, 'Entree'),
    ('Gyoza (5pc)', 'Pan-fried pork dumplings with dipping sauce', 12.99, 'Appetizer')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Sakura Sushi';

-- Taco Fiesta Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Street Tacos (3pc)', 'Authentic corn tortillas with choice of carnitas, chicken, or beef', 14.99, 'Tacos'),
    ('Fish Tacos (2pc)', 'Grilled mahi-mahi with cabbage slaw and chipotle mayo', 16.99, 'Tacos'),
    ('Guacamole & Chips', 'Fresh avocado dip with house-made tortilla chips', 11.99, 'Appetizer'),
    ('Queso Fundido', 'Melted cheese with chorizo and peppers', 13.99, 'Appetizer'),
    ('Classic Margarita', 'Premium tequila, lime juice, and triple sec with salt rim', 12.99, 'Beverage'),
    ('Burrito Bowl', 'Choice of protein with rice, beans, salsa, and toppings', 15.99, 'Bowl'),
    ('Churros', 'Fried pastry with cinnamon sugar and chocolate sauce', 7.99, 'Dessert')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Taco Fiesta';

-- The Green Garden Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Quinoa Buddha Bowl', 'Quinoa with roasted vegetables, avocado, and tahini dressing', 17.99, 'Bowl'),
    ('Impossible Burger', 'Plant-based burger with vegan cheese and sweet potato fries', 19.99, 'Burger'),
    ('Kale Caesar Salad', 'Massaged kale with vegan caesar dressing and hemp seeds', 15.99, 'Salad'),
    ('Mushroom Risotto', 'Creamy arborio rice with wild mushrooms and truffle oil', 21.99, 'Entree'),
    ('Raw Chocolate Tart', 'Dairy-free chocolate tart with fresh berries', 9.99, 'Dessert'),
    ('Fresh Pressed Juice', 'Choice of green, carrot, or beet juice blends', 8.99, 'Beverage'),
    ('Hummus Platter', 'House-made hummus with vegetables and pita bread', 12.99, 'Appetizer')
) AS menu_data(name, description, price, category)
WHERE r.name = 'The Green Garden';

-- Burger Palace Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Classic Cheeseburger', 'Grass-fed beef with cheddar, lettuce, tomato, and special sauce', 16.99, 'Burger'),
    ('BBQ Bacon Burger', 'Beef patty with bacon, BBQ sauce, and onion rings', 19.99, 'Burger'),
    ('Loaded Fries', 'Hand-cut fries with cheese, bacon, and green onions', 11.99, 'Side'),
    ('Craft Beer Flight', 'Selection of 4 local craft beers (4oz each)', 14.99, 'Beverage'),
    ('Chicken Wings (8pc)', 'Buffalo, BBQ, or dry rub wings with ranch or blue cheese', 13.99, 'Appetizer'),
    ('Milkshake', 'Vanilla, chocolate, or strawberry with whipped cream', 6.99, 'Beverage'),
    ('Onion Rings', 'Beer-battered onion rings with spicy mayo', 8.99, 'Side')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Burger Palace';

-- Spice Route Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Chicken Tikka Masala', 'Tender chicken in creamy tomato-based curry sauce', 18.99, 'Curry'),
    ('Lamb Vindaloo', 'Spicy lamb curry with potatoes in traditional Goan sauce', 22.99, 'Curry'),
    ('Tandoori Chicken', 'Marinated chicken cooked in clay oven with aromatic spices', 19.99, 'Tandoori'),
    ('Garlic Naan', 'Fresh-baked bread with garlic and herbs', 4.99, 'Bread'),
    ('Biryani', 'Fragrant basmati rice with choice of chicken, lamb, or vegetables', 17.99, 'Rice'),
    ('Samosas (3pc)', 'Crispy pastries filled with spiced potatoes and peas', 8.99, 'Appetizer'),
    ('Mango Lassi', 'Creamy yogurt drink with fresh mango', 5.99, 'Beverage')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Spice Route';

-- Ocean's Bounty Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Grilled Salmon', 'Atlantic salmon with lemon herb butter and seasonal vegetables', 26.99, 'Entree'),
    ('Fish & Chips', 'Beer-battered cod with hand-cut fries and mushy peas', 18.99, 'Entree'),
    ('Seafood Chowder', 'Creamy soup with fresh fish, shrimp, and clams', 12.99, 'Soup'),
    ('Lobster Roll', 'Fresh lobster meat with mayo on a toasted bun', 28.99, 'Sandwich'),
    ('Oysters (6pc)', 'Fresh local oysters with mignonette and cocktail sauce', 18.99, 'Appetizer'),
    ('Crab Cakes', 'Pan-seared crab cakes with remoulade sauce', 16.99, 'Appetizer'),
    ('Key Lime Pie', 'Tangy lime custard with graham cracker crust', 7.99, 'Dessert')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Ocean''s Bounty';

-- Café Parisien Menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
SELECT r.id, menu_data.name, menu_data.description, menu_data.price, menu_data.category
FROM restaurants r,
(VALUES 
    ('Coq au Vin', 'Braised chicken in red wine with mushrooms and pearl onions', 28.99, 'Entree'),
    ('Beef Bourguignon', 'Slow-braised beef in red wine with vegetables', 32.99, 'Entree'),
    ('French Onion Soup', 'Classic soup with caramelized onions and gruyere cheese', 11.99, 'Soup'),
    ('Escargot (6pc)', 'Burgundy snails with garlic herb butter', 16.99, 'Appetizer'),
    ('Crème Brûlée', 'Vanilla custard with caramelized sugar crust', 9.99, 'Dessert'),
    ('Wine Pairing', 'Sommelier-selected wine to complement your meal', 12.99, 'Beverage'),
    ('Cheese Plate', 'Selection of French cheeses with crackers and fruit', 19.99, 'Appetizer')
) AS menu_data(name, description, price, category)
WHERE r.name = 'Café Parisien';

-- Step 5: Verify the data insertion
SELECT 
    r.name as restaurant_name,
    r.cuisine_type,
    COUNT(mi.id) as menu_items_count
FROM restaurants r
LEFT JOIN menu_items mi ON r.id = mi.restaurant_id
GROUP BY r.id, r.name, r.cuisine_type
ORDER BY r.name;

-- Step 6: Show sample of menu items
SELECT 
    r.name as restaurant_name,
    mi.name as item_name,
    mi.category,
    mi.price
FROM restaurants r
JOIN menu_items mi ON r.id = mi.restaurant_id
ORDER BY r.name, mi.category, mi.name
LIMIT 20;

COMMIT;

-- Success message
SELECT 'Database reset complete! ' || COUNT(*) || ' restaurants and ' || 
       (SELECT COUNT(*) FROM menu_items) || ' menu items added.' as result
FROM restaurants;
