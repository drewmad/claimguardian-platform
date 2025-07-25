-- Add county reference to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS county_id UUID REFERENCES florida_counties(id),
ADD COLUMN IF NOT EXISTS county_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county_id);
CREATE INDEX IF NOT EXISTS idx_properties_county_name ON properties(county_name);

-- Function to extract county from address
CREATE OR REPLACE FUNCTION extract_county_from_address(p_address TEXT)
RETURNS TEXT AS $$
DECLARE
    v_county_name TEXT;
    v_address_upper TEXT;
BEGIN
    -- Convert to uppercase for easier matching
    v_address_upper := UPPER(p_address);
    
    -- Try to extract county name from address
    -- Pattern 1: "City, County County, FL"
    IF v_address_upper ~ ', [A-Z\s]+ COUNTY,' THEN
        v_county_name := REGEXP_REPLACE(v_address_upper, '.*,\s*([A-Z\s]+)\s+COUNTY,.*', '\1', 'g');
        v_county_name := TRIM(v_county_name);
    -- Pattern 2: Look for county names in the address
    ELSE
        -- Check each county name
        SELECT county_name INTO v_county_name
        FROM florida_counties
        WHERE v_address_upper LIKE '%' || UPPER(county_name) || '%'
        LIMIT 1;
    END IF;
    
    -- Clean up the county name
    IF v_county_name IS NOT NULL THEN
        -- Proper case the county name
        v_county_name := INITCAP(LOWER(v_county_name));
        -- Remove extra spaces
        v_county_name := REGEXP_REPLACE(v_county_name, '\s+', ' ', 'g');
    END IF;
    
    RETURN v_county_name;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-populate county_id based on address
CREATE OR REPLACE FUNCTION auto_populate_county()
RETURNS TRIGGER AS $$
DECLARE
    v_county_name TEXT;
    v_county_id UUID;
BEGIN
    -- Only process if county_id is not already set
    IF NEW.county_id IS NULL AND NEW.address IS NOT NULL THEN
        -- Extract county name from address
        v_county_name := extract_county_from_address(NEW.address);
        
        -- Look up county_id
        IF v_county_name IS NOT NULL THEN
            SELECT id INTO v_county_id
            FROM florida_counties
            WHERE county_name = v_county_name
            OR county_name = v_county_name || ' County'
            OR county_name = REPLACE(v_county_name, ' County', '')
            LIMIT 1;
            
            IF v_county_id IS NOT NULL THEN
                NEW.county_id := v_county_id;
                NEW.county_name := v_county_name;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new properties (INSERT only)
CREATE TRIGGER trigger_auto_populate_county_insert
BEFORE INSERT ON properties
FOR EACH ROW
WHEN (NEW.county_id IS NULL)
EXECUTE FUNCTION auto_populate_county();

-- Create trigger for updates (UPDATE only)
CREATE TRIGGER trigger_auto_populate_county_update
BEFORE UPDATE ON properties
FOR EACH ROW
WHEN (NEW.address IS DISTINCT FROM OLD.address OR NEW.county_id IS NULL)
EXECUTE FUNCTION auto_populate_county();

-- Function to update all existing properties with county information
CREATE OR REPLACE FUNCTION update_all_property_counties()
RETURNS void AS $$
DECLARE
    v_property RECORD;
    v_county_name TEXT;
    v_county_id UUID;
    v_updated INTEGER := 0;
BEGIN
    -- Loop through all properties without county_id
    FOR v_property IN 
        SELECT id, address 
        FROM properties 
        WHERE county_id IS NULL AND address IS NOT NULL
    LOOP
        -- Extract county from address
        v_county_name := extract_county_from_address(v_property.address);
        
        IF v_county_name IS NOT NULL THEN
            -- Look up county_id
            SELECT id INTO v_county_id
            FROM florida_counties
            WHERE county_name = v_county_name
            OR county_name = v_county_name || ' County'
            OR county_name = REPLACE(v_county_name, ' County', '')
            LIMIT 1;
            
            -- Update property
            IF v_county_id IS NOT NULL THEN
                UPDATE properties
                SET county_id = v_county_id,
                    county_name = v_county_name
                WHERE id = v_property.id;
                
                v_updated := v_updated + 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated % properties with county information', v_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to get county-specific requirements for a property
CREATE OR REPLACE FUNCTION get_property_county_requirements(p_property_id UUID)
RETURNS TABLE (
    requirement_type TEXT,
    requirement_value TEXT,
    requirement_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Wind Speed Requirement' as requirement_type,
        fc.wind_speed_requirement || ' mph' as requirement_value,
        jsonb_build_object(
            'coastal_county', fc.coastal_county,
            'region', fc.region
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Impact Glass Required' as requirement_type,
        CASE WHEN fc.impact_glass_required THEN 'Yes' ELSE 'No' END as requirement_value,
        jsonb_build_object(
            'wind_speed', fc.wind_speed_requirement
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Flood Elevation Required' as requirement_type,
        CASE WHEN fc.flood_elevation_requirement THEN 'Yes' ELSE 'No' END as requirement_value,
        jsonb_build_object(
            'flood_zone_maps_url', fc.flood_zone_maps_url
        ) as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Building Code Version' as requirement_type,
        fc.building_code_version as requirement_value,
        NULL as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id
    
    UNION ALL
    
    SELECT 
        'Permit Expiration' as requirement_type,
        fc.permit_expiration_days || ' days' as requirement_value,
        NULL as requirement_details
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function
COMMENT ON FUNCTION get_property_county_requirements(UUID) IS 'Get all county-specific building and insurance requirements for a property';