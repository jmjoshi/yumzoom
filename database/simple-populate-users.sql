-- Simple User Profile Population Script
-- This script only uses basic columns that should exist in any user_profiles table

-- First, let's check what columns actually exist in your user_profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Simple function that uses the actual columns in your table
CREATE OR REPLACE FUNCTION populate_test_user_profiles_simple()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    profile_count INTEGER := 0;
BEGIN
    -- Loop through all auth users and create basic profiles
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        
        -- Determine role based on email domain
        IF user_record.email LIKE '%@bellaitalia.com' OR 
           user_record.email LIKE '%@sakurasushi.com' OR 
           user_record.email LIKE '%@tacofiesta.com' OR 
           user_record.email LIKE '%@thegreengarden.com' THEN
            
            -- Restaurant Owner - Include first_name and last_name
            INSERT INTO user_profiles (id, user_role, first_name, last_name) VALUES (
                user_record.id,
                'restaurant_owner',
                CASE 
                    WHEN user_record.email LIKE 'marco.%' THEN 'Marco'
                    WHEN user_record.email LIKE 'kenji.%' THEN 'Kenji'
                    WHEN user_record.email LIKE 'carlos.%' THEN 'Carlos'
                    WHEN user_record.email LIKE 'sophia.%' THEN 'Sophia'
                    ELSE 'Restaurant'
                END,
                CASE 
                    WHEN user_record.email LIKE 'marco.%' THEN 'Rossini'
                    WHEN user_record.email LIKE 'kenji.%' THEN 'Tanaka'
                    WHEN user_record.email LIKE 'carlos.%' THEN 'Martinez'
                    WHEN user_record.email LIKE 'sophia.%' THEN 'Green'
                    ELSE 'Owner'
                END
            ) ON CONFLICT (id) DO UPDATE SET 
                user_role = 'restaurant_owner',
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
            
        ELSIF user_record.email LIKE '%@yumzoom.com' THEN
            
            -- Admin User
            INSERT INTO user_profiles (id, user_role, first_name, last_name) VALUES (
                user_record.id,
                'admin',
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'System'
                    WHEN user_record.email LIKE 'support@%' THEN 'Support'
                    ELSE 'Admin'
                END,
                CASE 
                    WHEN user_record.email LIKE 'admin@%' THEN 'Administrator'
                    WHEN user_record.email LIKE 'support@%' THEN 'Manager'
                    ELSE 'User'
                END
            ) ON CONFLICT (id) DO UPDATE SET 
                user_role = 'admin',
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
            
        ELSIF user_record.email LIKE '%@fooddelivery.com' OR 
              user_record.email LIKE '%@restauranttech.com' THEN
            
            -- Business Partner
            INSERT INTO user_profiles (id, user_role, first_name, last_name) VALUES (
                user_record.id,
                'business_partner',
                CASE 
                    WHEN user_record.email LIKE 'james.%' THEN 'James'
                    WHEN user_record.email LIKE 'lisa.%' THEN 'Lisa'
                    ELSE 'Business'
                END,
                CASE 
                    WHEN user_record.email LIKE 'james.%' THEN 'Partnership'
                    WHEN user_record.email LIKE 'lisa.%' THEN 'Collaboration'
                    ELSE 'Partner'
                END
            ) ON CONFLICT (id) DO UPDATE SET 
                user_role = 'business_partner',
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
            
        ELSE
            
            -- Regular Customer
            INSERT INTO user_profiles (id, user_role, first_name, last_name) VALUES (
                user_record.id,
                'customer',
                CASE 
                    WHEN user_record.email LIKE 'alice.%' THEN 'Alice'
                    WHEN user_record.email LIKE 'mike.%' THEN 'Mike'
                    WHEN user_record.email LIKE 'sarah.%' THEN 'Sarah'
                    WHEN user_record.email LIKE 'david.%' THEN 'David'
                    WHEN user_record.email LIKE 'emily.%' THEN 'Emily'
                    ELSE 'Customer'
                END,
                CASE 
                    WHEN user_record.email LIKE 'alice.%' THEN 'Johnson'
                    WHEN user_record.email LIKE 'mike.%' THEN 'Chen'
                    WHEN user_record.email LIKE 'sarah.%' THEN 'Williams'
                    WHEN user_record.email LIKE 'david.%' THEN 'Brown'
                    WHEN user_record.email LIKE 'emily.%' THEN 'Davis'
                    ELSE 'User'
                END
            ) ON CONFLICT (id) DO UPDATE SET 
                user_role = 'customer',
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name;
            
        END IF;
        
        profile_count := profile_count + 1;
    END LOOP;
    
    RETURN 'Created/Updated ' || profile_count || ' user profiles successfully!';
END;
$$ LANGUAGE plpgsql;

-- Run the simple function
SELECT populate_test_user_profiles_simple();

-- Verify the results
SELECT user_role, COUNT(*) as count 
FROM user_profiles 
GROUP BY user_role 
ORDER BY user_role;

-- Show all profiles with auth user emails
SELECT up.user_role, au.email, up.id
FROM user_profiles up 
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, au.email;
