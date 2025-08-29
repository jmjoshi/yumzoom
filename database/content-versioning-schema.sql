-- Content Versioning System Schema
-- Implementation for YumZoom platform content change tracking and rollback capabilities

-- Content versions table - stores complete snapshots of content at specific points in time
CREATE TABLE content_versions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_type text NOT NULL, -- 'restaurant', 'menu_item', 'review', etc.
    content_id uuid NOT NULL, -- Foreign key to the actual content
    version_number integer NOT NULL, -- Incremental version number for this content item
    content_data jsonb NOT NULL, -- Complete snapshot of the content at this version
    change_summary text, -- Brief description of what changed
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- User who made the change
    change_reason text, -- Reason for the change (optional)
    is_current boolean DEFAULT false, -- Whether this is the current active version
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Ensure only one current version per content item
    UNIQUE(content_type, content_id, is_current),
    -- Ensure version numbers are sequential
    UNIQUE(content_type, content_id, version_number)
);

-- Content changes table - tracks specific field-level changes
CREATE TABLE content_changes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    version_id uuid REFERENCES content_versions(id) ON DELETE CASCADE NOT NULL,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    field_name text NOT NULL, -- Name of the field that changed
    old_value text, -- Previous value (NULL for new fields)
    new_value text, -- New value (NULL for deleted fields)
    change_type text NOT NULL, -- 'added', 'modified', 'deleted'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content version metadata - additional information about versions
CREATE TABLE content_version_metadata (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    version_id uuid REFERENCES content_versions(id) ON DELETE CASCADE NOT NULL,
    metadata_key text NOT NULL,
    metadata_value text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    UNIQUE(version_id, metadata_key)
);

-- Create indexes for better performance
CREATE INDEX idx_content_versions_content ON content_versions(content_type, content_id);
CREATE INDEX idx_content_versions_current ON content_versions(content_type, content_id, is_current);
CREATE INDEX idx_content_versions_created ON content_versions(created_at);
CREATE INDEX idx_content_changes_version ON content_changes(version_id);
CREATE INDEX idx_content_changes_content ON content_changes(content_type, content_id);
CREATE INDEX idx_content_version_metadata_version ON content_version_metadata(version_id);

