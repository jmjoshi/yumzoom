-- Future Technology Features Database Schema
-- Supports AR discovery, Voice assistant, IoT connectivity, and Blockchain authenticity

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AR Restaurant Discovery Tables
CREATE TABLE ar_discovery_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    device_orientation JSONB, -- {alpha, beta, gamma}
    restaurants_discovered INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    session_duration_seconds INTEGER,
    ar_settings JSONB DEFAULT '{}', -- User AR preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ar_restaurant_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ar_discovery_sessions(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'select', 'get_directions', 'call', 'favorite'
    interaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_duration_seconds INTEGER,
    ar_position JSONB, -- {x, y, z, bearing}
    device_orientation JSONB,
    distance_meters DECIMAL(8, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Assistant Integration Tables
CREATE TABLE voice_assistant_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50), -- 'web', 'alexa', 'google', 'siri', 'cortana'
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    language_code VARCHAR(10) DEFAULT 'en-US',
    voice_commands_count INTEGER DEFAULT 0,
    successful_commands INTEGER DEFAULT 0,
    session_duration_seconds INTEGER,
    assistant_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voice_assistant_sessions(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    intent VARCHAR(100), -- 'restaurant_search', 'navigation', 'reservation', etc.
    parameters JSONB DEFAULT '{}',
    confidence_score DECIMAL(4, 3),
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    action_taken VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE smart_speaker_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'alexa', 'google', 'siri', 'cortana'
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    capabilities JSONB DEFAULT '[]',
    connected BOOLEAN DEFAULT FALSE,
    last_connected TIMESTAMP WITH TIME ZONE,
    connection_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT Device Connectivity Tables
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'smart_speaker', 'smart_display', 'smart_fridge', etc.
    brand VARCHAR(100),
    model VARCHAR(100),
    device_id VARCHAR(255) UNIQUE,
    capabilities JSONB DEFAULT '[]',
    location VARCHAR(255),
    connected BOOLEAN DEFAULT FALSE,
    online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER, -- 0-100
    firmware_version VARCHAR(50),
    device_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iot_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- 'location', 'time', 'manual', 'restaurant_action'
    trigger_condition JSONB NOT NULL,
    actions JSONB NOT NULL, -- Array of device actions
    enabled BOOLEAN DEFAULT TRUE,
    execution_count INTEGER DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE iot_scenario_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES iot_scenarios(id) ON DELETE CASCADE,
    trigger_context JSONB,
    executed_actions JSONB,
    execution_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_end TIMESTAMP WITH TIME ZONE,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    devices_affected INTEGER DEFAULT 0
);

-- Blockchain Review Authenticity Tables
CREATE TABLE blockchain_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    blockchain_hash VARCHAR(66) UNIQUE NOT NULL, -- 0x + 64 hex chars
    previous_hash VARCHAR(66) NOT NULL,
    merkle_root VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_id VARCHAR(66) NOT NULL,
    gas_used INTEGER,
    confirmations INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    immutable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_score INTEGER DEFAULT 0, -- 0-100
    verification_factors JSONB DEFAULT '{}', -- {location: true, timestamp: true, ...}
    verification_proofs JSONB DEFAULT '[]',
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    verifier_type VARCHAR(50), -- 'automated', 'community', 'manual'
    verifier_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_authenticity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    authenticity_score INTEGER DEFAULT 0, -- 0-100
    uniqueness_score INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    timeliness_score INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    authenticity_flags JSONB DEFAULT '[]',
    risk_indicators JSONB DEFAULT '{}',
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE blockchain_network_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_name VARCHAR(100) DEFAULT 'YumZoom-Chain',
    block_height BIGINT NOT NULL,
    total_transactions BIGINT DEFAULT 0,
    network_hash_rate VARCHAR(50),
    average_block_time INTEGER, -- seconds
    gas_price VARCHAR(50),
    network_health_score DECIMAL(5, 2) DEFAULT 0,
    consensus_participation DECIMAL(5, 2) DEFAULT 0,
    active_nodes INTEGER DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Future Tech Usage Analytics Tables
CREATE TABLE future_tech_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL, -- 'ar_discovery', 'voice_assistant', 'iot_connectivity', 'blockchain_authenticity'
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    total_duration_seconds INTEGER DEFAULT 0,
    satisfaction_rating INTEGER, -- 1-5
    feature_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, feature_type, usage_date)
);

