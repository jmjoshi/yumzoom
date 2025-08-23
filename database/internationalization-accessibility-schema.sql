-- YumZoom Internationalization & Accessibility Schema
-- This file contains database schema for i18n and accessibility features

-- ============================
-- INTERNATIONALIZATION TABLES
-- ============================

-- Table for storing cuisine type translations
CREATE TABLE IF NOT EXISTS cuisine_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuisine_id UUID NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cuisine_id, locale)
);

-- Table for storing restaurant translations
CREATE TABLE IF NOT EXISTS restaurant_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, locale)
);

-- Table for storing review translations
CREATE TABLE IF NOT EXISTS review_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    translated_by VARCHAR(10) DEFAULT 'auto' CHECK (translated_by IN ('auto', 'human')),
    translator_id UUID REFERENCES auth.users(id),
    quality_score DECIMAL(3,2) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, locale)
);

-- Table for storing menu item translations
CREATE TABLE IF NOT EXISTS menu_item_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    ingredients TEXT,
    allergen_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, locale)
);

-- Table for storing user locale preferences
CREATE TABLE IF NOT EXISTS user_locale_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_locale VARCHAR(5) NOT NULL DEFAULT 'en',
    fallback_locale VARCHAR(5) DEFAULT 'en',
    auto_translate BOOLEAN DEFAULT TRUE,
    translation_quality_preference VARCHAR(10) DEFAULT 'auto' CHECK (translation_quality_preference IN ('auto', 'human')),
    date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
    time_format VARCHAR(10) DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    currency_preference VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================
-- ACCESSIBILITY TABLES
-- ============================

-- Table for storing restaurant accessibility information
CREATE TABLE IF NOT EXISTS restaurant_accessibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    hearing_loop BOOLEAN DEFAULT FALSE,
    braille_menu BOOLEAN DEFAULT FALSE,
    accessible_parking BOOLEAN DEFAULT FALSE,
    accessible_restroom BOOLEAN DEFAULT FALSE,
    sign_language_service BOOLEAN DEFAULT FALSE,
    large_print_menu BOOLEAN DEFAULT FALSE,
    service_animals_welcome BOOLEAN DEFAULT FALSE,
    elevator_access BOOLEAN DEFAULT FALSE,
    accessible_entrance BOOLEAN DEFAULT FALSE,
    accessible_seating BOOLEAN DEFAULT FALSE,
    tactile_indicators BOOLEAN DEFAULT FALSE,
    accessibility_notes TEXT,
    last_verified TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_source VARCHAR(50), -- 'owner', 'customer', 'accessibility_expert', 'staff'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- Table for storing user accessibility preferences
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra-large')),
    contrast_level VARCHAR(20) DEFAULT 'normal' CHECK (contrast_level IN ('normal', 'high', 'extra-high')),
    motion_reduced BOOLEAN DEFAULT FALSE,
    screen_reader_enabled BOOLEAN DEFAULT FALSE,
    keyboard_navigation BOOLEAN DEFAULT FALSE,
    color_blindness VARCHAR(20) DEFAULT 'none' CHECK (color_blindness IN ('none', 'protanopia', 'deuteranopia', 'tritanopia')),
    visual_acuity VARCHAR(20) DEFAULT 'normal' CHECK (visual_acuity IN ('normal', 'low-vision', 'blind')),
    hearing_level VARCHAR(20) DEFAULT 'normal' CHECK (hearing_level IN ('normal', 'hard-of-hearing', 'deaf')),
    motor_skills VARCHAR(20) DEFAULT 'normal' CHECK (motor_skills IN ('normal', 'limited-mobility', 'voice-control')),
    cognitive_level VARCHAR(20) DEFAULT 'normal' CHECK (cognitive_level IN ('normal', 'learning-disability', 'memory-impairment')),
    preferred_input_method VARCHAR(20) DEFAULT 'mouse' CHECK (preferred_input_method IN ('mouse', 'keyboard', 'touch', 'voice', 'eye-tracking')),
    language_simplification BOOLEAN DEFAULT FALSE,
    focus_indicators_enhanced BOOLEAN DEFAULT FALSE,
    autoplay_disabled BOOLEAN DEFAULT FALSE,
    captions_enabled BOOLEAN DEFAULT FALSE,
    sign_language_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table for storing accessibility reports and issues
CREATE TABLE IF NOT EXISTS accessibility_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('accessibility_issue', 'accessibility_improvement', 'verification_update')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('mobility', 'vision', 'hearing', 'cognitive', 'general')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    location_details TEXT, -- Specific location within restaurant
    suggested_solution TEXT,
    photos JSON, -- Array of photo URLs
    contact_info JSON, -- Reporter contact info if they want updates
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for accessibility feature ratings by users
CREATE TABLE IF NOT EXISTS accessibility_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE, -- Whether the user actually visited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, user_id, feature)
);