-- Function to create a new version when content is updated
CREATE OR REPLACE FUNCTION create_content_version(
    p_content_type text,
    p_content_id uuid,
    p_content_data jsonb,
    p_change_summary text DEFAULT NULL,
    p_changed_by uuid DEFAULT NULL,
    p_change_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_version_id uuid;
    current_version_number integer;
BEGIN
    -- Get the current highest version number for this content
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO current_version_number
    FROM content_versions
    WHERE content_type = p_content_type AND content_id = p_content_id;

    -- Mark previous current version as not current
    UPDATE content_versions
    SET is_current = false
    WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND is_current = true;

    -- Insert new version
    INSERT INTO content_versions (
        content_type,
        content_id,
        version_number,
        content_data,
        change_summary,
        changed_by,
        change_reason,
        is_current
    ) VALUES (
        p_content_type,
        p_content_id,
        current_version_number,
        p_content_data,
        p_change_summary,
        p_changed_by,
        p_change_reason,
        true
    ) RETURNING id INTO new_version_id;

    RETURN new_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to compare two JSON objects and create change records
CREATE OR REPLACE FUNCTION create_content_changes(
    p_version_id uuid,
    p_content_type text,
    p_content_id uuid,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
    field_name text;
    old_value text;
    new_value text;
BEGIN
    -- If no old data, all fields are additions
    IF p_old_data IS NULL THEN
        FOR field_name IN SELECT jsonb_object_keys(p_new_data)
        LOOP
            new_value := p_new_data->>field_name;
            IF new_value IS NOT NULL THEN
                INSERT INTO content_changes (
                    version_id, content_type, content_id,
                    field_name, old_value, new_value, change_type
                ) VALUES (
                    p_version_id, p_content_type, p_content_id,
                    field_name, NULL, new_value, 'added'
                );
            END IF;
        END LOOP;
        RETURN;
    END IF;

    -- Compare old and new data
    FOR field_name IN
        SELECT DISTINCT key
        FROM (
            SELECT jsonb_object_keys(p_old_data) as key
            UNION
            SELECT jsonb_object_keys(p_new_data) as key
        ) as all_keys
    LOOP
        old_value := p_old_data->>field_name;
        new_value := p_new_data->>field_name;

        -- Determine change type
        IF old_value IS NULL AND new_value IS NOT NULL THEN
            -- Field was added
            INSERT INTO content_changes (
                version_id, content_type, content_id,
                field_name, old_value, new_value, change_type
            ) VALUES (
                p_version_id, p_content_type, p_content_id,
                field_name, old_value, new_value, 'added'
            );
        ELSIF old_value IS NOT NULL AND new_value IS NULL THEN
            -- Field was deleted
            INSERT INTO content_changes (
                version_id, content_type, content_id,
                field_name, old_value, new_value, change_type
            ) VALUES (
                p_version_id, p_content_type, p_content_id,
                field_name, old_value, new_value, 'deleted'
            );
        ELSIF old_value != new_value THEN
            -- Field was modified
            INSERT INTO content_changes (
                version_id, content_type, content_id,
                field_name, old_value, new_value, change_type
            ) VALUES (
                p_version_id, p_content_type, p_content_id,
                field_name, old_value, new_value, 'modified'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get version history for content
CREATE OR REPLACE FUNCTION get_content_version_history(
    p_content_type text,
    p_content_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    version_id uuid,
    version_number integer,
    content_data jsonb,
    change_summary text,
    changed_by_name text,
    change_reason text,
    created_at timestamp with time zone,
    is_current boolean,
    changes_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cv.id,
        cv.version_number,
        cv.content_data,
        cv.change_summary,
        COALESCE(up.first_name || ' ' || up.last_name, 'System') as changed_by_name,
        cv.change_reason,
        cv.created_at,
        cv.is_current,
        COUNT(cc.id)::integer as changes_count
    FROM content_versions cv
    LEFT JOIN user_profiles up ON cv.changed_by = up.id
    LEFT JOIN content_changes cc ON cv.id = cc.version_id
    WHERE cv.content_type = p_content_type
    AND cv.content_id = p_content_id
    GROUP BY cv.id, cv.version_number, cv.content_data, cv.change_summary,
             up.first_name, up.last_name, cv.change_reason, cv.created_at, cv.is_current
    ORDER BY cv.version_number DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback content to a specific version
CREATE OR REPLACE FUNCTION rollback_content_to_version(
    p_version_id uuid,
    p_rollback_reason text DEFAULT 'Manual rollback',
    p_rollback_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    target_version content_versions%ROWTYPE;
    current_data jsonb;
    table_name text;
    update_query text;
BEGIN
    -- Get the target version
    SELECT * INTO target_version
    FROM content_versions
    WHERE id = p_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found';
    END IF;

    -- Get current data for comparison
    CASE target_version.content_type
        WHEN 'restaurant' THEN
            SELECT to_jsonb(r) INTO current_data
            FROM restaurants r
            WHERE id = target_version.content_id;
            table_name := 'restaurants';
        WHEN 'menu_item' THEN
            SELECT to_jsonb(mi) INTO current_data
            FROM menu_items mi
            WHERE id = target_version.content_id;
            table_name := 'menu_items';
        ELSE
            RAISE EXCEPTION 'Unsupported content type for rollback: %', target_version.content_type;
    END CASE;

    -- Create a version of the current state before rollback
    PERFORM create_content_version(
        target_version.content_type,
        target_version.content_id,
        current_data,
        'Pre-rollback snapshot',
        p_rollback_by,
        p_rollback_reason
    );

    -- Perform the rollback by updating the target table
    CASE target_version.content_type
        WHEN 'restaurant' THEN
            UPDATE restaurants SET
                name = (target_version.content_data->>'name')::text,
                description = (target_version.content_data->>'description')::text,
                address = (target_version.content_data->>'address')::text,
                phone = (target_version.content_data->>'phone')::text,
                website = (target_version.content_data->>'website')::text,
                cuisine_type = (target_version.content_data->>'cuisine_type')::text,
                image_url = (target_version.content_data->>'image_url')::text,
                updated_at = NOW()
            WHERE id = target_version.content_id;
        WHEN 'menu_item' THEN
            UPDATE menu_items SET
                name = (target_version.content_data->>'name')::text,
                description = (target_version.content_data->>'description')::text,
                price = (target_version.content_data->>'price')::decimal,
                category = (target_version.content_data->>'category')::text,
                image_url = (target_version.content_data->>'image_url')::text,
                updated_at = NOW()
            WHERE id = target_version.content_id;
    END CASE;

    -- Create a version of the rolled back state
    PERFORM create_content_version(
        target_version.content_type,
        target_version.content_id,
        target_version.content_data,
        'Rolled back to version ' || target_version.version_number,
        p_rollback_by,
        p_rollback_reason
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_version_metadata ENABLE ROW LEVEL SECURITY;

-- Content versions - Admin only for viewing, system for writing
CREATE POLICY "Admins can view all content versions" ON content_versions
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Content changes - Admin only
CREATE POLICY "Admins can view all content changes" ON content_changes
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Version metadata - Admin only
CREATE POLICY "Admins can manage version metadata" ON content_version_metadata
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM user_profiles
        WHERE id = auth.uid()
        -- Add admin role check when role system is implemented
    ));

-- Add updated_at triggers
CREATE TRIGGER update_content_versions_updated_at
    BEFORE UPDATE ON content_versions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert default metadata for system
INSERT INTO content_version_metadata (version_id, metadata_key, metadata_value)
SELECT
    cv.id,
    'system_generated',
    'true'
FROM content_versions cv
WHERE cv.changed_by IS NULL;

COMMENT ON TABLE content_versions IS 'Complete version history for all content changes with snapshots';
COMMENT ON TABLE content_changes IS 'Detailed field-level changes for each version';
COMMENT ON TABLE content_version_metadata IS 'Additional metadata for content versions';
