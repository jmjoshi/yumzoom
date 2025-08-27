# 🚀 Quick Setup Guide: Testing Restaurant Characteristics

## 📋 **Prerequisites**
- ✅ RBAC system working (admin/user roles functional)
- ✅ Restaurant characteristics database schema
- ✅ Test restaurants and users in database

---

## 🛠️ **Step 1: Verify Database Schema**

Run this in **Supabase SQL Editor** to check if tables exist:

```sql
-- Check if restaurant characteristics tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'restaurant_characteristics',
  'user_restaurant_ratings',
  'restaurant_rating_photos',
  'restaurant_rating_votes'
) AND table_schema = 'public';
```

**If missing tables, run the schema creation script:**
```bash
# In Supabase SQL Editor, run:
database/restaurant-characteristics-schema.sql
```

---

## 🏪 **Step 2: Add Test Restaurants (if needed)**

```sql
-- Add sample restaurants for testing
INSERT INTO restaurants (id, name, description, address, phone, cuisine_type, image_url) VALUES
('rest-1', 'Bella Italia', 'Authentic Italian cuisine in the heart of the city', '123 Main St, Downtown', '(555) 123-4567', 'Italian', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500'),
('rest-2', 'Sakura Sushi', 'Fresh sushi and Japanese dishes', '456 Oak Ave, Midtown', '(555) 234-5678', 'Japanese', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500'),
('rest-3', 'Taco Fiesta', 'Vibrant Mexican flavors and atmosphere', '789 Pine St, Westside', '(555) 345-6789', 'Mexican', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  cuisine_type = EXCLUDED.cuisine_type,
  image_url = EXCLUDED.image_url;
```

---

## 🧪 **Step 3: Start Testing**

### **A. Start Development Server**
```bash
npm run dev
```

### **B. Navigate to Restaurant Page**
1. Go to: `http://localhost:3000/restaurants`
2. Click on any restaurant card
3. **OR** go directly to: `http://localhost:3000/restaurants/rest-1`

### **C. Look for Restaurant Characteristics Section**
You should see:
- ✅ **Restaurant header** with name, description, address
- ✅ **"Restaurant Ratings & Reviews"** section 
- ✅ **"Rate This Restaurant"** button
- ✅ **Menu items** below

---

## 🎯 **Step 4: Test Rating Flow**

### **A. Submit Your First Rating**
1. **Click "Rate This Restaurant"** button
2. **Rate each characteristic** (1-10 stars):
   - Ambience
   - Decor & Design  
   - Service Quality
   - Cleanliness
   - Noise Level
   - Value for Money
   - Food Quality
   - Overall Experience
3. **Add optional details:**
   - Visit date
   - Review text
   - Recommendation (Yes/No)
4. **Click "Submit Rating"**

### **B. Verify Results**
After submission, you should see:
- ✅ Rating modal closes
- ✅ Page refreshes with your ratings
- ✅ Characteristics overview shows averages
- ✅ Your review appears in reviews section

---

## 🔍 **Step 5: Test Different Scenarios**

### **Test as Different Users:**

1. **Admin User** (`admin@yumzoom.com`)
   - Should see all features
   - Can rate restaurants
   - May see admin-specific options

2. **Customer** (`alice.johnson@gmail.com`)  
   - Can view ratings
   - Can submit ratings
   - Standard user experience

3. **Restaurant Owner** (`marco.rossini@bellaitalia.com`)
   - Can see ratings for their restaurants
   - May have management features

### **Test Edge Cases:**
- Rate same restaurant multiple times (should update existing)
- Submit minimal rating (just stars, no text)
- Submit maximum rating (all 10s with long review)
- Test mobile responsiveness

---

## 🐛 **Common Issues & Quick Fixes**

### **Issue: "Rate This Restaurant" button not visible**
**Solution:**
```sql
-- Check if restaurant exists
SELECT * FROM restaurants WHERE id = 'rest-1';

-- If missing, run the restaurant insert query above
```

### **Issue: Rating submission fails**
**Check:**
1. **Browser console** for JavaScript errors
2. **Network tab** for API call failures
3. **Supabase logs** for database errors

**Debug API:**
```bash
# Test API endpoint directly
curl -X GET http://localhost:3000/api/restaurants/rest-1/characteristics
```

### **Issue: Ratings not displaying**
**Verify data:**
```sql
-- Check if ratings were saved
SELECT 
  urr.*,
  up.first_name || ' ' || up.last_name as reviewer
FROM user_restaurant_ratings urr
JOIN user_profiles up ON urr.user_id = up.id
WHERE restaurant_id = 'rest-1';
```

---

## 📱 **Step 6: Mobile Testing**

1. **Open browser dev tools** (F12)
2. **Toggle device simulation** (mobile view)
3. **Test the rating flow** on mobile:
   - Star ratings should work with touch
   - Modal should be responsive
   - Form fields should be accessible

---

## ✅ **Success Checklist**

After setup, you should be able to:

- [ ] Navigate to restaurant detail pages
- [ ] See "Restaurant Ratings & Reviews" section
- [ ] Click "Rate This Restaurant" button
- [ ] Fill out rating form with 8 characteristics
- [ ] Submit ratings successfully
- [ ] View submitted ratings and reviews
- [ ] See rating averages update
- [ ] Test on both desktop and mobile

---

## 🚀 **Ready to Test!**

1. **Follow steps 1-3** to set up the data
2. **Go to a restaurant page** 
3. **Click "Rate This Restaurant"**
4. **Start rating the characteristics!**

The restaurant characteristics feature should now be fully functional and ready for comprehensive testing! 🎉