-- ============================
-- CONTENT MODERATION FOR I18N
-- ============================

-- Table for moderating translated content
CREATE TABLE IF NOT EXISTS translation_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('restaurant', 'review', 'menu_item', 'cuisine')),
    content_id UUID NOT NULL,
    locale VARCHAR(5) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    translation_method VARCHAR(10) NOT NULL CHECK (translation_method IN ('auto', 'human')),
    quality_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
    moderator_id UUID REFERENCES auth.users(id),
    moderation_notes TEXT,
    flagged_reasons JSON, -- Array of flagging reasons
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- Internationalization indexes
CREATE INDEX IF NOT EXISTS idx_cuisine_translations_cuisine_locale ON cuisine_translations(cuisine_id, locale);
CREATE INDEX IF NOT EXISTS idx_restaurant_translations_restaurant_locale ON restaurant_translations(restaurant_id, locale);
CREATE INDEX IF NOT EXISTS idx_review_translations_review_locale ON review_translations(review_id, locale);
CREATE INDEX IF NOT EXISTS idx_menu_item_translations_item_locale ON menu_item_translations(menu_item_id, locale);
CREATE INDEX IF NOT EXISTS idx_user_locale_preferences_user ON user_locale_preferences(user_id);

-- Accessibility indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_accessibility_restaurant ON restaurant_accessibility(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_accessibility_features ON restaurant_accessibility(wheelchair_accessible, hearing_loop, braille_menu);
CREATE INDEX IF NOT EXISTS idx_user_accessibility_preferences_user ON user_accessibility_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_reports_restaurant ON accessibility_reports(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_reports_status ON accessibility_reports(status);
CREATE INDEX IF NOT EXISTS idx_accessibility_ratings_restaurant ON accessibility_ratings(restaurant_id);

-- Translation moderation indexes
CREATE INDEX IF NOT EXISTS idx_translation_moderation_content ON translation_moderation(content_type, content_id, locale);
CREATE INDEX IF NOT EXISTS idx_translation_moderation_status ON translation_moderation(status);

-- ============================
-- ROW LEVEL SECURITY POLICIES
-- ============================

-- Enable RLS on all tables
ALTER TABLE cuisine_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locale_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_accessibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accessibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_moderation ENABLE ROW LEVEL SECURITY;

-- Cuisine translations policies
CREATE POLICY "Anyone can read cuisine translations" ON cuisine_translations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create cuisine translations" ON cuisine_translations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own cuisine translations" ON cuisine_translations FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM restaurants WHERE id = cuisine_id) OR auth.jwt() ->> 'role' = 'admin');

-- Restaurant translations policies
CREATE POLICY "Anyone can read restaurant translations" ON restaurant_translations FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their translations" ON restaurant_translations FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM restaurants WHERE id = restaurant_id) OR 
    auth.jwt() ->> 'role' = 'admin'
);

-- Review translations policies
CREATE POLICY "Anyone can read review translations" ON review_translations FOR SELECT USING (true);
CREATE POLICY "Users can create translations for any review" ON review_translations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own translations" ON review_translations FOR UPDATE USING (translator_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Menu item translations policies
CREATE POLICY "Anyone can read menu item translations" ON menu_item_translations FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage menu item translations" ON menu_item_translations FOR ALL USING (
    auth.uid() IN (
        SELECT r.owner_id FROM restaurants r 
        JOIN menu_items mi ON mi.restaurant_id = r.id 
        WHERE mi.id = menu_item_id
    ) OR auth.jwt() ->> 'role' = 'admin'
);

-- User locale preferences policies
CREATE POLICY "Users can manage their own locale preferences" ON user_locale_preferences FOR ALL USING (user_id = auth.uid());

-- Restaurant accessibility policies
CREATE POLICY "Anyone can read restaurant accessibility" ON restaurant_accessibility FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their accessibility info" ON restaurant_accessibility FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM restaurants WHERE id = restaurant_id) OR 
    auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "Verified users can update accessibility info" ON restaurant_accessibility FOR UPDATE USING (auth.role() = 'authenticated');

-- User accessibility preferences policies
CREATE POLICY "Users can manage their own accessibility preferences" ON user_accessibility_preferences FOR ALL USING (user_id = auth.uid());

