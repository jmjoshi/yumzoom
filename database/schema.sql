-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_mobile text,
    phone_home text,
    phone_work text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Family members table
CREATE TABLE family_members (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurants table
CREATE TABLE restaurants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    address text,
    phone text,
    website text,
    cuisine_type text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu items table
CREATE TABLE menu_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    price decimal(10,2),
    category text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ratings table
CREATE TABLE ratings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, menu_item_id, family_member_id)
);

-- Create indexes for better performance
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_menu_item_id ON ratings(menu_item_id);
CREATE INDEX idx_ratings_family_member_id ON ratings(family_member_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Family members policies
CREATE POLICY "Users can view their own family members" ON family_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" ON family_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON family_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON family_members
    FOR DELETE USING (auth.uid() = user_id);

-- Restaurants policies (public read access)
CREATE POLICY "Anyone can view restaurants" ON restaurants
    FOR SELECT USING (true);

-- Menu items policies (public read access)
CREATE POLICY "Anyone can view menu items" ON menu_items
    FOR SELECT USING (true);

-- Ratings policies
CREATE POLICY "Users can view their own ratings" ON ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name, phone_mobile, phone_home, phone_work)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone_mobile', ''),
        COALESCE(new.raw_user_meta_data->>'phone_home', ''),
        COALESCE(new.raw_user_meta_data->>'phone_work', '')
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sample data for testing
INSERT INTO restaurants (name, description, address, phone, cuisine_type, image_url) VALUES
('The Gourmet Bistro', 'Fine dining with a modern twist on classic dishes', '123 Main St, Anytown, ST 12345', '(555) 123-4567', 'American', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'),
('Sakura Sushi', 'Authentic Japanese cuisine and fresh sushi', '456 Oak Ave, Anytown, ST 12345', '(555) 234-5678', 'Japanese', 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d'),
('Mama Mia''s', 'Traditional Italian family recipes', '789 Pine St, Anytown, ST 12345', '(555) 345-6789', 'Italian', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0'),
('Spice Garden', 'Aromatic Indian cuisine with vegetarian options', '321 Elm St, Anytown, ST 12345', '(555) 456-7890', 'Indian', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641');

-- Sample menu items
INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) 
SELECT 
    r.id,
    item.name,
    item.description,
    item.price,
    item.category,
    item.image_url
FROM restaurants r
CROSS JOIN (
    VALUES 
    ('Grilled Salmon', 'Fresh Atlantic salmon with lemon butter sauce', 28.99, 'Main Courses', 'https://images.unsplash.com/photo-1485704686097-ed47f7263ca4'),
    ('Caesar Salad', 'Crisp romaine lettuce with parmesan and croutons', 14.99, 'Salads', 'https://images.unsplash.com/photo-1546793665-c74683f339c1'),
    ('Chocolate Cake', 'Rich chocolate cake with berry compote', 9.99, 'Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587')
) AS item(name, description, price, category, image_url)
WHERE r.name = 'The Gourmet Bistro';

INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) 
SELECT 
    r.id,
    item.name,
    item.description,
    item.price,
    item.category,
    item.image_url
FROM restaurants r
CROSS JOIN (
    VALUES 
    ('Dragon Roll', 'Eel and cucumber topped with avocado', 16.99, 'Sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351'),
    ('Chicken Teriyaki', 'Grilled chicken with teriyaki glaze', 18.99, 'Main Courses', 'https://images.unsplash.com/photo-1564767655658-4e6b365884ff'),
    ('Miso Soup', 'Traditional soybean paste soup', 4.99, 'Soups', 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75')
) AS item(name, description, price, category, image_url)
WHERE r.name = 'Sakura Sushi';

INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) 
SELECT 
    r.id,
    item.name,
    item.description,
    item.price,
    item.category,
    item.image_url
FROM restaurants r
CROSS JOIN (
    VALUES 
    ('Margherita Pizza', 'Fresh mozzarella, tomatoes, and basil', 16.99, 'Main Courses', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002'),
    ('Fettuccine Alfredo', 'Creamy parmesan sauce with fresh pasta', 19.99, 'Main Courses', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5'),
    ('Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 8.99, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9')
) AS item(name, description, price, category, image_url)
WHERE r.name = 'Mama Mia''s';

INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url) 
SELECT 
    r.id,
    item.name,
    item.description,
    item.price,
    item.category,
    item.image_url
FROM restaurants r
CROSS JOIN (
    VALUES 
    ('Butter Chicken', 'Tender chicken in creamy tomato curry', 17.99, 'Main Courses', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db'),
    ('Samosas', 'Crispy pastries filled with spiced vegetables', 7.99, 'Appetizers', 'https://images.unsplash.com/photo-1601050690597-df0568f70950'),
    ('Mango Lassi', 'Sweet yogurt drink with fresh mango', 4.99, 'Beverages', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add')
) AS item(name, description, price, category, image_url)
WHERE r.name = 'Spice Garden';