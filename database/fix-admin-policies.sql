-- Fix restaurant admin policies
-- Add INSERT, UPDATE, and DELETE policies for authenticated users (admin functionality)

-- Allow authenticated users to insert restaurants
CREATE POLICY "Authenticated users can insert restaurants" ON restaurants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update restaurants  
CREATE POLICY "Authenticated users can update restaurants" ON restaurants
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete restaurants
CREATE POLICY "Authenticated users can delete restaurants" ON restaurants
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Also add admin policies for menu_items since they might have the same issue
-- Allow authenticated users to insert menu items
CREATE POLICY "Authenticated users can insert menu items" ON menu_items
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update menu items
CREATE POLICY "Authenticated users can update menu items" ON menu_items
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete menu items
CREATE POLICY "Authenticated users can delete menu items" ON menu_items
    FOR DELETE USING (auth.uid() IS NOT NULL);
