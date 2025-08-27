-- Restaurant Compliance System Database Schema
-- This migration creates all tables needed for restaurant compliance features

-- 1. Restaurant Takedown Requests
CREATE TABLE restaurant_takedown_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    requester_type text NOT NULL CHECK (requester_type IN ('owner', 'legal_representative', 'customer', 'other')),
    reason text NOT NULL CHECK (reason IN ('ownership_dispute', 'incorrect_information', 'privacy_violation', 'copyright_violation', 'other')),
    description text NOT NULL,
    contact_email text NOT NULL,
    verification_documents text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes text,
    resolution_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Business Owner Verifications
CREATE TABLE business_owner_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    business_email text NOT NULL,
    business_phone text NOT NULL,
    business_address text NOT NULL,
    verification_documents text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'requires_additional_info')),
    submitted_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason text,
    verification_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure one verification per user per restaurant
    UNIQUE(user_id, restaurant_id)
);

-- 3. Data Attributions
CREATE TABLE data_attributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type text NOT NULL CHECK (data_type IN ('restaurant_info', 'menu', 'photos', 'reviews', 'ratings')),
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    source_type text NOT NULL CHECK (source_type IN ('user_submission', 'business_owner', 'admin_entry', 'api_import', 'public_data')),
    source_id text NOT NULL,
    source_name text NOT NULL,
    contributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    original_url text,
    license_type text NOT NULL CHECK (license_type IN ('user_generated', 'business_provided', 'public_domain', 'licensed', 'fair_use')),
    created_at timestamp with time zone DEFAULT now(),
    last_verified timestamp with time zone,
    verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'disputed', 'removed')),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Legal Notices
CREATE TABLE legal_notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('takedown_notice', 'copyright_claim', 'trademark_dispute', 'privacy_complaint', 'data_correction')),
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
    claimant_name text NOT NULL,
    claimant_email text NOT NULL,
    claimant_type text NOT NULL CHECK (claimant_type IN ('individual', 'business', 'legal_representative')),
    description text NOT NULL,
    affected_content text[] NOT NULL DEFAULT '{}',
    legal_basis text NOT NULL,
    requested_action text NOT NULL CHECK (requested_action IN ('remove', 'modify', 'attribute', 'clarify')),
    supporting_documents text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'under_review', 'resolved', 'rejected')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    submitted_at timestamp with time zone DEFAULT now(),
    review_deadline timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    resolution text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Restaurant Owners (Enhanced from existing)
CREATE TABLE IF NOT EXISTS restaurant_owners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'representative')),
    verified boolean DEFAULT false,
    verified_at timestamp with time zone,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    permissions jsonb DEFAULT '{"can_edit": true, "can_respond_reviews": true, "can_manage_menu": true}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure one role per user per restaurant
    UNIQUE(user_id, restaurant_id)
);

-- Create indexes for performance
CREATE INDEX idx_takedown_requests_restaurant ON restaurant_takedown_requests(restaurant_id);
CREATE INDEX idx_takedown_requests_status ON restaurant_takedown_requests(status);
CREATE INDEX idx_takedown_requests_submitted ON restaurant_takedown_requests(submitted_at DESC);

CREATE INDEX idx_business_verifications_user ON business_owner_verifications(user_id);
CREATE INDEX idx_business_verifications_restaurant ON business_owner_verifications(restaurant_id);
CREATE INDEX idx_business_verifications_status ON business_owner_verifications(status);

CREATE INDEX idx_data_attributions_restaurant ON data_attributions(restaurant_id);
CREATE INDEX idx_data_attributions_type ON data_attributions(data_type);
CREATE INDEX idx_data_attributions_source ON data_attributions(source_type);

CREATE INDEX idx_legal_notices_type ON legal_notices(type);
CREATE INDEX idx_legal_notices_status ON legal_notices(status);
CREATE INDEX idx_legal_notices_priority ON legal_notices(priority);
CREATE INDEX idx_legal_notices_deadline ON legal_notices(review_deadline);

CREATE INDEX idx_restaurant_owners_user ON restaurant_owners(user_id);
CREATE INDEX idx_restaurant_owners_restaurant ON restaurant_owners(restaurant_id);
CREATE INDEX idx_restaurant_owners_verified ON restaurant_owners(verified);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE restaurant_takedown_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_owner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_owners ENABLE ROW LEVEL SECURITY;

