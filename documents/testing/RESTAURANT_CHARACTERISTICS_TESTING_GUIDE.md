# 🧪 Restaurant Characteristics Testing Guide

## 🎯 **Features to Test**

The restaurant characteristics system includes 8 different rating categories:

1. **Ambience** - Overall atmosphere and mood (1-10 scale)
2. **Decor & Design** - Interior design and visual appeal (1-10 scale)  
3. **Service Quality** - Staff friendliness and efficiency (1-10 scale)
4. **Cleanliness** - Hygiene and cleanliness standards (1-10 scale)
5. **Noise Level** - Acoustic comfort (1-10 scale, where 1=very quiet, 10=very loud)
6. **Value for Money** - Price vs quality ratio (1-10 scale)
7. **Food Quality** - Taste, presentation, freshness (1-10 scale)
8. **Overall Experience** - General satisfaction (1-10 scale)

---

## 🚀 **Step-by-Step Testing Process**

### **Step 1: Ensure Database Schema is Set Up**

First, verify the restaurant characteristics tables exist:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'restaurant_characteristics',
  'user_restaurant_ratings',
  'restaurant_rating_photos',
  'restaurant_rating_votes'
);
```

If tables are missing, run:
```sql
-- Run the schema creation script
-- database/restaurant-characteristics-schema.sql
```

### **Step 2: Navigate to a Restaurant Page**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit your application:** `http://localhost:3000`

3. **Go to a restaurant page:**
   - Navigate to `/restaurants` 
   - Click on any restaurant
   - OR directly visit: `http://localhost:3000/restaurants/[restaurant-id]`

### **Step 3: Test Rating Functionality**

#### **A. Submit a New Rating**

1. **Look for the "Rate This Restaurant" button** on the restaurant page
2. **Click the button** to open the rating modal
3. **Rate each characteristic** (1-10 stars):
   - Click on stars to set ratings for each category
   - Each category has its own star rating component
4. **Fill optional fields:**
   - Visit date (calendar picker)
   - Review text (textarea)
   - Recommendation (Yes/No buttons)
5. **Click "Submit Rating"**

#### **B. View Existing Ratings**

1. **Check the characteristics overview** - displays average ratings for each category
2. **Browse customer reviews** - shows individual user ratings and reviews
3. **See rating distribution** - how ratings are spread across different values

### **Step 4: Test Different User Roles**

#### **A. Test as Customer (`alice.johnson@gmail.com`)**
- ✅ Can view restaurant ratings
- ✅ Can submit new ratings
- ✅ Can see aggregated characteristics

#### **B. Test as Restaurant Owner (`marco.rossini@bellaitalia.com`)**
- ✅ Can view all ratings for their restaurants
- ✅ Can see detailed analytics
- ✅ May have additional management features

#### **C. Test as Admin (`admin@yumzoom.com`)**
- ✅ Can view all restaurant ratings
- ✅ Can moderate reviews if needed
- ✅ Can see system-wide analytics

---

## 🧪 **Detailed Testing Scenarios**

### **Scenario 1: First-Time Restaurant Rating**

**Goal:** Test the complete rating submission flow

**Steps:**
1. Find a restaurant with no ratings yet
2. Click "Rate This Restaurant"
3. Set ratings for all 8 characteristics
4. Add a review: "Great food and excellent service!"
5. Set visit date to last week
6. Choose "Yes" for recommendation
7. Submit rating
8. Verify the restaurant now shows your ratings

**Expected Results:**
- ✅ Rating modal opens correctly
- ✅ All star ratings are interactive
- ✅ Form validation works (1-10 range)
- ✅ Rating submits successfully
- ✅ Restaurant page updates with new ratings
- ✅ Your review appears in the reviews section

### **Scenario 2: Update Existing Rating**

**Goal:** Test updating a previously submitted rating

**Steps:**
1. Go to a restaurant you've already rated
2. Click "Rate This Restaurant" again
3. Change some of the ratings
4. Update your review text
5. Submit the updated rating

**Expected Results:**
- ✅ Form pre-fills with your existing ratings
- ✅ Updates save correctly (no duplicate entries)
- ✅ Restaurant averages recalculate

### **Scenario 3: Rating Distribution Testing**

**Goal:** Test how multiple ratings affect averages

**Steps:**
1. Submit ratings from multiple test accounts:
   - Alice: All 8s and 9s
   - Mike: All 6s and 7s  
   - Sarah: Mixed ratings (3s to 10s)
2. Check if averages calculate correctly
3. Verify rating distribution displays properly

**Expected Results:**
- ✅ Averages reflect all submitted ratings
- ✅ Distribution shows rating spread
- ✅ Total rating count is accurate

### **Scenario 4: Edge Case Testing**

**Goal:** Test boundary conditions and error handling

