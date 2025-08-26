-- Step 4: Create simple policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