-- Accessibility reports policies
CREATE POLICY "Anyone can read accessibility reports" ON accessibility_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create accessibility reports" ON accessibility_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Report authors and admins can update reports" ON accessibility_reports FOR UPDATE USING (reporter_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Accessibility ratings policies
CREATE POLICY "Anyone can read accessibility ratings" ON accessibility_ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage their own accessibility ratings" ON accessibility_ratings FOR ALL USING (user_id = auth.uid());

-- Translation moderation policies
CREATE POLICY "Anyone can read approved translations" ON translation_moderation FOR SELECT USING (status = 'approved');
CREATE POLICY "Moderators can manage all translation moderation" ON translation_moderation FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

-- ============================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================

-- Function to get restaurant with accessibility info
CREATE OR REPLACE FUNCTION get_restaurant_with_accessibility(restaurant_uuid UUID, user_locale VARCHAR(5) DEFAULT 'en')
RETURNS JSON AS $$
DECLARE
    restaurant_data JSON;
BEGIN
    SELECT json_build_object(
        'restaurant', row_to_json(r),
        'translation', row_to_json(rt),
        'accessibility', row_to_json(ra)
    ) INTO restaurant_data
    FROM restaurants r
    LEFT JOIN restaurant_translations rt ON rt.restaurant_id = r.id AND rt.locale = user_locale
    LEFT JOIN restaurant_accessibility ra ON ra.restaurant_id = r.id
    WHERE r.id = restaurant_uuid;
    
    RETURN restaurant_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get accessibility features count for a restaurant
CREATE OR REPLACE FUNCTION get_accessibility_features_count(restaurant_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    feature_count INTEGER;
BEGIN
    SELECT (
        CASE WHEN wheelchair_accessible THEN 1 ELSE 0 END +
        CASE WHEN hearing_loop THEN 1 ELSE 0 END +
        CASE WHEN braille_menu THEN 1 ELSE 0 END +
        CASE WHEN accessible_parking THEN 1 ELSE 0 END +
        CASE WHEN accessible_restroom THEN 1 ELSE 0 END +
        CASE WHEN sign_language_service THEN 1 ELSE 0 END +
        CASE WHEN large_print_menu THEN 1 ELSE 0 END +
        CASE WHEN service_animals_welcome THEN 1 ELSE 0 END
    ) INTO feature_count
    FROM restaurant_accessibility
    WHERE restaurant_id = restaurant_uuid;
    
    RETURN COALESCE(feature_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update translation updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updating timestamps
CREATE TRIGGER update_cuisine_translations_timestamp
    BEFORE UPDATE ON cuisine_translations
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

CREATE TRIGGER update_restaurant_translations_timestamp
    BEFORE UPDATE ON restaurant_translations
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

CREATE TRIGGER update_menu_item_translations_timestamp
    BEFORE UPDATE ON menu_item_translations
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

CREATE TRIGGER update_user_locale_preferences_timestamp
    BEFORE UPDATE ON user_locale_preferences
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

CREATE TRIGGER update_restaurant_accessibility_timestamp
    BEFORE UPDATE ON restaurant_accessibility
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

CREATE TRIGGER update_user_accessibility_preferences_timestamp
    BEFORE UPDATE ON user_accessibility_preferences
    FOR EACH ROW EXECUTE FUNCTION update_translation_timestamp();

-- ============================
-- SAMPLE DATA FOR TESTING
-- ============================

-- Insert sample accessibility data for existing restaurants
INSERT INTO restaurant_accessibility (restaurant_id, wheelchair_accessible, hearing_loop, braille_menu, accessible_parking, accessible_restroom, service_animals_welcome, accessibility_notes)
SELECT 
    id,
    (random() > 0.3)::boolean, -- 70% chance of wheelchair accessibility
    (random() > 0.8)::boolean, -- 20% chance of hearing loop
    (random() > 0.9)::boolean, -- 10% chance of braille menu
    (random() > 0.4)::boolean, -- 60% chance of accessible parking
    (random() > 0.5)::boolean, -- 50% chance of accessible restroom
    (random() > 0.2)::boolean, -- 80% chance of service animals welcome
    CASE 
        WHEN random() > 0.7 THEN 'This restaurant is committed to accessibility and welcomes guests with disabilities.'
        WHEN random() > 0.4 THEN 'Some accessibility features available. Please call ahead for specific needs.'
        ELSE NULL
    END
FROM restaurants
WHERE id NOT IN (SELECT restaurant_id FROM restaurant_accessibility)
LIMIT 10;

-- Insert sample locale preferences for some users
INSERT INTO user_locale_preferences (user_id, preferred_locale, auto_translate, currency_preference)
SELECT 
    id,
    CASE 
        WHEN random() > 0.8 THEN 'es'
        WHEN random() > 0.6 THEN 'fr'
        WHEN random() > 0.4 THEN 'de'
        ELSE 'en'
    END,
    (random() > 0.3)::boolean, -- 70% want auto-translate
    CASE 
        WHEN random() > 0.8 THEN 'EUR'
        WHEN random() > 0.6 THEN 'GBP'
        ELSE 'USD'
    END
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_locale_preferences)
LIMIT 5;

COMMENT ON SCHEMA public IS 'YumZoom Internationalization & Accessibility Schema - Comprehensive support for multi-language content and accessibility features';