**Test Cases:**
1. **Minimum ratings (all 1s)** - should work
2. **Maximum ratings (all 10s)** - should work  
3. **Empty review text** - should work (optional field)
4. **Very long review text** - test character limits
5. **Invalid date** - test date validation
6. **Submit without authentication** - should show error

---

## 🐛 **Common Issues & Troubleshooting**

### **Issue 1: "Rate This Restaurant" Button Missing**
**Possible Causes:**
- RestaurantCharacteristics component not imported
- Restaurant ID not passed correctly
- Authentication issues

**Solution:**
```tsx
// Ensure the component is imported and used
import RestaurantCharacteristics from '@/components/restaurant/RestaurantCharacteristics';

// In your restaurant page:
<RestaurantCharacteristics 
  restaurantId={restaurant.id}
  onRatingSubmitted={() => {
    // Optional callback
    console.log('Rating submitted!');
  }}
/>
```

### **Issue 2: Rating Submission Fails**
**Check:**
1. Network tab for API errors
2. Supabase database permissions
3. User authentication status
4. Required table schemas exist

**Debug:**
```javascript
// Check in browser console
console.log('Auth token:', localStorage.getItem('auth-token'));
console.log('Restaurant ID:', restaurantId);
```

### **Issue 3: Ratings Not Displaying**
**Verify:**
1. Database tables have data
2. API endpoint returns correct data
3. Component state updates properly

**SQL Query to Check Data:**
```sql
SELECT 
  r.name as restaurant_name,
  COUNT(urr.*) as rating_count,
  ROUND(AVG(urr.overall_rating), 1) as avg_rating
FROM restaurants r
LEFT JOIN user_restaurant_ratings urr ON r.id = urr.restaurant_id
GROUP BY r.id, r.name
ORDER BY rating_count DESC;
```

---

## 📊 **Database Testing Queries**

### **View All Ratings for a Restaurant**
```sql
SELECT 
  up.first_name || ' ' || up.last_name as reviewer,
  urr.overall_rating,
  urr.ambience_rating,
  urr.service_rating,
  urr.food_quality_rating,
  urr.review_text,
  urr.would_recommend,
  urr.created_at
FROM user_restaurant_ratings urr
JOIN user_profiles up ON urr.user_id = up.id
WHERE urr.restaurant_id = 'your-restaurant-id'
ORDER BY urr.created_at DESC;
```

### **Check Restaurant Characteristics Aggregation**
```sql
SELECT 
  rc.*,
  r.name as restaurant_name
FROM restaurant_characteristics rc
JOIN restaurants r ON rc.restaurant_id = r.id
WHERE rc.restaurant_id = 'your-restaurant-id';
```

### **Test Rating Distribution**
```sql
SELECT 
  overall_rating,
  COUNT(*) as count
FROM user_restaurant_ratings
WHERE restaurant_id = 'your-restaurant-id'
GROUP BY overall_rating
ORDER BY overall_rating;
```

---

## 🎯 **Success Criteria**

### **✅ Basic Functionality**
- [ ] Rating modal opens and closes properly
- [ ] All 8 characteristic ratings can be set (1-10)
- [ ] Form validation works correctly
- [ ] Ratings submit successfully
- [ ] Restaurant page updates with new data

### **✅ User Experience**
- [ ] Star ratings are intuitive and responsive
- [ ] Visual feedback on hover/selection
- [ ] Loading states during submission
- [ ] Success/error messages display
- [ ] Mobile-responsive design works

### **✅ Data Integrity**
- [ ] Ratings save to correct restaurant
- [ ] User can update existing ratings (no duplicates)
- [ ] Averages calculate correctly
- [ ] Rating counts are accurate
- [ ] Data persists across page refreshes

### **✅ Advanced Features**
- [ ] Review text displays properly
- [ ] Visit date validation works
- [ ] Recommendation system functions
- [ ] Rating helpfulness voting (if implemented)
- [ ] Photo uploads (if implemented)

---

## 🔄 **Automated Testing Commands**

### **Load Test Data**
```bash
# Run these in Supabase SQL Editor
\i database/test-restaurant-characteristics.sql
```

### **Reset Test Data**
```sql
-- Clear all ratings (use carefully!)
DELETE FROM user_restaurant_ratings WHERE restaurant_id = 'test-restaurant-id';
DELETE FROM restaurant_characteristics WHERE restaurant_id = 'test-restaurant-id';
```

---

## 📱 **Mobile Testing**

### **Additional Mobile Scenarios**
1. **Touch interactions** - star ratings work with touch
2. **Modal responsiveness** - rating form fits mobile screens
3. **Keyboard navigation** - form fields accessible
4. **Swipe gestures** - reviews can be scrolled
5. **Performance** - ratings load quickly on mobile

---

**Ready to test?** Start with Step 1 and work through each scenario systematically. The restaurant characteristics system should provide a comprehensive rating experience for your users! 🚀