CREATE TABLE feature_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'bug_report', 'feature_request', 'satisfaction', 'suggestion'
    rating INTEGER, -- 1-5
    comment TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'implemented', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ar_discovery_sessions_user_id ON ar_discovery_sessions(user_id);
CREATE INDEX idx_ar_discovery_sessions_location ON ar_discovery_sessions(location_lat, location_lng);
CREATE INDEX idx_ar_restaurant_interactions_session_id ON ar_restaurant_interactions(session_id);
CREATE INDEX idx_ar_restaurant_interactions_restaurant_id ON ar_restaurant_interactions(restaurant_id);

CREATE INDEX idx_voice_assistant_sessions_user_id ON voice_assistant_sessions(user_id);
CREATE INDEX idx_voice_assistant_sessions_platform ON voice_assistant_sessions(platform);
CREATE INDEX idx_voice_commands_session_id ON voice_commands(session_id);
CREATE INDEX idx_voice_commands_intent ON voice_commands(intent);

CREATE INDEX idx_smart_speaker_connections_user_id ON smart_speaker_connections(user_id);
CREATE INDEX idx_smart_speaker_connections_platform ON smart_speaker_connections(platform);

CREATE INDEX idx_iot_devices_user_id ON iot_devices(user_id);
CREATE INDEX idx_iot_devices_type ON iot_devices(device_type);
CREATE INDEX idx_iot_devices_connected ON iot_devices(connected);

CREATE INDEX idx_iot_scenarios_user_id ON iot_scenarios(user_id);
CREATE INDEX idx_iot_scenarios_trigger_type ON iot_scenarios(trigger_type);
CREATE INDEX idx_iot_scenario_executions_scenario_id ON iot_scenario_executions(scenario_id);

CREATE INDEX idx_blockchain_reviews_review_id ON blockchain_reviews(review_id);
CREATE INDEX idx_blockchain_reviews_hash ON blockchain_reviews(blockchain_hash);
CREATE INDEX idx_blockchain_reviews_block_number ON blockchain_reviews(block_number);

CREATE INDEX idx_review_verification_review_id ON review_verification(review_id);
CREATE INDEX idx_review_verification_status ON review_verification(verification_status);

CREATE INDEX idx_review_authenticity_review_id ON review_authenticity(review_id);
CREATE INDEX idx_review_authenticity_score ON review_authenticity(authenticity_score);

CREATE INDEX idx_future_tech_usage_user_feature ON future_tech_usage(user_id, feature_type);
CREATE INDEX idx_future_tech_usage_date ON future_tech_usage(usage_date);
CREATE INDEX idx_feature_feedback_feature_type ON feature_feedback(feature_type);

