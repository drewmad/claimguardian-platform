-- Fix Florida Parcels Statistics Function Type Mismatch
-- =====================================================

-- Drop and recreate the function with correct types
DROP FUNCTION IF EXISTS get_parcel_stats_by_county(TEXT);

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
        COUNT(p.id) as total_parcels,
        SUM(p.jv)::DOUBLE PRECISION as total_just_value,
        AVG(p.jv)::DOUBLE PRECISION as avg_just_value,
        SUM(p.lnd_val)::DOUBLE PRECISION as total_land_value,
        COALESCE(SUM(p.no_res_unt::BIGINT), 0) as residential_units
    FROM florida_parcels p
    JOIN florida_counties c ON p.county_id = c.id
    WHERE p_county_code IS NULL OR c.county_code = p_county_code
    GROUP BY c.county_name
    ORDER BY c.county_name;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get parcel counts by county
CREATE OR REPLACE FUNCTION get_parcel_counts_by_county()
RETURNS TABLE (
    county_name TEXT,
    county_code TEXT,
    parcel_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.county_name,
        c.county_code,
        COUNT(p.id) as parcel_count
    FROM florida_counties c
    LEFT JOIN florida_parcels p ON c.id = p.county_id
    GROUP BY c.county_name, c.county_code
    ORDER BY c.county_name;
END;
$$ LANGUAGE plpgsql;

-- Add a function to check florida_parcels table readiness
CREATE OR REPLACE FUNCTION check_florida_parcels_status()
RETURNS TABLE (
    table_status TEXT,
    total_rows BIGINT,
    counties_with_data BIGINT,
    indexes_count BIGINT,
    has_rls BOOLEAN,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'florida_parcels table ready for data import'::TEXT as table_status,
        COUNT(*)::BIGINT as total_rows,
        COUNT(DISTINCT county_fips)::BIGINT as counties_with_data,
        (SELECT COUNT(*)::BIGINT FROM pg_indexes WHERE tablename = 'florida_parcels') as indexes_count,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'florida_parcels') as has_rls,
        MAX(created_at) as last_updated
    FROM florida_parcels;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_parcel_stats_by_county(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_parcel_counts_by_county() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_florida_parcels_status() TO anon, authenticated;