-- Step 5: Test the fix
SELECT 
    user_role,
    first_name,
    last_name,
    id
FROM user_profiles 
WHERE id = auth.uid();
