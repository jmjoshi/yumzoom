-- Content Moderation & Community Features - Database Schema
-- Implementation for YumZoom platform safety and quality control

-- Content moderation configuration table
CREATE TABLE content_moderation_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_type text NOT NULL, -- 'profanity_filter', 'spam_detection', 'ai_moderation', etc.
    enabled boolean DEFAULT true,
    threshold_score decimal(5,2) DEFAULT 0.7, -- AI confidence threshold
    auto_action text DEFAULT 'flag', -- 'approve', 'flag', 'reject', 'delete'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content reports table for user reporting
CREATE TABLE content_reports (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type text NOT NULL, -- 'review', 'photo', 'response', 'profile'
    content_id uuid NOT NULL, -- Foreign key to the reported content
    report_category text NOT NULL, -- 'inappropriate', 'spam', 'fake', 'harassment', 'other'
    report_reason text, -- Additional explanation from reporter
    report_details jsonb, -- Additional structured data
    status text DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    admin_notes text,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content moderation queue for manual review
CREATE TABLE content_moderation_queue (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL, -- 'review', 'photo', 'response', 'profile'
    content_id uuid NOT NULL,
    content_data jsonb NOT NULL, -- Snapshot of content for review
    moderation_reason text NOT NULL, -- 'ai_flagged', 'user_reported', 'pattern_detected'
    ai_confidence_score decimal(5,2), -- AI moderation confidence
    priority_level integer DEFAULT 3, -- 1=high, 2=medium, 3=low
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected'
    moderator_notes text,
    action_taken text, -- 'approved', 'edited', 'deleted', 'warned_user'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content quality scores for all user-generated content
CREATE TABLE content_quality_scores (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    quality_score decimal(5,2) NOT NULL, -- 0.0 to 1.0 quality score
    helpfulness_score decimal(5,2), -- Based on user votes
    authenticity_score decimal(5,2), -- AI-based authenticity assessment
    readability_score decimal(5,2), -- Text readability assessment
    photo_quality_score decimal(5,2), -- Photo quality assessment
    engagement_score decimal(5,2), -- User engagement metrics
    calculated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(content_type, content_id)
);

-- Community guidelines violations tracking
CREATE TABLE community_guidelines_violations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    violation_type text NOT NULL, -- 'spam', 'harassment', 'inappropriate_content', 'fake_review'
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    severity_level integer NOT NULL, -- 1=minor, 2=moderate, 3=severe
    description text NOT NULL,
    action_taken text NOT NULL, -- 'warning', 'content_removed', 'temporary_suspension', 'permanent_ban'
    moderator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamp with time zone, -- For temporary actions
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User trust scores and reputation system
CREATE TABLE user_trust_scores (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    trust_score decimal(5,2) DEFAULT 1.0, -- 0.0 to 1.0, starts at 1.0
    reputation_points integer DEFAULT 0,
    helpful_reviews_count integer DEFAULT 0,
    reported_content_count integer DEFAULT 0,
    violations_count integer DEFAULT 0,
    last_violation_at timestamp with time zone,
    account_status text DEFAULT 'good_standing', -- 'good_standing', 'warning', 'restricted', 'suspended'
    calculated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Moderation AI analysis results
CREATE TABLE ai_moderation_results (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    content_text text, -- Text content analyzed
    analysis_type text NOT NULL, -- 'sentiment', 'toxicity', 'spam', 'authenticity'
    confidence_score decimal(5,2) NOT NULL,
    classification text NOT NULL, -- Result classification
    details jsonb, -- Detailed analysis results
    model_version text NOT NULL, -- AI model version used
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_user_id);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at);

CREATE INDEX idx_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON content_moderation_queue(priority_level);
CREATE INDEX idx_moderation_queue_content ON content_moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_queue_assigned ON content_moderation_queue(assigned_to);

CREATE INDEX idx_quality_scores_content ON content_quality_scores(content_type, content_id);
CREATE INDEX idx_quality_scores_quality ON content_quality_scores(quality_score);

CREATE INDEX idx_violations_user_id ON community_guidelines_violations(user_id);
CREATE INDEX idx_violations_type ON community_guidelines_violations(violation_type);
CREATE INDEX idx_violations_severity ON community_guidelines_violations(severity_level);

CREATE INDEX idx_trust_scores_score ON user_trust_scores(trust_score);
CREATE INDEX idx_trust_scores_status ON user_trust_scores(account_status);

CREATE INDEX idx_ai_results_content ON ai_moderation_results(content_type, content_id);
CREATE INDEX idx_ai_results_type ON ai_moderation_results(analysis_type);

-- Add updated_at triggers
CREATE TRIGGER update_content_moderation_settings_updated_at
    BEFORE UPDATE ON content_moderation_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_reports_updated_at
    BEFORE UPDATE ON content_reports
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_moderation_queue_updated_at
    BEFORE UPDATE ON content_moderation_queue
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_community_guidelines_violations_updated_at
    BEFORE UPDATE ON community_guidelines_violations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_trust_scores_updated_at
    BEFORE UPDATE ON user_trust_scores
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE content_moderation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_guidelines_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_moderation_results ENABLE ROW LEVEL SECURITY;

-- Content moderation settings - Admin only
CREATE POLICY "Admins can manage moderation settings" ON content_moderation_settings
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid() 
        -- Add admin role check here when role system is implemented
    ));

