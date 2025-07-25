-- Efficient Florida Counties Reference Functions

-- Function to get county by code or name
CREATE OR REPLACE FUNCTION get_florida_county(
    p_identifier TEXT -- Can be county code, county name, or partial name
)
RETURNS SETOF florida_counties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE county_code = p_identifier
       OR county_name ILIKE p_identifier
       OR county_name ILIKE p_identifier || '%'
       OR county_name ILIKE '%' || p_identifier || '%'
    ORDER BY 
        CASE 
            WHEN county_code = p_identifier THEN 1
            WHEN county_name = p_identifier THEN 2
            WHEN county_name ILIKE p_identifier || '%' THEN 3
            ELSE 4
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get county by property ID
CREATE OR REPLACE FUNCTION get_county_for_property(p_property_id UUID)
RETURNS SETOF florida_counties AS $$
BEGIN
    RETURN QUERY
    SELECT fc.*
    FROM properties p
    JOIN florida_counties fc ON p.county_id = fc.id
    WHERE p.id = p_property_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all coastal counties
CREATE OR REPLACE FUNCTION get_coastal_counties()
RETURNS SETOF florida_counties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE coastal_county = TRUE
    ORDER BY county_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get counties by region
CREATE OR REPLACE FUNCTION get_counties_by_region(p_region TEXT)
RETURNS SETOF florida_counties AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM florida_counties
    WHERE region = p_region
    ORDER BY county_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get county property appraiser info
CREATE OR REPLACE FUNCTION get_county_property_appraiser(p_county_identifier TEXT)
RETURNS TABLE (
    county_name TEXT,
    property_appraiser_website TEXT,
    property_search_url TEXT,
    gis_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.county_name,
        fc.property_appraiser_website,
        fc.property_search_url,
        fc.gis_url
    FROM get_florida_county(p_county_identifier) fc;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get county building requirements
CREATE OR REPLACE FUNCTION get_county_building_requirements(p_county_identifier TEXT)
RETURNS TABLE (
    county_name TEXT,
    building_code_version TEXT,
    wind_speed_requirement INTEGER,
    flood_elevation_requirement BOOLEAN,
    impact_glass_required BOOLEAN,
    permit_expiration_days INTEGER,
    coastal_county BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.county_name,
        fc.building_code_version,
        fc.wind_speed_requirement,
        fc.flood_elevation_requirement,
        fc.impact_glass_required,
        fc.permit_expiration_days,
        fc.coastal_county
    FROM get_florida_county(p_county_identifier) fc;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_florida_counties_property_search_url ON florida_counties(property_search_url) WHERE property_search_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_florida_counties_gis_url ON florida_counties(gis_url) WHERE gis_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_florida_counties_fema_region ON florida_counties(fema_region);

-- Add comments for documentation
COMMENT ON FUNCTION get_florida_county(TEXT) IS 'Get Florida county by code, name, or partial match';
COMMENT ON FUNCTION get_county_for_property(UUID) IS 'Get the Florida county associated with a property';
COMMENT ON FUNCTION get_coastal_counties() IS 'Get all coastal counties in Florida';
COMMENT ON FUNCTION get_counties_by_region(TEXT) IS 'Get all counties in a specific Florida region';
COMMENT ON FUNCTION get_county_property_appraiser(TEXT) IS 'Get property appraiser contact info and URLs for a county';
COMMENT ON FUNCTION get_county_building_requirements(TEXT) IS 'Get building code requirements for a specific county';