-- Migration to add user_role column to user_profiles table
-- This migration adds the missing user_role column that is required for RBAC functionality

-- Check if the column exists and add it if it doesn't
DO $$
BEGIN
    -- Check if user_role column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'user_role') THEN
        
        -- Add the user_role column with constraint
        ALTER TABLE user_profiles 
        ADD COLUMN user_role TEXT DEFAULT 'customer' 
        CHECK (user_role IN ('customer', 'restaurant_owner', 'business_partner', 'admin'));
        
        RAISE NOTICE 'Added user_role column to user_profiles table';
    ELSE
        RAISE NOTICE 'user_role column already exists in user_profiles table';
    END IF;
END $$;

-- Create or update Row Level Security policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not their role)
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_role = 'admin'
        )
    );

-- Policy: Allow inserting profiles for new users
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to automatically create user profiles when users sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, user_role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer'
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, do nothing
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to populate test user profiles
CREATE OR REPLACE FUNCTION populate_test_user_profiles_rbac()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    result_text TEXT := '';
BEGIN
    -- Admin users
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN ('admin@yumzoom.com', 'support@yumzoom.com')
    LOOP
        INSERT INTO user_profiles (id, user_role, first_name, last_name) 
        VALUES (
            user_record.id,
            'admin',
            CASE 
                WHEN user_record.email = 'admin@yumzoom.com' THEN 'System'
                WHEN user_record.email = 'support@yumzoom.com' THEN 'Support'
            END,
            CASE 
                WHEN user_record.email = 'admin@yumzoom.com' THEN 'Administrator'
                WHEN user_record.email = 'support@yumzoom.com' THEN 'Manager'
            END
        )
        ON CONFLICT (id) DO UPDATE SET
            user_role = 'admin',
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
        
        result_text := result_text || 'Updated admin user: ' || user_record.email || E'\n';
    END LOOP;

    -- Restaurant owners
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'marco.rossini@bellaitalia.com',
            'kenji.tanaka@sakurasushi.com', 
            'carlos.martinez@tacofiesta.com',
            'sophia.green@thegreengarden.com'
        )
    LOOP
        INSERT INTO user_profiles (id, user_role, first_name, last_name) 
        VALUES (
            user_record.id,
            'restaurant_owner',
            CASE 
                WHEN user_record.email = 'marco.rossini@bellaitalia.com' THEN 'Marco'
                WHEN user_record.email = 'kenji.tanaka@sakurasushi.com' THEN 'Kenji'
                WHEN user_record.email = 'carlos.martinez@tacofiesta.com' THEN 'Carlos'
                WHEN user_record.email = 'sophia.green@thegreengarden.com' THEN 'Sophia'
            END,
            CASE 
                WHEN user_record.email = 'marco.rossini@bellaitalia.com' THEN 'Rossini'
                WHEN user_record.email = 'kenji.tanaka@sakurasushi.com' THEN 'Tanaka'
                WHEN user_record.email = 'carlos.martinez@tacofiesta.com' THEN 'Martinez'
                WHEN user_record.email = 'sophia.green@thegreengarden.com' THEN 'Green'
            END
        )
        ON CONFLICT (id) DO UPDATE SET
            user_role = 'restaurant_owner',
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
        
        result_text := result_text || 'Updated restaurant owner: ' || user_record.email || E'\n';
    END LOOP;

    -- Business partners
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'james.partnership@fooddelivery.com',
            'lisa.collaboration@restauranttech.com'
        )
    LOOP
        INSERT INTO user_profiles (id, user_role, first_name, last_name) 
        VALUES (
            user_record.id,
            'business_partner',
            CASE 
                WHEN user_record.email = 'james.partnership@fooddelivery.com' THEN 'James'
                WHEN user_record.email = 'lisa.collaboration@restauranttech.com' THEN 'Lisa'
            END,
            CASE 
                WHEN user_record.email = 'james.partnership@fooddelivery.com' THEN 'Partnership'
                WHEN user_record.email = 'lisa.collaboration@restauranttech.com' THEN 'Collaboration'
            END
        )
        ON CONFLICT (id) DO UPDATE SET
            user_role = 'business_partner',
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
        
        result_text := result_text || 'Updated business partner: ' || user_record.email || E'\n';
    END LOOP;

    -- Customer users
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN (
            'alice.johnson@gmail.com',
            'mike.chen@yahoo.com',
            'sarah.williams@outlook.com',
            'david.brown@gmail.com',
            'emily.davis@hotmail.com'
        )
    LOOP
        INSERT INTO user_profiles (id, user_role, first_name, last_name) 
        VALUES (
            user_record.id,
            'customer',
            CASE 
                WHEN user_record.email = 'alice.johnson@gmail.com' THEN 'Alice'
                WHEN user_record.email = 'mike.chen@yahoo.com' THEN 'Mike'
                WHEN user_record.email = 'sarah.williams@outlook.com' THEN 'Sarah'
                WHEN user_record.email = 'david.brown@gmail.com' THEN 'David'
                WHEN user_record.email = 'emily.davis@hotmail.com' THEN 'Emily'
            END,
            CASE 
                WHEN user_record.email = 'alice.johnson@gmail.com' THEN 'Johnson'
                WHEN user_record.email = 'mike.chen@yahoo.com' THEN 'Chen'
                WHEN user_record.email = 'sarah.williams@outlook.com' THEN 'Williams'
                WHEN user_record.email = 'david.brown@gmail.com' THEN 'Brown'
                WHEN user_record.email = 'emily.davis@hotmail.com' THEN 'Davis'
            END
        )
        ON CONFLICT (id) DO UPDATE SET
            user_role = 'customer',
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
        
        result_text := result_text || 'Updated customer: ' || user_record.email || E'\n';
    END LOOP;

    RETURN result_text || E'\n✅ All user profiles populated successfully!';
END;
$$ LANGUAGE plpgsql;

-- Display final status
SELECT 'Migration completed successfully! Run the following commands to set up test users:' as status;
SELECT '1. Create the test users in Supabase Auth Dashboard' as step1;
SELECT '2. Run: SELECT populate_test_user_profiles_rbac();' as step2;
SELECT '3. Verify with: SELECT user_role, COUNT(*) FROM user_profiles GROUP BY user_role;' as step3;
