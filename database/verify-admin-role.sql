-- Quick verification query to check if admin role was set correctly
SELECT 
    'Current Admin User Status:' as info;

-- Check if admin user exists and has correct role
SELECT 
    up.first_name || ' ' || up.last_name as full_name,
    up.user_role,
    au.email,
    au.id,
    up.created_at,
    up.updated_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'admin@yumzoom.com';

-- Also check if the user_role column exists and has the constraint
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'user_role';

-- Check table constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
AND constraint_type = 'CHECK';

-- Show all users with their roles for verification
SELECT 
    'All Users and Roles:' as summary;
    
SELECT 
    up.user_role,
    au.email,
    up.first_name || ' ' || up.last_name as name
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.user_role, au.email;