-- Content reports policies
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view all reports" ON content_reports
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid()
        -- Add admin role check here when role system is implemented
    ));

CREATE POLICY "Admins can update reports" ON content_reports
    FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid()
        -- Add admin role check here when role system is implemented
    ));

-- Moderation queue - Admin only
CREATE POLICY "Admins can manage moderation queue" ON content_moderation_queue
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid()
        -- Add admin role check here when role system is implemented
    ));

-- Quality scores - Public read, system write
CREATE POLICY "Anyone can view quality scores" ON content_quality_scores
    FOR SELECT USING (true);

-- Violations - Users can view their own, admins can view all
CREATE POLICY "Users can view their own violations" ON community_guidelines_violations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all violations" ON community_guidelines_violations
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid()
        -- Add admin role check here when role system is implemented
    ));

-- Trust scores - Users can view their own, public can view basic info
CREATE POLICY "Users can view their own trust score" ON user_trust_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public trust info" ON user_trust_scores
    FOR SELECT USING (true); -- Limited to trust_score and reputation_points only in queries

-- AI results - Admin only
CREATE POLICY "Admins can view AI moderation results" ON ai_moderation_results
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE id = auth.uid()
        -- Add admin role check here when role system is implemented
    ));

-- Functions for content moderation

-- Function to calculate content quality score
CREATE OR REPLACE FUNCTION calculate_content_quality_score(
    p_content_type text,
    p_content_id uuid,
    p_text_content text DEFAULT NULL
)
RETURNS decimal(5,2) AS $$
DECLARE
    quality_score decimal(5,2) := 0.5; -- Base score
    text_length integer;
    helpful_votes_ratio decimal(5,2);
    user_trust decimal(5,2);
BEGIN
    -- Text quality assessment
    IF p_text_content IS NOT NULL THEN
        text_length := char_length(trim(p_text_content));
        
        -- Length-based scoring
        CASE 
            WHEN text_length >= 100 THEN quality_score := quality_score + 0.2;
            WHEN text_length >= 50 THEN quality_score := quality_score + 0.1;
            WHEN text_length < 10 THEN quality_score := quality_score - 0.2;
        END CASE;
        
        -- Check for excessive caps (potential spam)
        IF (SELECT char_length(regexp_replace(p_text_content, '[^A-Z]', '', 'g'))) > text_length * 0.5 THEN
            quality_score := quality_score - 0.3;
        END IF;
    END IF;
    
    -- Helpfulness-based scoring for reviews
    IF p_content_type = 'review' THEN
        SELECT 
            CASE 
                WHEN (helpful_count + not_helpful_count) > 0 
                THEN helpful_count::decimal / (helpful_count + not_helpful_count)
                ELSE 0.5 
            END
        INTO helpful_votes_ratio
        FROM ratings_with_votes 
        WHERE id = p_content_id;
        
        quality_score := quality_score + (helpful_votes_ratio * 0.3);
    END IF;
    
    -- User trust factor
    SELECT COALESCE(trust_score, 1.0)
    INTO user_trust
    FROM user_trust_scores uts
    JOIN ratings r ON r.user_id = uts.user_id
    WHERE r.id = p_content_id AND p_content_type = 'review'
    UNION ALL
    SELECT COALESCE(trust_score, 1.0)
    FROM user_trust_scores uts
    JOIN review_photos rp ON rp.rating_id IN (
        SELECT id FROM ratings WHERE user_id = uts.user_id
    )
    WHERE rp.id = p_content_id AND p_content_type = 'photo';
    
    quality_score := quality_score * COALESCE(user_trust, 1.0);
    
    -- Ensure score is within bounds
    quality_score := GREATEST(0.0, LEAST(1.0, quality_score));
    
    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update user trust score
