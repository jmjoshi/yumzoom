# Test User Creation Instructions

Since we cannot directly insert into the `auth.users` table (managed by Supabase Auth), you'll need to create the test users manually through the Supabase dashboard or use the Supabase Auth API.

## Step 1: Create Users in Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Invite User" or "Add User" for each of the following:

### Admin Users (2 users)
- `admin@yumzoom.com` - System Administrator
- `support@yumzoom.com` - Support Manager

### Restaurant Owners (4 users)
- `marco.rossini@bellaitalia.com` - Marco Rossini (Bella Italia)
- `kenji.tanaka@sakurasushi.com` - Kenji Tanaka (Sakura Sushi)
- `carlos.martinez@tacofiesta.com` - Carlos Martinez (Taco Fiesta)
- `sophia.green@thegreengarden.com` - Sophia Green (The Green Garden)

### Business Partners (2 users)
- `james.partnership@fooddelivery.com` - James Partnership
- `lisa.collaboration@restauranttech.com` - Lisa Collaboration

### Regular Customers (5 users)
- `alice.johnson@gmail.com` - Alice Johnson
- `mike.chen@yahoo.com` - Mike Chen
- `sarah.williams@hotmail.com` - Sarah Williams
- `david.brown@outlook.com` - David Brown
- `emily.davis@gmail.com` - Emily Davis

## Step 2: Run the Database Scripts

After creating all users in the Supabase dashboard:

1. **First, run the setup script:**
   ```sql
   -- Run in Supabase SQL Editor
   \i database/setup-test-users.sql
   ```

2. **Then populate the user profiles:**
   ```sql
   -- Run this function to auto-populate profiles
   SELECT populate_test_user_profiles();
   ```

3. **Verify the setup:**
   ```sql
   -- Check that all profiles were created
   SELECT user_role, COUNT(*) 
   FROM user_profiles 
   GROUP BY user_role 
   ORDER BY user_role;
   ```

## Step 3: Test the System

After setup is complete, you can run the restaurant characteristics test:

```sql
\i database/test-restaurant-characteristics.sql
```

## Alternative: Programmatic User Creation

If you prefer to create users programmatically, you can use the Supabase Auth API:

```javascript
// Example using Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'your-project-url',
  'your-service-role-key' // Service role key required for admin operations
);

const users = [
  { email: 'admin@yumzoom.com', password: 'testpassword123' },
  { email: 'support@yumzoom.com', password: 'testpassword123' },
  // ... add all users
];

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true
  });
  
  if (error) console.error('Error creating user:', error);
  else console.log('Created user:', data.user.email);
}
```

## Security Notes

- Use temporary passwords for test users
- These users are for testing only
- Consider using a separate test database
- Remember to clean up test data when moving to production

## Expected Results

After completion, you should have:
- 13 test users across 4 different roles
- Complete user profiles with realistic information
- A functional restaurant characteristics rating system
- Proper role-based access control testing capabilities
