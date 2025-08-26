# 🔧 RBAC Fix Instructions - Resolving User Role Display Issues

## 🚨 **Problem Description**
All users are displaying as "customer" role regardless of their actual intended role. Admin users cannot access admin functionality because the system doesn't recognize their admin status.

## 🔍 **Root Cause**
The `user_profiles` table is missing the `user_role` column that stores user role information. The RBAC (Role-Based Access Control) system expects this column to exist.

## ✅ **Solution Steps**

### **Step 1: Run Database Migration**

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the RBAC Fix Script**
   - Open the file: `database/fix-rbac-complete.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** button

3. **Verify Script Execution**
   - You should see output messages like:
     ```
     ✅ Added user_role column to user_profiles table
     ✅ Created 5 missing user profiles!
     👑 Updated admin user: admin@yumzoom.com
     🍕 Updated restaurant owner: marco.rossini@bellaitalia.com
     ...
     🎉 RBAC SETUP COMPLETE! 🎉
     ```

### **Step 2: Create Test Users (if not already created)**

If you haven't created the test users in Supabase Auth yet:

1. **Go to Supabase Dashboard > Authentication > Users**
2. **Create each user from the TEST_USERS_LIST.md file:**

   **Admin Users:**
   - Email: `admin@yumzoom.com`, Password: `test123`
   - Email: `support@yumzoom.com`, Password: `test123`

   **Restaurant Owners:**
   - Email: `marco.rossini@bellaitalia.com`, Password: `test123`
   - Email: `kenji.tanaka@sakurasushi.com`, Password: `test123`
   - Email: `carlos.martinez@tacofiesta.com`, Password: `test123`
   - Email: `sophia.green@thegreengarden.com`, Password: `test123`

   **Business Partners:**
   - Email: `james.partnership@fooddelivery.com`, Password: `test123`
   - Email: `lisa.collaboration@restauranttech.com`, Password: `test123`

   **Customers:**
   - Email: `alice.johnson@gmail.com`, Password: `test123`
   - Email: `mike.chen@yahoo.com`, Password: `test123`
   - Email: `sarah.williams@outlook.com`, Password: `test123`
   - Email: `david.brown@gmail.com`, Password: `test123`
   - Email: `emily.davis@hotmail.com`, Password: `test123`

3. **After creating users, run the role assignment again:**
   ```sql
   SELECT assign_test_user_roles();
   ```

### **Step 3: Verify the Fix**

1. **Check Database**
   ```sql
   -- Verify roles are assigned correctly
   SELECT 
       up.first_name || ' ' || up.last_name as full_name,
       up.user_role,
       au.email
   FROM user_profiles up
   JOIN auth.users au ON up.id = au.id
   ORDER BY up.user_role, au.email;
   ```

2. **Check Application**
   - Sign out of the application if logged in
   - Sign in with admin user: `admin@yumzoom.com` / `test123`
   - You should now see:
     - Role badge showing "🧑‍💼 Admin" in the navbar
     - Admin navigation items in the menu
     - Access to admin-only features

### **Step 4: Test Different Roles**

1. **Test Admin Access:**
   - Login as: `admin@yumzoom.com`
   - Should see: Admin badge, Admin navigation, all permissions

2. **Test Restaurant Owner:**
   - Login as: `marco.rossini@bellaitalia.com`
   - Should see: Restaurant Owner badge, Restaurant management features

3. **Test Customer:**
   - Login as: `alice.johnson@gmail.com`
   - Should see: Customer badge, standard user features only

## 🐛 **Debugging Tools**

### **Role Debugger Component**
In development mode, you'll see a blue eye icon (👁️) in the bottom-right corner:
- Click it to open the Role Debugger
- It shows:
  - Authentication status
  - Current user role
  - Permission status
  - Database connection info
  - Helpful debugging tips

### **Manual Database Checks**
```sql
-- Check if user_role column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'user_role';

-- Check specific user role
SELECT up.user_role, au.email 
FROM user_profiles up 
JOIN auth.users au ON up.id = au.id 
WHERE au.email = 'admin@yumzoom.com';

-- Count users by role
SELECT user_role, COUNT(*) 
FROM user_profiles 
GROUP BY user_role;
```

## 🔄 **If Issues Persist**

### **Common Issues and Solutions:**

1. **"user_role column doesn't exist" error:**
   - Re-run the migration script
   - Ensure you have admin access to the database

2. **Users still showing as customer:**
   - Check that test users exist in auth.users table
   - Re-run the `assign_test_user_roles()` function
   - Clear browser cache and hard refresh

3. **Admin user can't access admin features:**
   - Verify the user_role is set to 'admin' in database
   - Check browser console for any JavaScript errors
   - Sign out and sign back in

4. **Navigation not updating:**
   - Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
   - Clear application cache
   - Check that useUserRole hook is working

### **Emergency Reset:**
If you need to completely reset the RBAC system:

```sql
-- Drop the user_role column and recreate
ALTER TABLE user_profiles DROP COLUMN IF EXISTS user_role;
-- Then re-run the complete fix script
```

## ✅ **Expected Results After Fix**

1. **Admin User (`admin@yumzoom.com`):**
   - ✅ Shows "🧑‍💼 Admin" badge
   - ✅ Can access /admin routes
   - ✅ Sees admin navigation items
   - ✅ Has all permissions

2. **Restaurant Owner (`marco.rossini@bellaitalia.com`):**
   - ✅ Shows "🍕 Restaurant Owner" badge
   - ✅ Can access restaurant management
   - ✅ Sees owner-specific features

3. **Customer (`alice.johnson@gmail.com`):**
   - ✅ Shows "👥 Customer" badge
   - ✅ Standard customer features only
   - ✅ Cannot access admin/owner features

4. **Role-Based Navigation:**
   - ✅ Navigation items filtered by user role
   - ✅ Protected routes work correctly
   - ✅ Unauthorized access shows proper error pages

## 📞 **Support**

If you continue to experience issues:

1. **Check the Role Debugger** for detailed status information
2. **Run the verification queries** in the SQL editor
3. **Check browser console** for any JavaScript errors
4. **Verify database permissions** in Supabase dashboard

---

**Last Updated:** August 24, 2025  
**Status:** Ready for Implementation  
**Estimated Fix Time:** 10-15 minutes