CREATE OR REPLACE FUNCTION update_user_trust_score(p_user_id uuid)
RETURNS void AS $$
DECLARE
    new_trust_score decimal(5,2);
    helpful_reviews integer;
    total_reviews integer;
    violations integer;
    recent_violations integer;
BEGIN
    -- Count helpful reviews
    SELECT COUNT(*) INTO helpful_reviews
    FROM ratings_with_votes rwv
    WHERE rwv.user_id = p_user_id 
    AND rwv.net_helpfulness > 0;
    
    -- Count total reviews
    SELECT COUNT(*) INTO total_reviews
    FROM ratings
    WHERE user_id = p_user_id;
    
    -- Count violations
    SELECT COUNT(*) INTO violations
    FROM community_guidelines_violations
    WHERE user_id = p_user_id;
    
    -- Count recent violations (last 30 days)
    SELECT COUNT(*) INTO recent_violations
    FROM community_guidelines_violations
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Calculate trust score
    new_trust_score := 1.0; -- Base score
    
    -- Positive factors
    IF total_reviews > 0 THEN
        new_trust_score := new_trust_score + (helpful_reviews::decimal / total_reviews * 0.3);
    END IF;
    
    -- Negative factors
    new_trust_score := new_trust_score - (violations * 0.1);
    new_trust_score := new_trust_score - (recent_violations * 0.2);
    
    -- Ensure within bounds
    new_trust_score := GREATEST(0.0, LEAST(1.0, new_trust_score));
    
    -- Update or insert trust score
    INSERT INTO user_trust_scores (
        user_id, trust_score, helpful_reviews_count, violations_count, calculated_at
    ) VALUES (
        p_user_id, new_trust_score, helpful_reviews, violations, NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        trust_score = new_trust_score,
        helpful_reviews_count = helpful_reviews,
        violations_count = violations,
        calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-moderate content based on AI results
CREATE OR REPLACE FUNCTION auto_moderate_content(
    p_content_type text,
    p_content_id uuid,
    p_analysis_type text,
    p_confidence_score decimal(5,2),
    p_classification text
)
RETURNS text AS $$
DECLARE
    threshold decimal(5,2);
    auto_action text;
    should_queue boolean := false;
BEGIN
    -- Get moderation settings
    SELECT threshold_score, auto_action 
    INTO threshold, auto_action
    FROM content_moderation_settings
    WHERE setting_type = p_analysis_type AND enabled = true;
    
    -- If no settings found, use defaults
    IF threshold IS NULL THEN
        threshold := 0.7;
        auto_action := 'flag';
    END IF;
    
    -- Check if confidence exceeds threshold
    IF p_confidence_score >= threshold THEN
        CASE auto_action
            WHEN 'approve' THEN
                RETURN 'approved';
            WHEN 'flag' THEN
                should_queue := true;
            WHEN 'reject' THEN
                should_queue := true;
            WHEN 'delete' THEN
                -- This would trigger content deletion in the application
                RETURN 'deleted';
        END CASE;
    END IF;
    
    -- Add to moderation queue if flagged
    IF should_queue THEN
        INSERT INTO content_moderation_queue (
            content_type, content_id, moderation_reason, ai_confidence_score, priority_level
        ) VALUES (
            p_content_type, p_content_id, 'ai_flagged', p_confidence_score,
            CASE 
                WHEN p_confidence_score >= 0.9 THEN 1 -- High priority
                WHEN p_confidence_score >= 0.8 THEN 2 -- Medium priority
                ELSE 3 -- Low priority
            END
        );
        
        RETURN 'queued_for_review';
    END IF;
    
    RETURN 'approved';
END;
$$ LANGUAGE plpgsql;

-- Insert default moderation settings
INSERT INTO content_moderation_settings (setting_type, enabled, threshold_score, auto_action) VALUES
('profanity_filter', true, 0.8, 'flag'),
('spam_detection', true, 0.7, 'flag'),
('toxicity_detection', true, 0.8, 'flag'),
('authenticity_check', true, 0.6, 'flag'),
('sentiment_analysis', true, 0.9, 'approve');

COMMENT ON TABLE content_reports IS 'User reports for inappropriate content across the platform';
COMMENT ON TABLE content_moderation_queue IS 'Queue for content requiring manual moderation review';
COMMENT ON TABLE content_quality_scores IS 'Automated quality scoring for all user-generated content';
COMMENT ON TABLE community_guidelines_violations IS 'Track violations and enforcement actions';
COMMENT ON TABLE user_trust_scores IS 'User reputation and trust scoring system';
COMMENT ON TABLE ai_moderation_results IS 'AI-powered content analysis results and classifications';
