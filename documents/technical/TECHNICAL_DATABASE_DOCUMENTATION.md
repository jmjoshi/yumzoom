# YumZoom Database Documentation
## Complete Database Schema & Design

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Core Schema](#core-schema)
3. [Extended Features Schema](#extended-features-schema)
4. [Indexes & Performance](#indexes--performance)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Database Functions](#database-functions)
7. [Triggers & Automation](#triggers--automation)
8. [Data Migration](#data-migration)
9. [Backup & Recovery](#backup--recovery)

---

## Database Overview

### Database Engine
- **Platform**: Supabase (PostgreSQL 15+)
- **Architecture**: Cloud-native PostgreSQL with real-time capabilities
- **Extensions**: UUID, PostGIS (for location features), Full-text search

### Connection Details
```typescript
// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### Database Naming Conventions
- **Tables**: Snake_case (e.g., `user_profiles`, `menu_items`)
- **Columns**: Snake_case (e.g., `created_at`, `family_member_id`)
- **Indexes**: `idx_table_column` format
- **Foreign Keys**: `fk_table_referenced_table`
- **Constraints**: `ck_table_column_constraint`

---

## Core Schema

### Authentication & User Management

#### auth.users (Supabase managed)
```sql
-- Supabase-managed authentication table
-- Contains: id, email, encrypted_password, email_confirmed_at, etc.
```

#### user_profiles
```sql
CREATE TABLE user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_mobile text,
    phone_home text,
    phone_work text,
    avatar_url text,
    date_of_birth date,
    location_city text,
    location_state text,
    location_country text DEFAULT 'US',
    timezone text DEFAULT 'America/New_York',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_user_profiles_location ON user_profiles(location_city, location_state);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
```

#### family_members
```sql
CREATE TABLE family_members (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    age_range text CHECK (age_range IN ('child', 'teen', 'adult')) DEFAULT 'adult',
    date_of_birth date,
    dietary_restrictions text[],
    allergies text[],
    preference_notes text,
    privacy_level text CHECK (privacy_level IN ('public', 'friends', 'family', 'private')) DEFAULT 'family',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_age_range ON family_members(age_range);
CREATE INDEX idx_family_members_active ON family_members(is_active) WHERE is_active = true;
```

### Restaurant Data

#### restaurants
```sql
CREATE TABLE restaurants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    address text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'US',
    phone text,
    website text,
    email text,
    cuisine_type text,
    price_range integer CHECK (price_range >= 1 AND price_range <= 4),
    image_url text,
    latitude decimal(10, 8),
    longitude decimal(11, 8),
    hours jsonb,
    features text[], -- ['kid_friendly', 'outdoor_seating', 'parking', 'wheelchair_accessible']
    average_rating decimal(3, 2),
    total_ratings integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_city_state ON restaurants(city, state);
CREATE INDEX idx_restaurants_rating ON restaurants(average_rating) WHERE average_rating IS NOT NULL;
CREATE INDEX idx_restaurants_price ON restaurants(price_range);
CREATE INDEX idx_restaurants_active ON restaurants(is_active) WHERE is_active = true;

-- Full-text search index
CREATE INDEX idx_restaurants_search ON restaurants USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(cuisine_type, '')));
```

#### menu_items
```sql
CREATE TABLE menu_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    price decimal(10,2),
    category text,
    dietary_tags text[], -- ['vegetarian', 'vegan', 'gluten_free', 'nut_free']
    spice_level integer CHECK (spice_level >= 0 AND spice_level <= 5),
    calories integer,
    image_url text,
    average_rating decimal(3, 2),
    total_ratings integer DEFAULT 0,
    is_available boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_price ON menu_items(price) WHERE price IS NOT NULL;
CREATE INDEX idx_menu_items_rating ON menu_items(average_rating) WHERE average_rating IS NOT NULL;
CREATE INDEX idx_menu_items_dietary ON menu_items USING gin(dietary_tags);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;

-- Full-text search index
CREATE INDEX idx_menu_items_search ON menu_items USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Rating & Review System

#### ratings
```sql
CREATE TABLE ratings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
    notes text,
    review_text text,
    visit_date date,
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one rating per user+menu_item+family_member combination
    UNIQUE(user_id, menu_item_id, family_member_id)
);

-- Indexes
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_menu_item_id ON ratings(menu_item_id);
CREATE INDEX idx_ratings_family_member_id ON ratings(family_member_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);
CREATE INDEX idx_ratings_visit_date ON ratings(visit_date) WHERE visit_date IS NOT NULL;
CREATE INDEX idx_ratings_helpfulness ON ratings((helpful_count - not_helpful_count));

-- Composite indexes for analytics
CREATE INDEX idx_ratings_user_menu ON ratings(user_id, menu_item_id);
CREATE INDEX idx_ratings_restaurant_rating ON ratings(rating) INCLUDE (menu_item_id);
```

#### review_photos
```sql
CREATE TABLE review_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    photo_filename text NOT NULL,
    photo_size integer,
    upload_order integer DEFAULT 1,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_review_photos_rating_id ON review_photos(rating_id);
CREATE INDEX idx_review_photos_featured ON review_photos(is_featured) WHERE is_featured = true;
```

#### review_votes
```sql
CREATE TABLE review_votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- One vote per user per review
    UNIQUE(rating_id, user_id)
);

-- Indexes
CREATE INDEX idx_review_votes_rating_id ON review_votes(rating_id);
CREATE INDEX idx_review_votes_user_id ON review_votes(user_id);
```

---

## Extended Features Schema

### User Preferences & Privacy

#### user_preferences
```sql
CREATE TABLE user_preferences (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    dietary_restrictions text[],
    cuisine_preferences text[],
    price_preference integer CHECK (price_preference >= 1 AND price_preference <= 4),
    distance_preference integer DEFAULT 25, -- miles
    notification_settings jsonb DEFAULT '{}',
    privacy_settings jsonb DEFAULT '{}',
    accessibility_needs text[],
    language_preference text DEFAULT 'en',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_user_preferences_dietary ON user_preferences USING gin(dietary_restrictions);
CREATE INDEX idx_user_preferences_cuisine ON user_preferences USING gin(cuisine_preferences);
```

### Social Features

#### social_connections
```sql
CREATE TABLE social_connections (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'accepted',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Prevent self-following and duplicate connections
    CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- Indexes
CREATE INDEX idx_social_connections_follower ON social_connections(follower_id);
CREATE INDEX idx_social_connections_following ON social_connections(following_id);
CREATE INDEX idx_social_connections_status ON social_connections(status);
```

#### family_voting_sessions
```sql
CREATE TABLE family_voting_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    session_type text CHECK (session_type IN ('restaurant', 'menu', 'occasion')) NOT NULL,
    status text CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    deadline timestamp with time zone,
    voting_rules jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_voting_sessions_creator ON family_voting_sessions(creator_id);
CREATE INDEX idx_voting_sessions_status ON family_voting_sessions(status);
CREATE INDEX idx_voting_sessions_deadline ON family_voting_sessions(deadline) WHERE deadline IS NOT NULL;
```

#### voting_options
```sql
CREATE TABLE voting_options (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid REFERENCES family_voting_sessions(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    vote_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_voting_options_session ON voting_options(session_id);
CREATE INDEX idx_voting_options_restaurant ON voting_options(restaurant_id);
```

#### voting_participants
```sql
CREATE TABLE voting_participants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id uuid REFERENCES family_voting_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    has_voted boolean DEFAULT false,
    voted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_voting_participants_session ON voting_participants(session_id);
CREATE INDEX idx_voting_participants_user ON voting_participants(user_id);
```

### Gamification System

#### user_challenges
```sql
CREATE TABLE user_challenges (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_type text NOT NULL,
    title text NOT NULL,
    description text,
    target_value integer NOT NULL,
    current_progress integer DEFAULT 0,
    difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
    status text CHECK (status IN ('active', 'completed', 'paused', 'failed')) DEFAULT 'active',
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    reward_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_user_challenges_type ON user_challenges(challenge_type);
CREATE INDEX idx_user_challenges_end_date ON user_challenges(end_date) WHERE end_date IS NOT NULL;
```

#### user_achievements
```sql
CREATE TABLE user_achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_type text NOT NULL,
    achievement_name text NOT NULL,
    description text,
    tier text CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
    points_earned integer DEFAULT 0,
    unlocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, achievement_type, tier)
);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_user_achievements_tier ON user_achievements(tier);
```

### Restaurant Owner Features

#### restaurant_owners
```sql
CREATE TABLE restaurant_owners (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    owner_name text NOT NULL,
    position text NOT NULL,
    business_email text NOT NULL,
    business_phone text,
    verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    verification_documents text[],
    verified_at timestamp with time zone,
    verified_by uuid REFERENCES auth.users(id),
    rejection_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, restaurant_id)
);

-- Indexes
CREATE INDEX idx_restaurant_owners_user_id ON restaurant_owners(user_id);
CREATE INDEX idx_restaurant_owners_restaurant_id ON restaurant_owners(restaurant_id);
CREATE INDEX idx_restaurant_owners_status ON restaurant_owners(verification_status);
```

#### owner_responses
```sql
CREATE TABLE owner_responses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE NOT NULL,
    owner_id uuid REFERENCES restaurant_owners(id) ON DELETE CASCADE NOT NULL,
    response_text text NOT NULL,
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- One response per owner per rating
    UNIQUE(rating_id, owner_id)
);

-- Indexes
CREATE INDEX idx_owner_responses_rating_id ON owner_responses(rating_id);
CREATE INDEX idx_owner_responses_owner_id ON owner_responses(owner_id);
```

### Business Platform

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price_monthly decimal(10,2) NOT NULL,
    price_yearly decimal(10,2) NOT NULL,
    features jsonb NOT NULL DEFAULT '{}',
    limits jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_sort ON subscription_plans(sort_order);
```

#### restaurant_subscriptions
```sql
CREATE TABLE restaurant_subscriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    subscription_plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
    status text CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')) DEFAULT 'active',
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    auto_renew boolean DEFAULT true,
    payment_method_id text,
    billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_restaurant_subscriptions_restaurant ON restaurant_subscriptions(restaurant_id);
CREATE INDEX idx_restaurant_subscriptions_status ON restaurant_subscriptions(status);
CREATE INDEX idx_restaurant_subscriptions_expires ON restaurant_subscriptions(expires_at);
```

#### api_applications
```sql
CREATE TABLE api_applications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    developer_email text NOT NULL,
    developer_organization text,
    app_type text CHECK (app_type IN ('web', 'mobile', 'backend', 'webhook')) NOT NULL,
    status text CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
    api_key text NOT NULL UNIQUE,
    api_secret text NOT NULL,
    webhook_url text,
    allowed_origins text[] DEFAULT '{}',
    rate_limit_per_hour integer DEFAULT 1000,
    rate_limit_per_day integer DEFAULT 10000,
    scopes text[] DEFAULT '{}',
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_api_applications_api_key ON api_applications(api_key);
CREATE INDEX idx_api_applications_status ON api_applications(status);
CREATE INDEX idx_api_applications_developer ON api_applications(developer_email);
```

### Feature Flags System

#### feature_flags
```sql
CREATE TABLE feature_flags (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE, -- Unique identifier for the feature (e.g., 'social_features', 'gamification')
    display_name text NOT NULL, -- Human-readable name (e.g., 'Social Features', 'Gamification System')
    description text, -- Detailed description of what the feature does
    category text NOT NULL DEFAULT 'general', -- Category for organization (e.g., 'social', 'gamification', 'analytics')
    is_enabled boolean NOT NULL DEFAULT false, -- Whether the feature is currently enabled
    rollout_percentage integer NOT NULL DEFAULT 100, -- Percentage of users who should see this feature (0-100)
    target_audience jsonb DEFAULT '{}', -- JSON object defining target audience criteria
    dependencies text[], -- Array of feature names this feature depends on
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
```

#### feature_flag_overrides
```sql
CREATE TABLE feature_flag_overrides (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_enabled boolean NOT NULL, -- Override value for this specific user
    reason text, -- Reason for the override
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamp with time zone, -- Optional expiration date for temporary overrides

    UNIQUE(feature_flag_id, user_id)
);

-- Indexes
CREATE INDEX idx_feature_flag_overrides_user ON feature_flag_overrides(user_id);
CREATE INDEX idx_feature_flag_overrides_feature ON feature_flag_overrides(feature_flag_id);
```

#### feature_flag_usage
```sql
CREATE TABLE feature_flag_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL, -- Action performed (e.g., 'viewed', 'used', 'interacted')
    metadata jsonb DEFAULT '{}', -- Additional context about the usage
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_feature_flag_usage_feature ON feature_flag_usage(feature_flag_id);
CREATE INDEX idx_feature_flag_usage_user ON feature_flag_usage(user_id);
CREATE INDEX idx_feature_flag_usage_created ON feature_flag_usage(created_at);
```

#### feature_flag_audit_log
```sql
CREATE TABLE feature_flag_audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
    action text NOT NULL, -- 'created', 'updated', 'deleted', 'enabled', 'disabled'
    old_values jsonb, -- Previous state of the feature flag
    new_values jsonb, -- New state of the feature flag
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text, -- Reason for the change
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_feature_flag_audit_feature ON feature_flag_audit_log(feature_flag_id);
CREATE INDEX idx_feature_flag_audit_created ON feature_flag_audit_log(created_at);
```

---

## Indexes & Performance

### Query Optimization Indexes

#### Restaurant Search Optimization
```sql
-- Composite index for location-based restaurant search
CREATE INDEX idx_restaurants_location_search ON restaurants(latitude, longitude, cuisine_type, price_range) 
WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for cuisine and price filtering
CREATE INDEX idx_restaurants_cuisine_price ON restaurants(cuisine_type, price_range, average_rating) 
WHERE is_active = true;
```

#### Rating Analytics Optimization
```sql
-- Index for user rating history
CREATE INDEX idx_ratings_user_timeline ON ratings(user_id, created_at DESC);

-- Index for restaurant rating analytics
CREATE INDEX idx_ratings_restaurant_analytics ON ratings(menu_item_id, rating, created_at) 
INCLUDE (family_member_id);

-- Index for family analytics
CREATE INDEX idx_ratings_family_analytics ON ratings(user_id, family_member_id, created_at) 
INCLUDE (rating, menu_item_id);
```

#### Social Features Optimization
```sql
-- Index for activity feeds
CREATE INDEX idx_ratings_social_feed ON ratings(user_id, created_at DESC) 
WHERE created_at > (CURRENT_DATE - INTERVAL '30 days');

-- Index for follower activity
CREATE INDEX idx_social_activity ON ratings(user_id, created_at DESC) 
INCLUDE (menu_item_id, rating);
```

### Performance Monitoring

#### Index Usage Statistics
```sql
-- Query to monitor index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('restaurants', 'menu_items', 'ratings', 'family_members')
ORDER BY tablename, attname;
```

#### Slow Query Identification
```sql
-- Enable query logging for performance monitoring
-- (This would be configured at the database level)
```

---

## Row Level Security (RLS)

### Authentication Policies

#### User Profile Security
```sql
-- Users can only access their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Family Member Security
```sql
-- Users can only manage their own family members
CREATE POLICY "Users can view their own family members" ON family_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" ON family_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON family_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON family_members
    FOR DELETE USING (auth.uid() = user_id);
```

#### Rating Security
```sql
-- Users can only manage their own ratings
CREATE POLICY "Users can view their own ratings" ON ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Public read access to ratings for display
CREATE POLICY "Public can view ratings" ON ratings
    FOR SELECT USING (true);
```

### Business Logic Security

#### Restaurant Owner Verification
```sql
-- Only verified restaurant owners can respond to reviews
CREATE POLICY "Verified owners can respond" ON owner_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM restaurant_owners ro
            WHERE ro.id = owner_id 
            AND ro.verification_status = 'verified'
        )
    );
```

#### Privacy-Based Access Control
```sql
-- Respect family member privacy settings
CREATE POLICY "Respect privacy settings" ON family_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        privacy_level = 'public' OR 
        (privacy_level = 'friends' AND EXISTS (
            SELECT 1 FROM social_connections sc 
            WHERE sc.follower_id = auth.uid() 
            AND sc.following_id = user_id 
            AND sc.status = 'accepted'
        ))
    );
```

### Admin Policies

#### Administrative Access
```sql
-- Admin users can access all data
CREATE POLICY "Admins can access all restaurants" ON restaurants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );
```

### Feature Flags Security

#### Feature Flags Access Control
```sql
-- Public read access to enabled feature flags
CREATE POLICY "Public can view enabled feature flags" ON feature_flags
    FOR SELECT USING (is_enabled = true);

-- Admin users can manage all feature flags
CREATE POLICY "Admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );
```

#### Feature Flag Overrides Security
```sql
-- Users can only view their own overrides
CREATE POLICY "Users can view their own overrides" ON feature_flag_overrides
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own overrides
CREATE POLICY "Users can manage their own overrides" ON feature_flag_overrides
    FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all overrides
CREATE POLICY "Admins can manage all overrides" ON feature_flag_overrides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );
```

#### Feature Flag Usage Security
```sql
-- Users can only view their own usage data
CREATE POLICY "Users can view their own usage" ON feature_flag_usage
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert usage data for any user
CREATE POLICY "System can log usage" ON feature_flag_usage
    FOR INSERT WITH CHECK (true);

-- Admins can view all usage data
CREATE POLICY "Admins can view all usage" ON feature_flag_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );
```

#### Feature Flag Audit Log Security
```sql
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON feature_flag_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.user_role = 'admin'
        )
    );

-- System can insert audit logs
CREATE POLICY "System can create audit logs" ON feature_flag_audit_log
    FOR INSERT WITH CHECK (true);
```

---

## Database Functions

### Rating Calculation Functions

#### Update Restaurant Average Rating
```sql
CREATE OR REPLACE FUNCTION update_restaurant_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE restaurants SET 
        average_rating = (
            SELECT AVG(r.rating)::decimal(3,2)
            FROM ratings r 
            JOIN menu_items mi ON r.menu_item_id = mi.id 
            WHERE mi.restaurant_id = (
                SELECT restaurant_id FROM menu_items WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
            )
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM ratings r 
            JOIN menu_items mi ON r.menu_item_id = mi.id 
            WHERE mi.restaurant_id = (
                SELECT restaurant_id FROM menu_items WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
            )
        )
    WHERE id = (
        SELECT restaurant_id FROM menu_items WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

#### Update Menu Item Average Rating
```sql
CREATE OR REPLACE FUNCTION update_menu_item_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE menu_items SET 
        average_rating = (
            SELECT AVG(rating)::decimal(3,2)
            FROM ratings 
            WHERE menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM ratings 
            WHERE menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
        )
    WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### User Profile Functions

#### Auto-create User Profile
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name, phone_mobile, phone_home, phone_work)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone_mobile', ''),
        COALESCE(new.raw_user_meta_data->>'phone_home', ''),
        COALESCE(new.raw_user_meta_data->>'phone_work', '')
    );
    
    -- Create default user preferences
    INSERT INTO user_preferences (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Analytics Functions

#### Get Family Dining Analytics
```sql
CREATE OR REPLACE FUNCTION get_family_analytics(
    family_user_id uuid,
    time_range text DEFAULT 'month'
)
RETURNS jsonb AS $$
DECLARE
    start_date date;
    analytics_data jsonb;
BEGIN
    -- Calculate date range
    CASE time_range
        WHEN 'week' THEN start_date := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'month' THEN start_date := CURRENT_DATE - INTERVAL '30 days';
        WHEN 'quarter' THEN start_date := CURRENT_DATE - INTERVAL '90 days';
        WHEN 'year' THEN start_date := CURRENT_DATE - INTERVAL '365 days';
        ELSE start_date := CURRENT_DATE - INTERVAL '30 days';
    END CASE;
    
    -- Build analytics JSON
    SELECT jsonb_build_object(
        'overview', jsonb_build_object(
            'total_restaurants', (
                SELECT COUNT(DISTINCT mi.restaurant_id)
                FROM ratings r
                JOIN menu_items mi ON r.menu_item_id = mi.id
                WHERE r.user_id = family_user_id
                AND r.created_at >= start_date
            ),
            'total_ratings', (
                SELECT COUNT(*)
                FROM ratings r
                WHERE r.user_id = family_user_id
                AND r.created_at >= start_date
            ),
            'average_rating', (
                SELECT AVG(rating)::decimal(3,2)
                FROM ratings r
                WHERE r.user_id = family_user_id
                AND r.created_at >= start_date
            )
        ),
        'popular_restaurants', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'restaurant', row_to_json(rest),
                    'visit_count', visit_count,
                    'average_rating', avg_rating
                )
            )
            FROM (
                SELECT 
                    rest.*,
                    COUNT(*) as visit_count,
                    AVG(r.rating)::decimal(3,2) as avg_rating
                FROM ratings r
                JOIN menu_items mi ON r.menu_item_id = mi.id
                JOIN restaurants rest ON mi.restaurant_id = rest.id
                WHERE r.user_id = family_user_id
                AND r.created_at >= start_date
                GROUP BY rest.id
                ORDER BY visit_count DESC
                LIMIT 10
            ) popular
        )
    ) INTO analytics_data;
    
    RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Feature Flags Functions

#### check_feature_flag_enabled
```sql
CREATE OR REPLACE FUNCTION check_feature_flag_enabled(
    p_feature_name text,
    p_user_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
    v_feature_record record;
    v_override_record record;
    v_rollout_enabled boolean := false;
BEGIN
    -- Get the feature flag record
    SELECT * INTO v_feature_record
    FROM feature_flags
    WHERE name = p_feature_name;

    -- If feature doesn't exist, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- If feature is not enabled globally, return false
    IF NOT v_feature_record.is_enabled THEN
        RETURN false;
    END IF;

    -- Check for user-specific override
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO v_override_record
        FROM feature_flag_overrides
        WHERE feature_flag_id = v_feature_record.id
          AND user_id = p_user_id
          AND (expires_at IS NULL OR expires_at > NOW());

        IF FOUND THEN
            RETURN v_override_record.is_enabled;
        END IF;
    END IF;

    -- Check rollout percentage
    IF v_feature_record.rollout_percentage = 100 THEN
        RETURN true;
    ELSIF v_feature_record.rollout_percentage = 0 THEN
        RETURN false;
    ELSE
        -- Use user ID hash for consistent rollout distribution
        IF p_user_id IS NOT NULL THEN
            v_rollout_enabled := (abs(hashtext(p_user_id::text)) % 100) < v_feature_record.rollout_percentage;
        ELSE
            -- For anonymous users, use random distribution
            v_rollout_enabled := random() * 100 < v_feature_record.rollout_percentage;
        END IF;
        RETURN v_rollout_enabled;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### log_feature_flag_usage
```sql
CREATE OR REPLACE FUNCTION log_feature_flag_usage(
    p_feature_name text,
    p_user_id uuid,
    p_action text DEFAULT 'used',
    p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
DECLARE
    v_feature_id uuid;
BEGIN
    -- Get feature flag ID
    SELECT id INTO v_feature_id
    FROM feature_flags
    WHERE name = p_feature_name;

    -- Only log if feature exists
    IF FOUND THEN
        INSERT INTO feature_flag_usage (
            feature_flag_id,
            user_id,
            action,
            metadata
        ) VALUES (
            v_feature_id,
            p_user_id,
            p_action,
            p_metadata
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### update_feature_flag_updated_at
```sql
CREATE OR REPLACE FUNCTION update_feature_flag_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers & Automation

### Rating Update Triggers
```sql
-- Trigger to update menu item ratings when rating is inserted/updated/deleted
CREATE TRIGGER trigger_update_menu_item_rating
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_average_rating();

-- Trigger to update restaurant ratings when rating is inserted/updated/deleted
CREATE TRIGGER trigger_update_restaurant_rating
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_average_rating();
```

### Timestamp Update Triggers
```sql
-- Auto-update timestamp triggers for all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

### User Creation Trigger
```sql
-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

### Validation Triggers
```sql
-- Trigger to validate rating edits
CREATE OR REPLACE FUNCTION validate_rating_edit()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark as edited if rating or review text changed
    IF OLD.rating != NEW.rating OR COALESCE(OLD.review_text, '') != COALESCE(NEW.review_text, '') THEN
        NEW.is_edited = true;
        NEW.edited_at = timezone('utc'::text, now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_rating_edit
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION validate_rating_edit();
```

### Feature Flags Triggers

#### feature_flags_updated_at_trigger
```sql
CREATE TRIGGER feature_flags_updated_at_trigger
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flag_updated_at();
```

#### feature_flag_audit_trigger
```sql
CREATE OR REPLACE FUNCTION audit_feature_flag_changes()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feature_flag_audit_log (
            feature_flag_id,
            action,
            new_values,
            changed_by
        ) VALUES (
            NEW.id,
            'created',
            row_to_json(NEW),
            NEW.created_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO feature_flag_audit_log (
            feature_flag_id,
            action,
            old_values,
            new_values,
            changed_by
        ) VALUES (
            NEW.id,
            'updated',
            row_to_json(OLD),
            row_to_json(NEW),
            NEW.updated_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO feature_flag_audit_log (
            feature_flag_id,
            action,
            old_values,
            changed_by
        ) VALUES (
            OLD.id,
            'deleted',
            row_to_json(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER feature_flag_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION audit_feature_flag_changes();
```

---

## Data Migration

### Migration Scripts Structure
```sql
-- Migration versioning format: YYYYMMDD_HHMMSS_description.sql
-- Example: 20250823_143000_add_review_photos_table.sql

-- Migration template
BEGIN;

-- Add new feature
CREATE TABLE IF NOT EXISTS new_feature_table (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- columns...
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_feature_index ON new_feature_table(column_name);

-- Add RLS policies
ALTER TABLE new_feature_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy_name" ON new_feature_table FOR SELECT USING (auth.uid() = user_id);

-- Update version
INSERT INTO schema_migrations (version, description) VALUES ('20250823_143000', 'Add review photos table');

COMMIT;
```

### Common Migration Patterns

#### Adding New Column
```sql
-- Safe column addition
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_column text;

-- Add index if needed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_existing_table_new_column 
ON existing_table(new_column);
```

#### Data Transformation
```sql
-- Safe data migration
UPDATE existing_table 
SET new_column = CASE 
    WHEN old_column = 'value1' THEN 'new_value1'
    WHEN old_column = 'value2' THEN 'new_value2'
    ELSE 'default_value'
END
WHERE new_column IS NULL;
```

---

## Backup & Recovery

### Backup Strategy

#### Automated Backups (Supabase)
- **Daily backups**: Automatic daily database snapshots
- **Point-in-time recovery**: Up to 7 days for Pro plan
- **Cross-region replication**: Geographic redundancy

#### Manual Backup Scripts
```bash
# Create manual backup
pg_dump postgresql://user:password@db.supabase.co:5432/postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump -t ratings -t restaurants -t menu_items postgresql://connection_string > core_data_backup.sql
```

### Recovery Procedures

#### Full Database Restore
```bash
# Restore from backup file
psql postgresql://connection_string < backup_file.sql
```

#### Selective Data Recovery
```sql
-- Restore specific user data
COPY ratings FROM '/path/to/ratings_backup.csv' WITH CSV HEADER;
```

### Data Retention Policies

#### Audit Trail Retention
```sql
-- Archive old audit records (>2 years)
CREATE TABLE ratings_archive AS 
SELECT * FROM ratings 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

DELETE FROM ratings 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';
```

#### Privacy Compliance
```sql
-- User data deletion for GDPR compliance
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Delete user ratings and reviews
    DELETE FROM ratings WHERE user_id = user_uuid;
    
    -- Delete family members
    DELETE FROM family_members WHERE user_id = user_uuid;
    
    -- Delete user preferences
    DELETE FROM user_preferences WHERE user_id = user_uuid;
    
    -- Delete user profile
    DELETE FROM user_profiles WHERE id = user_uuid;
    
    -- Note: auth.users deletion handled by Supabase Auth
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Related Documentation

- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Security Documentation](./TECHNICAL_SECURITY_DOCUMENTATION.md)
- [Integration Documentation](./TECHNICAL_INTEGRATIONS_DOCUMENTATION.md)

---

## Version Information

- **Schema Version**: 1.0
- **Database Engine**: PostgreSQL 15+ (Supabase)
- **Last Updated**: August 2025

---

*For database administration support, contact our technical team at db-admin@yumzoom.com*
