-- Test Role-Based Access Control
-- Run this script to verify different user roles and their access

-- Check current user roles in the system
SELECT 
    au.email,
    up.user_role,
    up.first_name,
    up.last_name,
    up.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY up.user_role, au.email;

-- Count users by role
SELECT 
    user_role,
    COUNT(*) as user_count
FROM user_profiles
GROUP BY user_role
ORDER BY user_role;

-- Test specific role assignments
SELECT 
    'Admin Users:' as category,
    au.email,
    up.first_name || ' ' || up.last_name as full_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE up.user_role = 'admin'

UNION ALL

SELECT 
    'Restaurant Owners:' as category,
    au.email,
    up.first_name || ' ' || up.last_name as full_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE up.user_role = 'restaurant_owner'

UNION ALL

SELECT 
    'Business Partners:' as category,
    au.email,
    up.first_name || ' ' || up.last_name as full_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE up.user_role = 'business_partner'

UNION ALL

SELECT 
    'Customers:' as category,
    au.email,
    up.first_name || ' ' || up.last_name as full_name
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE up.user_role = 'customer'
ORDER BY category, full_name;

-- Verify specific test users exist with correct roles
WITH expected_users AS (
    SELECT 'admin@yumzoom.com' as email, 'admin' as expected_role
    UNION ALL SELECT 'support@yumzoom.com', 'admin'
    UNION ALL SELECT 'marco.rossini@bellaitalia.com', 'restaurant_owner'
    UNION ALL SELECT 'kenji.tanaka@sakurasushi.com', 'restaurant_owner'
    UNION ALL SELECT 'james.partnership@fooddelivery.com', 'business_partner'
    UNION ALL SELECT 'lisa.collaboration@restauranttech.com', 'business_partner'
    UNION ALL SELECT 'alice.johnson@gmail.com', 'customer'
    UNION ALL SELECT 'mike.chen@yahoo.com', 'customer'
)
SELECT 
    eu.email,
    eu.expected_role,
    COALESCE(up.user_role, 'NOT_FOUND') as actual_role,
    CASE 
        WHEN up.user_role = eu.expected_role THEN '✅ CORRECT'
        WHEN up.user_role IS NULL THEN '❌ USER NOT FOUND'
        ELSE '⚠️ WRONG ROLE'
    END as status
FROM expected_users eu
LEFT JOIN auth.users au ON au.email = eu.email
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY eu.expected_role, eu.email;