-- Row Level Security (RLS) Policies
ALTER TABLE ar_discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_restaurant_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_speaker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_scenario_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_authenticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_tech_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AR Discovery
CREATE POLICY "Users can manage their own AR sessions"
    ON ar_discovery_sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view AR interactions for their sessions"
    ON ar_restaurant_interactions FOR ALL
    USING (
        session_id IN (
            SELECT id FROM ar_discovery_sessions WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for Voice Assistant
CREATE POLICY "Users can manage their own voice sessions"
    ON voice_assistant_sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view voice commands for their sessions"
    ON voice_commands FOR ALL
    USING (
        session_id IN (
            SELECT id FROM voice_assistant_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their smart speaker connections"
    ON smart_speaker_connections FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for IoT Connectivity
CREATE POLICY "Users can manage their own IoT devices"
    ON iot_devices FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own IoT scenarios"
    ON iot_scenarios FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view executions for their scenarios"
    ON iot_scenario_executions FOR ALL
    USING (
        scenario_id IN (
            SELECT id FROM iot_scenarios WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for Blockchain Authenticity
CREATE POLICY "Users can view blockchain data for their reviews"
    ON blockchain_reviews FOR SELECT
    USING (
        review_id IN (
            SELECT id FROM reviews WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view verification data for their reviews"
    ON review_verification FOR SELECT
    USING (
        review_id IN (
            SELECT id FROM reviews WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view authenticity data for their reviews"
    ON review_authenticity FOR SELECT
    USING (
        review_id IN (
            SELECT id FROM reviews WHERE user_id = auth.uid()
        )
    );

-- Allow all users to read blockchain network stats
CREATE POLICY "Anyone can view blockchain network stats"
    ON blockchain_network_stats FOR SELECT
    USING (true);

-- RLS Policies for Usage Analytics
CREATE POLICY "Users can manage their own usage data"
    ON future_tech_usage FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback"
    ON feature_feedback FOR ALL
    USING (auth.uid() = user_id);

-- Functions for analytics and automation

-- Function to calculate AR discovery metrics
CREATE OR REPLACE FUNCTION get_ar_discovery_metrics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_sessions BIGINT,
    total_discoveries BIGINT,
    average_session_duration NUMERIC,
    most_popular_interaction VARCHAR,
    total_distance_explored NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id)::BIGINT as total_sessions,
        COALESCE(SUM(s.restaurants_discovered), 0)::BIGINT as total_discoveries,
        COALESCE(AVG(s.session_duration_seconds), 0)::NUMERIC as average_session_duration,
        COALESCE(
            (SELECT interaction_type 
             FROM ar_restaurant_interactions i
             JOIN ar_discovery_sessions s2 ON i.session_id = s2.id
             WHERE (user_uuid IS NULL OR s2.user_id = user_uuid)
             GROUP BY interaction_type 
             ORDER BY COUNT(*) DESC 
             LIMIT 1), 
            'none'
        )::VARCHAR as most_popular_interaction,
        COALESCE(
            (SELECT SUM(distance_meters) 
             FROM ar_restaurant_interactions i
             JOIN ar_discovery_sessions s2 ON i.session_id = s2.id
             WHERE (user_uuid IS NULL OR s2.user_id = user_uuid)
            ), 0
        )::NUMERIC as total_distance_explored
    FROM ar_discovery_sessions s
    WHERE (user_uuid IS NULL OR s.user_id = user_uuid);
END;
$$;

-- Function to calculate voice assistant metrics
CREATE OR REPLACE FUNCTION get_voice_assistant_metrics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_sessions BIGINT,
    total_commands BIGINT,
    success_rate NUMERIC,
    average_confidence NUMERIC,
    most_common_intent VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id)::BIGINT as total_sessions,
        COALESCE(SUM(s.voice_commands_count), 0)::BIGINT as total_commands,
        CASE 
            WHEN SUM(s.voice_commands_count) > 0 
            THEN (SUM(s.successful_commands)::NUMERIC / SUM(s.voice_commands_count) * 100)
            ELSE 0 
        END as success_rate,
        COALESCE(
            (SELECT AVG(confidence_score) 
             FROM voice_commands c
             JOIN voice_assistant_sessions s2 ON c.session_id = s2.id
             WHERE (user_uuid IS NULL OR s2.user_id = user_uuid)
            ), 0
        )::NUMERIC as average_confidence,
        COALESCE(
            (SELECT intent 
             FROM voice_commands c
             JOIN voice_assistant_sessions s2 ON c.session_id = s2.id
             WHERE (user_uuid IS NULL OR s2.user_id = user_uuid) AND intent IS NOT NULL
             GROUP BY intent 
             ORDER BY COUNT(*) DESC 
             LIMIT 1), 
            'none'
        )::VARCHAR as most_common_intent
    FROM voice_assistant_sessions s
    WHERE (user_uuid IS NULL OR s.user_id = user_uuid);
END;
$$;

-- Function to get blockchain review statistics
CREATE OR REPLACE FUNCTION get_blockchain_review_stats()
RETURNS TABLE (
    total_reviews BIGINT,
    verified_reviews BIGINT,
    average_verification_score NUMERIC,
    average_authenticity_score NUMERIC,
    total_blocks BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT br.review_id)::BIGINT as total_reviews,
        COUNT(DISTINCT CASE WHEN br.verified = true THEN br.review_id END)::BIGINT as verified_reviews,
        COALESCE(AVG(rv.verification_score), 0)::NUMERIC as average_verification_score,
        COALESCE(AVG(ra.authenticity_score), 0)::NUMERIC as average_authenticity_score,
        COUNT(DISTINCT br.block_number)::BIGINT as total_blocks
    FROM blockchain_reviews br
    LEFT JOIN review_verification rv ON br.review_id = rv.review_id
    LEFT JOIN review_authenticity ra ON br.review_id = ra.review_id;
END;
$$;

-- Function to update future tech usage statistics
CREATE OR REPLACE FUNCTION update_tech_usage(
    p_user_id UUID,
    p_feature_type VARCHAR,
    p_duration_seconds INTEGER DEFAULT 0,
    p_satisfaction_rating INTEGER DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO future_tech_usage (
        user_id, 
        feature_type, 
        usage_count, 
        total_duration_seconds, 
        satisfaction_rating
    ) VALUES (
        p_user_id, 
        p_feature_type, 
        1, 
        p_duration_seconds, 
        p_satisfaction_rating
    )
    ON CONFLICT (user_id, feature_type, usage_date) 
    DO UPDATE SET 
        usage_count = future_tech_usage.usage_count + 1,
        total_duration_seconds = future_tech_usage.total_duration_seconds + p_duration_seconds,
        satisfaction_rating = COALESCE(EXCLUDED.satisfaction_rating, future_tech_usage.satisfaction_rating),
        updated_at = NOW();
END;
$$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_ar_discovery_sessions_updated_at 
    BEFORE UPDATE ON ar_discovery_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_assistant_sessions_updated_at 
    BEFORE UPDATE ON voice_assistant_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_speaker_connections_updated_at 
    BEFORE UPDATE ON smart_speaker_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iot_devices_updated_at 
    BEFORE UPDATE ON iot_devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iot_scenarios_updated_at 
    BEFORE UPDATE ON iot_scenarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blockchain_reviews_updated_at 
    BEFORE UPDATE ON blockchain_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_verification_updated_at 
    BEFORE UPDATE ON review_verification 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_authenticity_updated_at 
    BEFORE UPDATE ON review_authenticity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_future_tech_usage_updated_at 
    BEFORE UPDATE ON future_tech_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_feedback_updated_at 
    BEFORE UPDATE ON feature_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial blockchain network stats
INSERT INTO blockchain_network_stats (
    network_name,
    block_height,
    total_transactions,
    network_hash_rate,
    average_block_time,
    gas_price,
    network_health_score,
    consensus_participation,
    active_nodes
) VALUES (
    'YumZoom-Chain',
    1024,
    15642,
    '125.3 TH/s',
    15,
    '23 Gwei',
    98.5,
    89.2,
    247
);

-- Comments for documentation
COMMENT ON TABLE ar_discovery_sessions IS 'Tracks AR restaurant discovery sessions with location and device data';
COMMENT ON TABLE ar_restaurant_interactions IS 'Records user interactions with restaurants during AR sessions';
COMMENT ON TABLE voice_assistant_sessions IS 'Manages voice assistant integration sessions';
COMMENT ON TABLE voice_commands IS 'Stores individual voice commands and their processing results';
COMMENT ON TABLE smart_speaker_connections IS 'Manages connections to smart speakers and voice assistants';
COMMENT ON TABLE iot_devices IS 'Registry of user IoT devices for smart home integration';
COMMENT ON TABLE iot_scenarios IS 'Automation scenarios for IoT device interactions';
COMMENT ON TABLE iot_scenario_executions IS 'Log of IoT scenario executions and results';
COMMENT ON TABLE blockchain_reviews IS 'Blockchain data for review authenticity and immutability';
COMMENT ON TABLE review_verification IS 'Verification status and scores for reviews';
COMMENT ON TABLE review_authenticity IS 'Authenticity analysis and scoring for reviews';
COMMENT ON TABLE blockchain_network_stats IS 'Current blockchain network statistics and health metrics';
COMMENT ON TABLE future_tech_usage IS 'Usage analytics for future technology features';
COMMENT ON TABLE feature_feedback IS 'User feedback and suggestions for future tech features';
