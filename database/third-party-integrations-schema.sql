-- Third-Party Integrations Schema
-- This script creates tables to support calendar, reservation, delivery, and social media integrations

-- User integrations table to store third-party service connections
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'calendar', 'reservation', 'delivery', 'social'
    provider VARCHAR(50) NOT NULL, -- 'google', 'outlook', 'opentable', 'resy', etc.
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- Provider-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, integration_type, provider)
);

-- Reservations table to track reservation attempts and confirmations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    special_requests TEXT,
    provider VARCHAR(50) NOT NULL, -- 'opentable', 'resy', 'direct', etc.
    external_reservation_id VARCHAR(255), -- ID from external system
    confirmation_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure reservation is in the future (at creation time)
    CONSTRAINT future_reservation CHECK (
        (reservation_date > CURRENT_DATE) OR 
        (reservation_date = CURRENT_DATE AND reservation_time > CURRENT_TIME)
    )
);

-- Reservation attempts table for analytics (separate from confirmed reservations)
CREATE TABLE IF NOT EXISTS reservation_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    party_size INTEGER NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    attempted_providers TEXT[], -- Array of providers attempted
    success_provider VARCHAR(50), -- Which provider succeeded (if any)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events table to track YumZoom-created calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL, -- 'google', 'outlook', etc.
    external_event_id VARCHAR(255) NOT NULL, -- ID from calendar system
    event_title VARCHAR(500) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider, external_event_id)
);

-- Social sharing activity table for analytics
CREATE TABLE IF NOT EXISTS social_sharing_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'instagram', etc.
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    has_review BOOLEAN DEFAULT false,
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for analytics queries
    INDEX idx_social_sharing_restaurant_date (restaurant_id, shared_at),
    INDEX idx_social_sharing_platform_date (platform, shared_at)
);

-- Delivery tracking table (for analytics and user history)
CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL, -- 'doordash', 'ubereats', 'grubhub', etc.
    external_order_id VARCHAR(255), -- If available from provider
    order_value DECIMAL(10,2),
    delivery_fee DECIMAL(10,2),
    delivery_time_estimate VARCHAR(50),
    clicked_at TIMESTAMPTZ DEFAULT NOW(), -- When user clicked to order
    completed_at TIMESTAMPTZ, -- If we can track completion
    
    INDEX idx_delivery_restaurant_date (restaurant_id, clicked_at),
    INDEX idx_delivery_provider_date (provider, clicked_at)
);

-- Integration settings table for system-wide configuration
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}', -- API keys, endpoints, etc.
    rate_limits JSONB DEFAULT '{}', -- Rate limiting configuration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(integration_type, provider)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_type ON user_integrations(user_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_user_integrations_active ON user_integrations(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_date ON reservations(user_id, reservation_date) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_restaurant ON calendar_events(restaurant_id);

-- Row Level Security (RLS) policies

-- User integrations: Users can only see their own integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations" ON user_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON user_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON user_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON user_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Reservations: Users can see their own reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert reservations" ON reservations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

-- Calendar events: Users can only see their own events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Social sharing activity: Public read, authenticated write
ALTER TABLE social_sharing_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social sharing activity" ON social_sharing_activity
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert social sharing activity" ON social_sharing_activity
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Delivery orders: Users can see their own orders
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery orders" ON delivery_orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert delivery orders" ON delivery_orders
    FOR INSERT WITH CHECK (true);

-- Integration settings: Admin only
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage integration settings" ON integration_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Insert default integration settings
INSERT INTO integration_settings (integration_type, provider, is_enabled, configuration) VALUES
-- Calendar integrations
('calendar', 'google', true, '{"scopes": ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"]}'),
('calendar', 'outlook', true, '{"scopes": ["https://graph.microsoft.com/calendars.readwrite"]}'),

-- Reservation integrations
('reservation', 'opentable', true, '{"supports_api": true, "website": "https://www.opentable.com"}'),
('reservation', 'resy', true, '{"supports_api": false, "website": "https://resy.com"}'),
('reservation', 'yelp', true, '{"supports_api": false, "website": "https://www.yelp.com"}'),

-- Delivery integrations
('delivery', 'doordash', true, '{"name": "DoorDash", "delivery_time": "25-40 min", "avg_fee": 2.99}'),
('delivery', 'ubereats', true, '{"name": "Uber Eats", "delivery_time": "20-35 min", "avg_fee": 3.49}'),
('delivery', 'grubhub', true, '{"name": "Grubhub", "delivery_time": "30-45 min", "avg_fee": 2.49}'),

-- Social media integrations
('social', 'facebook', true, '{"share_url": "https://www.facebook.com/sharer/sharer.php"}'),
('social', 'twitter', true, '{"share_url": "https://twitter.com/intent/tweet"}'),
('social', 'instagram', true, '{"supports_direct_sharing": false}'),
('social', 'whatsapp', true, '{"share_url": "https://wa.me/"}'),
('social', 'linkedin', true, '{"share_url": "https://www.linkedin.com/sharing/share-offsite/"}')