-- Restaurant Takedown Requests Policies
CREATE POLICY "Users can view their own takedown requests" ON restaurant_takedown_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create takedown requests" ON restaurant_takedown_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all takedown requests" ON restaurant_takedown_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'legal_team')
        )
    );

-- Business Owner Verifications Policies
CREATE POLICY "Users can view their own verification requests" ON business_owner_verifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create verification requests" ON business_owner_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending verifications" ON business_owner_verifications
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND status = 'pending'
    );

CREATE POLICY "Admins can manage all verifications" ON business_owner_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'verification_team')
        )
    );

-- Data Attributions Policies
CREATE POLICY "Contributors can view their attributions" ON data_attributions
    FOR SELECT USING (
        contributor_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "System can create attributions" ON data_attributions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage attributions" ON data_attributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- Legal Notices Policies
CREATE POLICY "Admins can view all legal notices" ON legal_notices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'legal_team')
        )
    );

CREATE POLICY "Anyone can submit legal notices" ON legal_notices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Legal team can manage notices" ON legal_notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'legal_team')
        )
    );

-- Restaurant Owners Policies
CREATE POLICY "Users can view their restaurant ownerships" ON restaurant_owners
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Verified owners can update their restaurant data" ON restaurant_owners
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND verified = true
    );

CREATE POLICY "Admins can manage restaurant owners" ON restaurant_owners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_role IN ('admin', 'verification_team')
        )
    );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_restaurant_takedown_requests_updated_at 
    BEFORE UPDATE ON restaurant_takedown_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_owner_verifications_updated_at 
    BEFORE UPDATE ON business_owner_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_attributions_updated_at 
    BEFORE UPDATE ON data_attributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_notices_updated_at 
    BEFORE UPDATE ON legal_notices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_owners_updated_at 
    BEFORE UPDATE ON restaurant_owners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create compliance notification function
CREATE OR REPLACE FUNCTION notify_compliance_team()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify via pg_notify for real-time updates
    PERFORM pg_notify('compliance_update', json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'id', NEW.id,
        'type', CASE 
            WHEN TG_TABLE_NAME = 'legal_notices' THEN NEW.type
            WHEN TG_TABLE_NAME = 'restaurant_takedown_requests' THEN NEW.reason
            ELSE 'general'
        END,
        'priority', CASE 
            WHEN TG_TABLE_NAME = 'legal_notices' THEN NEW.priority
            WHEN TG_TABLE_NAME = 'restaurant_takedown_requests' AND NEW.reason IN ('copyright_violation', 'privacy_violation') THEN 'high'
            ELSE 'medium'
        END,
        'timestamp', now()
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification triggers
CREATE TRIGGER notify_compliance_on_takedown_request
    AFTER INSERT ON restaurant_takedown_requests
    FOR EACH ROW EXECUTE FUNCTION notify_compliance_team();

CREATE TRIGGER notify_compliance_on_legal_notice
    AFTER INSERT ON legal_notices
    FOR EACH ROW EXECUTE FUNCTION notify_compliance_team();

-- Create compliance dashboard view
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM restaurant_takedown_requests WHERE status = 'pending') as pending_takedowns,
    (SELECT COUNT(*) FROM business_owner_verifications WHERE status = 'pending') as pending_verifications,
    (SELECT COUNT(*) FROM legal_notices WHERE status IN ('received', 'under_review')) as active_legal_notices,
    (SELECT COUNT(*) FROM data_attributions WHERE created_at >= now() - interval '7 days') as recent_attributions,
    (SELECT COUNT(*) FROM legal_notices WHERE priority IN ('high', 'urgent') AND status IN ('received', 'under_review')) as urgent_items;

-- Grant necessary permissions
GRANT SELECT ON compliance_dashboard TO authenticated;
GRANT ALL ON restaurant_takedown_requests TO service_role;
GRANT ALL ON business_owner_verifications TO service_role;
GRANT ALL ON data_attributions TO service_role;
GRANT ALL ON legal_notices TO service_role;
GRANT ALL ON restaurant_owners TO service_role;
