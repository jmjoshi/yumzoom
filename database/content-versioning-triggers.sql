-- Content Versioning Triggers
-- Automatic version creation when content is modified

-- Trigger function for restaurants
CREATE OR REPLACE FUNCTION trigger_restaurant_versioning()
RETURNS TRIGGER AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    change_summary text;
    version_id uuid;
BEGIN
    -- Only create version on UPDATE, not INSERT
    IF TG_OP = 'UPDATE' THEN
        -- Convert old and new rows to JSON
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Generate change summary
        change_summary := 'Restaurant updated';
        IF OLD.name != NEW.name THEN
            change_summary := change_summary || ': name changed';
        END IF;
        IF (OLD.description IS NULL AND NEW.description IS NOT NULL) OR
           (OLD.description IS NOT NULL AND NEW.description IS NULL) OR
           (OLD.description != NEW.description) THEN
            change_summary := change_summary || ': description changed';
        END IF;

        -- Create new version
        SELECT create_content_version(
            'restaurant',
            NEW.id,
            new_data,
            change_summary,
            auth.uid(),
            'Automatic version on update'
        ) INTO version_id;

        -- Create detailed change records
        PERFORM create_content_changes(
            version_id,
            'restaurant',
            NEW.id,
            old_data,
            new_data
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for menu items
CREATE OR REPLACE FUNCTION trigger_menu_item_versioning()
RETURNS TRIGGER AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    change_summary text;
    version_id uuid;
BEGIN
    -- Only create version on UPDATE, not INSERT
    IF TG_OP = 'UPDATE' THEN
        -- Convert old and new rows to JSON
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Generate change summary
        change_summary := 'Menu item updated';
        IF OLD.name != NEW.name THEN
            change_summary := change_summary || ': name changed';
        END IF;
        IF (OLD.price IS NULL AND NEW.price IS NOT NULL) OR
           (OLD.price IS NOT NULL AND NEW.price IS NULL) OR
           (OLD.price != NEW.price) THEN
            change_summary := change_summary || ': price changed';
        END IF;

        -- Create new version
        SELECT create_content_version(
            'menu_item',
            NEW.id,
            new_data,
            change_summary,
            auth.uid(),
            'Automatic version on update'
        ) INTO version_id;

        -- Create detailed change records
        PERFORM create_content_changes(
            version_id,
            'menu_item',
            NEW.id,
            old_data,
            new_data
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for restaurants and menu items
DROP TRIGGER IF EXISTS restaurant_versioning_trigger ON restaurants;
CREATE TRIGGER restaurant_versioning_trigger
    AFTER UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_restaurant_versioning();

DROP TRIGGER IF EXISTS menu_item_versioning_trigger ON menu_items;
CREATE TRIGGER menu_item_versioning_trigger
    AFTER UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_menu_item_versioning();

-- Function to manually create initial versions for existing content
CREATE OR REPLACE FUNCTION create_initial_versions()
RETURNS void AS $$
DECLARE
    restaurant_record RECORD;
    menu_item_record RECORD;
BEGIN
    -- Create initial versions for all existing restaurants
    FOR restaurant_record IN SELECT * FROM restaurants
    LOOP
        PERFORM create_content_version(
            'restaurant',
            restaurant_record.id,
            to_jsonb(restaurant_record),
            'Initial version created during system setup',
            NULL,
            'System initialization'
        );
    END LOOP;

    -- Create initial versions for all existing menu items
    FOR menu_item_record IN SELECT * FROM menu_items
    LOOP
        PERFORM create_content_version(
            'menu_item',
            menu_item_record.id,
            to_jsonb(menu_item_record),
            'Initial version created during system setup',
            NULL,
            'System initialization'
        );
    END LOOP;

    RAISE NOTICE 'Created initial versions for % restaurants and % menu items',
        (SELECT COUNT(*) FROM restaurants),
        (SELECT COUNT(*) FROM menu_items);
END;
$$ LANGUAGE plpgsql;
