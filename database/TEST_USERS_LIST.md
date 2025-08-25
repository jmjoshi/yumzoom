# YumZoom Test Users - Complete List

This document contains all test users that should be created in the Supabase Authentication dashboard for testing the YumZoom restaurant characteristics rating system.

## Instructions for Creating Users

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add User"** or **"Invite User"**
4. For each user below, enter the exact email and password provided
5. After creating all users, run the user profile population script

---

## 🧑‍💼 Admin Users (2 users)

| Name | Email | Password | Role | Phone | Notes |
|------|-------|----------|------|-------|-------|
| System Administrator | `admin@yumzoom.com` | `test123` | admin | (555) 999-0000 | Main system admin |
| Support Manager | `support@yumzoom.com` | `test123` | admin | (555) 999-0000 | Customer support manager |

---

## 🍕 Restaurant Owners (4 users)

| Name | Email | Password | Role | Phone | Restaurant Association |
|------|-------|----------|------|-------|----------------------|
| Marco Rossini | `marco.rossini@bellaitalia.com` | `test123` | restaurant_owner | (555) 123-4567 | Bella Italia (Italian) |
| Kenji Tanaka | `kenji.tanaka@sakurasushi.com` | `test123` | restaurant_owner | (555) 234-5678 | Sakura Sushi (Japanese) |
| Carlos Martinez | `carlos.martinez@tacofiesta.com` | `test123` | restaurant_owner | (555) 345-6789 | Taco Fiesta (Mexican) |
| Sophia Green | `sophia.green@thegreengarden.com` | `test123` | restaurant_owner | (555) 456-7890 | The Green Garden (Vegetarian) |

---

## 🤝 Business Partners (2 users)

| Name | Email | Password | Role | Phone | Company |
|------|-------|----------|------|-------|---------|
| James Partnership | `james.partnership@fooddelivery.com` | `test123` | business_partner | (555) 567-8901 | Food Delivery Services |
| Lisa Collaboration | `lisa.collaboration@restauranttech.com` | `test123` | business_partner | (555) 678-9012 | Restaurant Tech Solutions |

---

## 👥 Customer Users (5 users)

| Name | Email | Password | Role | Phone | Date of Birth | Profile |
|------|-------|----------|------|-------|---------------|---------|
| Alice Johnson | `alice.johnson@gmail.com` | `test123` | customer | (555) 111-2222 | 1990-05-15 | Food enthusiast, frequent diner |
| Mike Chen | `mike.chen@yahoo.com` | `test123` | customer | (555) 222-3333 | 1985-08-22 | Asian cuisine lover |
| Sarah Williams | `sarah.williams@outlook.com` | `test123` | customer | (555) 333-4444 | 1992-12-03 | Health-conscious eater |
| David Brown | `david.brown@gmail.com` | `test123` | customer | (555) 444-5555 | 1988-07-18 | Casual dining regular |
| Emily Davis | `emily.davis@hotmail.com` | `test123` | customer | (555) 555-6666 | 1995-01-30 | Social dining enthusiast |

---

## 📊 User Summary

- **Total Users**: 13
- **Admin Users**: 2
- **Restaurant Owners**: 4  
- **Business Partners**: 2
- **Customers**: 5

---

## 🔐 Security Notes

- **Passwords**: All users use the simple password `test123` for easy testing
- **Email Domains**: Different domains used to test email pattern matching in the system
- **Temporary Use**: These are test accounts - change passwords for production use
- **Role Assignment**: Roles are automatically assigned based on email patterns by the profile population script

---

## 📝 Post-Creation Steps

After creating all users in Supabase Auth:

1. **Run Profile Population Script**:
   ```sql
   SELECT populate_test_user_profiles_simple();
   ```

2. **Verify User Creation**:
   ```sql
   SELECT user_role, COUNT(*) as count 
   FROM user_profiles 
   GROUP BY user_role 
   ORDER BY user_role;
   ```

3. **View All Users**:
   ```sql
   SELECT up.first_name, up.last_name, up.user_role, au.email
   FROM user_profiles up
   JOIN auth.users au ON up.id = au.id
   ORDER BY up.user_role, up.first_name;
   ```

---

## 🎯 Testing Scenarios

These users enable testing:
- **Multi-role access control**
- **Restaurant characteristics rating system**
- **User authentication flows**
- **Role-based permissions**
- **Real user interactions with restaurants**
- **Rating aggregation across different user types**

---

**Created**: August 24, 2025  
**Purpose**: YumZoom Restaurant Characteristics Rating System Testing  
**Status**: Ready for Implementation
