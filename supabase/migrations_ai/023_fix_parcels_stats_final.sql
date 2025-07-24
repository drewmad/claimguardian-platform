-- Final Fix for Florida Parcels Statistics Function
-- ================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS get_parcel_stats_by_county(TEXT);

-- Recreate with proper type casting
CREATE OR REPLACE FUNCTION get_parcel_stats_by_county(p_county_code TEXT DEFAULT NULL)
RETURNS TABLE (
    county_name TEXT,
    total_parcels BIGINT,
    total_just_value DOUBLE PRECISION,
    avg_just_value DOUBLE PRECISION,
    total_land_value DOUBLE PRECISION,
    residential_units BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.county_name,
        COUNT(p.id)::BIGINT as total_parcels,
        COALESCE(SUM(p.jv), 0)::DOUBLE PRECISION as total_just_value,
        COALESCE(AVG(p.jv), 0)::DOUBLE PRECISION as avg_just_value,
        COALESCE(SUM(p.lnd_val), 0)::DOUBLE PRECISION as total_land_value,
        COALESCE(SUM(p.no_res_unt), 0)::BIGINT as residential_units
    FROM florida_counties c
    LEFT JOIN florida_parcels p ON c.id = p.county_id
    WHERE p_county_code IS NULL OR c.county_code = p_county_code
    GROUP BY c.county_name
    ORDER BY c.county_name;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_parcel_stats_by_county(TEXT) TO anon, authenticated;